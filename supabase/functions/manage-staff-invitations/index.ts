import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2.100.0";
import {
  marketplaceCorsHeaders,
  marketplaceJsonResponse,
} from "../_shared/marketplace.ts";
import {
  hasExactKeys,
  isInvitedStaffRole,
  isValidStaffEmail,
  normalizeStaffEmail,
  normalizeStaffName,
  safeStaffFailureReason,
  STAFF_INVITE_EXPIRY_MS,
  STAFF_INVITE_RESEND_COOLDOWN_MS,
  type InvitedStaffRole,
} from "../_shared/staff-invitations.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim() ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables for staff invitations.");
}

type InvitationStatus =
  | "creating"
  | "pending"
  | "accepted"
  | "expired"
  | "cancelled"
  | "failed";

interface InvitationRow {
  id: string;
  email: string;
  normalized_email: string;
  full_name: string;
  invited_role: InvitedStaffRole;
  status: InvitationStatus;
  invited_by: string;
  invited_user_id: string | null;
  created_at: string;
  expires_at: string | null;
  accepted_at: string | null;
  last_sent_at: string | null;
  cancelled_at: string | null;
  resend_count: number;
}

function errorStatus(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("duplicate") || normalized.includes("already")) return 409;
  if (normalized.includes("not found")) return 404;
  return 400;
}

const allowedInvitationRedirects = new Set([
  "https://staff.stmmotors.com/accept-invite",
  "http://localhost:5173/accept-invite",
  "http://127.0.0.1:5173/accept-invite",
]);

function staffInvitationRedirectUrl() {
  const configured = Deno.env.get("STAFF_INVITE_REDIRECT_URL")?.trim();
  if (configured) {
    const configuredUrl = new URL(configured);
    const normalizedUrl = configuredUrl.toString().replace(/\/$/, "");
    if (!allowedInvitationRedirects.has(normalizedUrl)) {
      throw new Error("Configured staff invitation redirect URL is not allowed.");
    }
    return normalizedUrl;
  }
  return "https://staff.stmmotors.com/accept-invite";
}

async function findAuthUserByEmail(adminClient: SupabaseClient, email: string) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    const match = data.users.find(
      (user) => normalizeStaffEmail(user.email) === email,
    );
    if (match) return match;
    if (data.users.length < 1000) return null;
  }
  throw new Error("Unable to safely check the complete user directory.");
}

async function authenticateAdmin(request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization) return { error: "Authentication is required.", status: 401 } as const;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return { error: "Your session is invalid or has expired.", status: 401 } as const;
  }
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle<{ role: string }>();
  if (profileError) throw profileError;
  if (profile?.role !== "admin") {
    return { error: "Only an STM Motors Admin can manage staff invitations.", status: 403 } as const;
  }
  return { user: userData.user, adminClient } as const;
}

async function addEvent(
  adminClient: SupabaseClient,
  invitationId: string,
  eventType: string,
  actorUserId: string,
  details: Record<string, unknown> = {},
) {
  const { error } = await adminClient.from("staff_invitation_events").insert({
    invitation_id: invitationId,
    event_type: eventType,
    actor_user_id: actorUserId,
    details,
  });
  if (error) console.error("Unable to save staff invitation event.", { eventType, invitationId });
}

async function markFailed(
  adminClient: SupabaseClient,
  invitationId: string,
  actorUserId: string,
  error: unknown,
) {
  const failureReason = safeStaffFailureReason(error);
  await adminClient
    .from("staff_invitations")
    .update({ status: "failed", failure_reason: failureReason })
    .eq("id", invitationId)
    .in("status", ["creating", "pending"]);
  await addEvent(adminClient, invitationId, "delivery_failed", actorUserId, {
    reason: failureReason,
  });
}

async function loadInvitation(adminClient: SupabaseClient, invitationId: string) {
  const { data, error } = await adminClient
    .from("staff_invitations")
    .select("id,email,normalized_email,full_name,invited_role,status,invited_by,invited_user_id,created_at,expires_at,accepted_at,last_sent_at,cancelled_at,resend_count")
    .eq("id", invitationId)
    .maybeSingle<InvitationRow>();
  if (error) throw error;
  if (!data) throw new Error("Invitation not found.");
  return data;
}

async function expirePendingInvitations(
  adminClient: SupabaseClient,
  actorUserId: string,
  normalizedEmail?: string,
) {
  let query = adminClient
    .from("staff_invitations")
    .select("id")
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString());
  if (normalizedEmail) query = query.eq("normalized_email", normalizedEmail);
  const { data, error } = await query;
  if (error) throw error;
  const ids = (data ?? []).map((item) => item.id as string);
  if (!ids.length) return;
  const { data: expiredRows, error: updateError } = await adminClient
    .from("staff_invitations")
    .update({ status: "expired", failure_reason: null })
    .in("id", ids)
    .eq("status", "pending")
    .select("id");
  if (updateError) throw updateError;
  const expiredIds = (expiredRows ?? []).map((item) => item.id as string);
  if (!expiredIds.length) return;
  const { error: eventError } = await adminClient.from("staff_invitation_events").insert(
    expiredIds.map((invitationId) => ({
      invitation_id: invitationId,
      event_type: "expired",
      actor_user_id: actorUserId,
      details: { detectedBy: "staff_management" },
    })),
  );
  if (eventError) console.error("Unable to save invitation expiry events.", { count: ids.length });
}

async function listStaff(adminClient: SupabaseClient, adminUserId: string) {
  await expirePendingInvitations(adminClient, adminUserId);
  const { data: profiles, error: profileError } = await adminClient
    .from("profiles")
    .select("id,role,full_name,created_at")
    .in("role", ["admin", "ops"])
    .order("created_at", { ascending: true });
  if (profileError) throw profileError;

  const authUsers: User[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    authUsers.push(...data.users);
    if (data.users.length < 1000) break;
  }
  const usersById = new Map(authUsers.map((user) => [user.id, user]));

  const { data: invitations, error: invitationError } = await adminClient
    .from("staff_invitations")
    .select("id,email,full_name,invited_role,status,created_at,expires_at,accepted_at,last_sent_at,cancelled_at,resend_count,invited_by")
    .order("created_at", { ascending: false });
  if (invitationError) throw invitationError;

  const inviterIds = [...new Set((invitations ?? []).map((item) => item.invited_by))];
  const { data: inviters, error: inviterError } = inviterIds.length
    ? await adminClient.from("profiles").select("id,full_name").in("id", inviterIds)
    : { data: [], error: null };
  if (inviterError) throw inviterError;
  const inviterNames = new Map((inviters ?? []).map((item) => [item.id, item.full_name]));

  return {
    staff: (profiles ?? []).map((profile) => {
      const authUser = usersById.get(profile.id);
      return {
        id: profile.id,
        fullName: profile.full_name,
        email: authUser?.email ?? null,
        role: profile.role,
        createdAt: profile.created_at,
        lastSignInAt: authUser?.last_sign_in_at ?? null,
        emailConfirmed: Boolean(authUser?.email_confirmed_at),
      };
    }),
    invitations: (invitations ?? []).map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      fullName: invitation.full_name,
      role: invitation.invited_role,
      status: invitation.status,
      createdAt: invitation.created_at,
      expiresAt: invitation.expires_at,
      acceptedAt: invitation.accepted_at,
      lastSentAt: invitation.last_sent_at,
      cancelledAt: invitation.cancelled_at,
      resendCount: invitation.resend_count,
      invitedByName: inviterNames.get(invitation.invited_by) ?? "STM Admin",
    })),
  };
}

async function inviteStaff(
  adminClient: SupabaseClient,
  adminUser: User,
  payload: Record<string, unknown>,
) {
  if (!hasExactKeys(payload, ["action", "email", "fullName", "role"])) {
    throw new Error("Invalid invitation request.");
  }
  const email = normalizeStaffEmail(payload.email);
  const fullName = normalizeStaffName(payload.fullName);
  if (!isValidStaffEmail(email)) throw new Error("Enter a valid email address.");
  if (fullName.length < 2) throw new Error("Enter the staff member's full name.");
  if (!isInvitedStaffRole(payload.role)) throw new Error("Select Admin or Ops.");
  if (normalizeStaffEmail(adminUser.email) === email) {
    throw new Error("You cannot invite your own signed-in email address.");
  }

  await expirePendingInvitations(adminClient, adminUser.id, email);
  let existingUser = await findAuthUserByEmail(adminClient, email);
  if (existingUser) {
    const { data: profile, error } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", existingUser.id)
      .maybeSingle<{ role: string }>();
    if (error) throw error;
    if (profile) throw new Error(`This email already belongs to an active ${profile.role} account.`);

    const { data: previousInvitation, error: previousError } = await adminClient
      .from("staff_invitations")
      .select("id")
      .eq("invited_user_id", existingUser.id)
      .eq("normalized_email", email)
      .in("status", ["expired", "cancelled", "failed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (previousError) throw previousError;
    if (previousInvitation && !existingUser.last_sign_in_at) {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(existingUser.id);
      if (deleteError) throw new Error("The previous unaccepted invitation could not be replaced safely.");
      existingUser = null;
    } else {
      throw new Error("This email already has a Supabase account. It was not elevated; review it manually.");
    }
  }

  const { data: existingInvitation, error: existingInvitationError } = await adminClient
    .from("staff_invitations")
    .select("id,status")
    .eq("normalized_email", email)
    .in("status", ["creating", "pending"])
    .maybeSingle<{ id: string; status: string }>();
  if (existingInvitationError) throw existingInvitationError;
  if (existingInvitation) throw new Error("A pending invitation already exists for this email.");

  const { data: invitation, error: createError } = await adminClient
    .from("staff_invitations")
    .insert({
      email,
      normalized_email: email,
      full_name: fullName,
      invited_role: payload.role,
      invited_by: adminUser.id,
      status: "creating",
    })
    .select("id")
    .single<{ id: string }>();
  if (createError || !invitation) {
    if (createError?.code === "23505") throw new Error("A pending invitation already exists for this email.");
    throw createError || new Error("Unable to create the invitation record.");
  }
  await addEvent(adminClient, invitation.id, "created", adminUser.id, {
    invitedRole: payload.role,
  });

  try {
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: staffInvitationRedirectUrl(),
    });
    if (error || !data.user) throw error || new Error("Supabase did not return an invited user.");
    const sentAt = new Date();
    const { data: updated, error: updateError } = await adminClient
      .from("staff_invitations")
      .update({
        status: "pending",
        invited_user_id: data.user.id,
        last_sent_at: sentAt.toISOString(),
        expires_at: new Date(sentAt.getTime() + STAFF_INVITE_EXPIRY_MS).toISOString(),
        failure_reason: null,
      })
      .eq("id", invitation.id)
      .eq("status", "creating")
      .select("id")
      .maybeSingle();
    if (updateError || !updated) {
      await adminClient.auth.admin.deleteUser(data.user.id).catch(() => undefined);
      throw updateError || new Error("The invitation record changed before delivery completed.");
    }
    await addEvent(adminClient, invitation.id, "sent", adminUser.id);
    return { success: true, invitationId: invitation.id };
  } catch (error) {
    await markFailed(adminClient, invitation.id, adminUser.id, error);
    throw new Error("The invitation could not be sent. No staff access was granted.");
  }
}

async function resendInvitation(
  adminClient: SupabaseClient,
  adminUser: User,
  invitationId: string,
) {
  const invitation = await loadInvitation(adminClient, invitationId);
  if (invitation.status !== "pending") throw new Error("Only a pending invitation can be resent.");
  if (
    invitation.last_sent_at &&
    Date.now() - new Date(invitation.last_sent_at).getTime() < STAFF_INVITE_RESEND_COOLDOWN_MS
  ) {
    throw new Error("Wait at least five minutes before resending this invitation.");
  }
  if (!invitation.invited_user_id) throw new Error("This invitation has no linked Auth user.");

  const { data: authData, error: authError } = await adminClient.auth.admin.getUserById(
    invitation.invited_user_id,
  );
  if (authError || !authData.user) throw new Error("The invited Auth user could not be verified.");
  if (normalizeStaffEmail(authData.user.email) !== invitation.normalized_email) {
    throw new Error("The invited Auth user does not match this invitation.");
  }
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (profile || authData.user.last_sign_in_at) {
    throw new Error("This invitation has already been opened or linked to a profile and cannot be resent safely.");
  }

  const { data: claimed, error: claimError } = await adminClient
    .from("staff_invitations")
    .update({ status: "creating", failure_reason: null })
    .eq("id", invitation.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (claimError || !claimed) throw new Error("The invitation changed before it could be resent.");

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(authData.user.id);
  if (deleteError) {
    await adminClient
      .from("staff_invitations")
      .update({ status: "pending" })
      .eq("id", invitation.id)
      .eq("status", "creating");
    throw new Error("The previous invitation could not be replaced safely.");
  }
  try {
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(invitation.email, {
      data: { full_name: invitation.full_name },
      redirectTo: staffInvitationRedirectUrl(),
    });
    if (error || !data.user) throw error || new Error("Supabase did not return an invited user.");
    const sentAt = new Date();
    const { data: updated, error: updateError } = await adminClient
      .from("staff_invitations")
      .update({
        status: "pending",
        invited_user_id: data.user.id,
        last_sent_at: sentAt.toISOString(),
        expires_at: new Date(sentAt.getTime() + STAFF_INVITE_EXPIRY_MS).toISOString(),
        resend_count: invitation.resend_count + 1,
      })
      .eq("id", invitation.id)
      .eq("status", "creating")
      .select("id")
      .maybeSingle();
    if (updateError || !updated) {
      await adminClient.auth.admin.deleteUser(data.user.id).catch(() => undefined);
      throw updateError || new Error("The invitation record changed before resend completed.");
    }
    await addEvent(adminClient, invitation.id, "resent", adminUser.id, {
      resendCount: invitation.resend_count + 1,
    });
    return { success: true };
  } catch (error) {
    await markFailed(adminClient, invitation.id, adminUser.id, error);
    throw new Error("The invitation could not be resent. No staff access was granted.");
  }
}

async function cancelInvitation(
  adminClient: SupabaseClient,
  adminUser: User,
  invitationId: string,
) {
  const invitation = await loadInvitation(adminClient, invitationId);
  if (invitation.status === "cancelled") return { success: true };
  if (invitation.status === "accepted") throw new Error("An accepted invitation cannot be cancelled here.");
  if (!['creating', 'pending'].includes(invitation.status)) {
    throw new Error("This invitation is no longer active.");
  }
  const cancelledAt = new Date().toISOString();
  const { data: cancelled, error } = await adminClient
    .from("staff_invitations")
    .update({
      status: "cancelled",
      cancelled_at: cancelledAt,
      cancelled_by: adminUser.id,
      failure_reason: null,
    })
    .eq("id", invitation.id)
    .in("status", ["creating", "pending"])
    .select("id")
    .maybeSingle();
  if (error || !cancelled) throw new Error("The invitation changed before it could be cancelled.");
  await addEvent(adminClient, invitation.id, "cancelled", adminUser.id);

  if (invitation.invited_user_id) {
    const [{ data: profile }, { data: authData }] = await Promise.all([
      adminClient.from("profiles").select("id").eq("id", invitation.invited_user_id).maybeSingle(),
      adminClient.auth.admin.getUserById(invitation.invited_user_id),
    ]);
    if (
      !profile &&
      authData.user &&
      !authData.user.last_sign_in_at &&
      normalizeStaffEmail(authData.user.email) === invitation.normalized_email
    ) {
      await adminClient.auth.admin.deleteUser(authData.user.id).catch(() => undefined);
    }
  }
  return { success: true };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: marketplaceCorsHeaders(request) });
  }
  if (request.method !== "POST") {
    return marketplaceJsonResponse(request, { error: "Method not allowed." }, 405);
  }

  try {
    const authenticated = await authenticateAdmin(request);
    if ("error" in authenticated) {
      return marketplaceJsonResponse(request, { error: authenticated.error }, authenticated.status);
    }
    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return marketplaceJsonResponse(request, { error: "Invalid JSON request." }, 400);
    }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return marketplaceJsonResponse(request, { error: "Invalid request." }, 400);
    }

    if (payload.action === "list" && hasExactKeys(payload, ["action"])) {
      return marketplaceJsonResponse(
        request,
        await listStaff(authenticated.adminClient, authenticated.user.id),
      );
    }
    if (payload.action === "invite") {
      const result = await inviteStaff(authenticated.adminClient, authenticated.user, payload);
      return marketplaceJsonResponse(request, result, 201);
    }
    if (
      (payload.action === "resend" || payload.action === "cancel") &&
      hasExactKeys(payload, ["action", "invitationId"]) &&
      typeof payload.invitationId === "string"
    ) {
      const result = payload.action === "resend"
        ? await resendInvitation(authenticated.adminClient, authenticated.user, payload.invitationId)
        : await cancelInvitation(authenticated.adminClient, authenticated.user, payload.invitationId);
      return marketplaceJsonResponse(request, result);
    }
    return marketplaceJsonResponse(request, { error: "Unsupported staff invitation action." }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to manage staff invitations.";
    console.error("Staff invitation request failed.", { message: safeStaffFailureReason(error) });
    const safeMessage = message.includes("Supabase") || message.includes("database")
      ? "The staff invitation service is temporarily unavailable."
      : message;
    return marketplaceJsonResponse(request, { error: safeMessage }, errorStatus(message));
  }
});

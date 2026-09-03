import { createClient } from "npm:@supabase/supabase-js@2.100.0";
import { marketplaceCorsHeaders, marketplaceJsonResponse } from "../_shared/marketplace.ts";
import {
  hasExactKeys,
  normalizeStaffEmail,
  safeStaffFailureReason,
  validateStaffPassword,
} from "../_shared/staff-invitations.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim() ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables for invitation acceptance.");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: marketplaceCorsHeaders(request) });
  if (request.method !== "POST") {
    return marketplaceJsonResponse(request, { error: "Method not allowed." }, 405);
  }

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) {
      return marketplaceJsonResponse(request, { error: "Open the original invitation link to continue." }, 401);
    }
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user?.email) {
      return marketplaceJsonResponse(request, { error: "This invitation session is invalid or expired." }, 401);
    }

    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return marketplaceJsonResponse(request, { error: "Invalid JSON request." }, 400);
    }
    if (!hasExactKeys(payload, ["password"])) {
      return marketplaceJsonResponse(request, { error: "Invalid invitation acceptance request." }, 400);
    }

    const { data: invitation, error: invitationError } = await adminClient
      .from("staff_invitations")
      .select("id,status,normalized_email,invited_user_id,invited_role,expires_at")
      .eq("invited_user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{
        id: string;
        status: string;
        normalized_email: string;
        invited_user_id: string | null;
        invited_role: string;
        expires_at: string | null;
      }>();
    if (invitationError) throw invitationError;
    if (!invitation || invitation.normalized_email !== normalizeStaffEmail(userData.user.email)) {
      return marketplaceJsonResponse(request, { error: "No valid staff invitation matches this account." }, 403);
    }
    if (invitation.status === "accepted") {
      return marketplaceJsonResponse(request, { success: true, role: invitation.invited_role, alreadyAccepted: true });
    }
    if (invitation.status !== "pending") {
      return marketplaceJsonResponse(request, { error: "This invitation is no longer active." }, 410);
    }
    if (!invitation.expires_at || new Date(invitation.expires_at).getTime() <= Date.now()) {
      const expiredAt = new Date().toISOString();
      await adminClient.from("staff_invitations").update({ status: "expired", failure_reason: null }).eq("id", invitation.id).eq("status", "pending");
      await adminClient.from("staff_invitation_events").insert({
        invitation_id: invitation.id,
        event_type: "expired",
        actor_user_id: userData.user.id,
        details: { detectedAt: expiredAt },
      });
      return marketplaceJsonResponse(request, { error: "This invitation has expired. Ask an Admin for a new invitation." }, 410);
    }

    const passwordError = validateStaffPassword(payload.password);
    if (passwordError) return marketplaceJsonResponse(request, { error: passwordError }, 400);
    const { error: passwordUpdateError } = await adminClient.auth.admin.updateUserById(
      userData.user.id,
      { password: payload.password as string },
    );
    if (passwordUpdateError) {
      return marketplaceJsonResponse(request, { error: "Unable to set the password for this invitation." }, 400);
    }

    const { data: activated, error: activationError } = await adminClient.rpc(
      "activate_staff_invitation",
      {
        p_invitation_id: invitation.id,
        p_user_id: userData.user.id,
        p_email: userData.user.email,
      },
    );
    if (activationError) {
      await adminClient.from("staff_invitation_events").insert({
        invitation_id: invitation.id,
        event_type: "activation_failed",
        actor_user_id: userData.user.id,
        details: { reason: safeStaffFailureReason(activationError) },
      });
      return marketplaceJsonResponse(
        request,
        { error: "Your password was set, but staff access could not be activated. Please retry this page or contact an Admin." },
        409,
      );
    }
    const result = Array.isArray(activated) ? activated[0] : activated;
    return marketplaceJsonResponse(request, {
      success: true,
      role: result?.activated_role ?? invitation.invited_role,
    });
  } catch (error) {
    console.error("Staff invitation acceptance failed.", { message: safeStaffFailureReason(error) });
    return marketplaceJsonResponse(request, { error: "Unable to accept this invitation right now." }, 500);
  }
});

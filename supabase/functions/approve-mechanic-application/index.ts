import { createClient } from "npm:@supabase/supabase-js@2.100.0";
import { marketplaceCorsHeaders } from "../_shared/marketplace.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const staffPortalUrl = Deno.env.get("STAFF_PORTAL_URL")?.trim() || "https://staff.stmmotors.com";

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables for approval.");
}

interface MechanicApplicationRow {
  id: string;
  status:
    | "submitted"
    | "under_review"
    | "needs_info"
    | "approved"
    | "rejected";
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  review_note: string | null;
}

Deno.serve(async (request) => {
  const corsHeaders = {
    ...marketplaceCorsHeaders(request),
    "Content-Type": "application/json",
  };
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header." }),
        { status: 401, headers: corsHeaders },
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    });

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: userError?.message || "Unable to load user." }),
        { status: 401, headers: corsHeaders },
      );
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string }>();

    if (profileError) {
      throw profileError;
    }

    if (!profile || !["ops", "admin"].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: "You are not allowed to approve applications." }),
        { status: 403, headers: corsHeaders },
      );
    }

    const { applicationId } = (await request.json()) as {
      applicationId?: string;
    };

    if (!applicationId) {
      return new Response(
        JSON.stringify({ error: "Application ID is required." }),
        { status: 400, headers: corsHeaders },
      );
    }

    const { data: application, error: applicationError } = await adminClient
      .from("mechanic_applications")
      .select(
        "id, status, first_name, last_name, email, phone, review_note",
      )
      .eq("id", applicationId)
      .single<MechanicApplicationRow>();

    if (applicationError || !application) {
      return new Response(
        JSON.stringify({
          error: applicationError?.message || "Application not found.",
        }),
        { status: 404, headers: corsHeaders },
      );
    }

    if (application.status === "approved") {
      const { data: currentApplication, error: currentApplicationError } =
        await adminClient
          .from("mechanic_applications")
          .select("*")
          .eq("id", applicationId)
          .single();

      if (currentApplicationError) {
        throw currentApplicationError;
      }

      return new Response(
        JSON.stringify({ application: currentApplication }),
        { status: 200, headers: corsHeaders },
      );
    }

    const { data: inviteResult, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(application.email, {
        data: {
          full_name: `${application.first_name} ${application.last_name}`.trim(),
          staff_role: "mechanic",
        },
        redirectTo: `${staffPortalUrl.replace(/\/$/, "")}/accept-mechanic-invite`,
      });

    if (inviteError || !inviteResult.user) {
      return new Response(
        JSON.stringify({
          error:
            inviteError?.message ||
            "Unable to create the mechanic invite for this email.",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    const mechanicUserId = inviteResult.user.id;

    const { error: profileUpsertError } = await adminClient
      .from("profiles")
      .upsert({
        id: mechanicUserId,
        role: "mechanic",
        full_name: `${application.first_name} ${application.last_name}`.trim(),
        phone: application.phone,
      });

    if (profileUpsertError) {
      throw profileUpsertError;
    }

    const approvalTimestamp = new Date().toISOString();

    const { data: approvedApplication, error: approvalError } = await adminClient
      .from("mechanic_applications")
      .update({
        status: "approved",
        reviewed_at: approvalTimestamp,
        approved_at: approvalTimestamp,
        approved_by: user.id,
        auth_user_id: mechanicUserId,
        invite_sent_at: approvalTimestamp,
      })
      .eq("id", applicationId)
      .select("*")
      .single();

    if (approvalError) {
      throw approvalError;
    }

    return new Response(
      JSON.stringify({ application: approvedApplication }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Mechanic approval failed.", {
      message: error instanceof Error ? error.message : "Unexpected approval error.",
    });
    return new Response(
      JSON.stringify({
        error: "The mechanic approval service is temporarily unavailable.",
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});

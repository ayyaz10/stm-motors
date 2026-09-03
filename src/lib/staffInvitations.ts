import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type MarketplaceStaffRole = "admin" | "ops";
export type StaffInvitationStatus =
  | "creating"
  | "pending"
  | "accepted"
  | "expired"
  | "cancelled"
  | "failed";

export interface MarketplaceStaffMember {
  id: string;
  fullName: string | null;
  email: string | null;
  role: MarketplaceStaffRole;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
}

export interface StaffInvitationSummary {
  id: string;
  email: string;
  fullName: string;
  role: MarketplaceStaffRole;
  status: StaffInvitationStatus;
  createdAt: string;
  expiresAt: string | null;
  acceptedAt: string | null;
  lastSentAt: string | null;
  cancelledAt: string | null;
  resendCount: number;
  invitedByName: string;
}

export interface StaffDirectory {
  staff: MarketplaceStaffMember[];
  invitations: StaffInvitationSummary[];
}

export function normalizeStaffEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidStaffEmail(value: string) {
  const normalized = normalizeStaffEmail(value);
  return normalized.length >= 3 && normalized.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function validateStaffPassword(value: string) {
  if (value.length < 12 || value.length > 128) {
    return "Use a password between 12 and 128 characters.";
  }
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    return "Include an uppercase letter, a lowercase letter and a number.";
  }
  return null;
}

function invitationError(
  error: { message?: string } | null,
  data: unknown,
  fallback: string,
) {
  const response = data as { error?: string } | null;
  return new Error(response?.error || error?.message || fallback);
}

export async function fetchStaffDirectory(): Promise<StaffDirectory> {
  const { data, error } = await supabase.functions.invoke("manage-staff-invitations", {
    body: { action: "list" },
  });
  if (error) throw invitationError(error, data, "Unable to load staff accounts.");
  return data as StaffDirectory;
}

export async function inviteStaffMember(input: {
  email: string;
  fullName: string;
  role: MarketplaceStaffRole;
}) {
  const { data, error } = await supabase.functions.invoke("manage-staff-invitations", {
    body: {
      action: "invite",
      email: normalizeStaffEmail(input.email),
      fullName: input.fullName.trim(),
      role: input.role,
    },
  });
  if (error) throw invitationError(error, data, "Unable to send the staff invitation.");
  return data as { success: true; invitationId: string };
}

export async function manageStaffInvitation(
  action: "resend" | "cancel",
  invitationId: string,
) {
  const { data, error } = await supabase.functions.invoke("manage-staff-invitations", {
    body: { action, invitationId },
  });
  if (error) throw invitationError(error, data, `Unable to ${action} this invitation.`);
  return data as { success: true };
}

export async function prepareStaffInvitationSession(): Promise<User> {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const search = new URLSearchParams(window.location.search);
  const authError = hash.get("error_description") || search.get("error_description");
  if (authError) throw new Error(authError);

  let { data: sessionData } = await supabase.auth.getSession();
  const code = search.get("code");
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error && !sessionData.session) throw new Error(error.message);
  } else if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw new Error(error.message);
  }

  ({ data: sessionData } = await supabase.auth.getSession());
  if (!sessionData.session) {
    throw new Error("This invitation link is invalid or has expired.");
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) {
    throw new Error("This invitation link is invalid or has expired.");
  }
  window.history.replaceState(null, "", window.location.pathname);
  return data.user;
}

export async function acceptStaffInvitation(password: string) {
  const { data, error } = await supabase.functions.invoke("accept-staff-invitation", {
    body: { password },
  });
  if (error) throw invitationError(error, data, "Unable to accept this invitation.");
  const response = data as { success?: boolean; role?: MarketplaceStaffRole; error?: string };
  if (!response.success) throw new Error(response.error || "Unable to accept this invitation.");
  return response;
}

export async function setInvitedMechanicPassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error || !data.user) {
    throw new Error(error?.message || "Unable to set your account password.");
  }
  return data.user;
}

import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type StaffRole = "mechanic" | "ops" | "admin";

export interface StaffProfile {
  id: string;
  role: StaffRole;
  full_name: string | null;
  phone: string | null;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message || "Failed to load the current session.");
  }

  return data.session;
}

export async function getStaffProfile(
  userId: string,
): Promise<StaffProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone")
    .eq("id", userId)
    .maybeSingle<StaffProfile>();

  if (error) {
    throw new Error(error.message || "Failed to load the staff profile.");
  }

  return data;
}

export async function signInStaffWithPassword(
  email: string,
  password: string,
): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(error.message || "Failed to sign in.");
  }

  if (!data.session) {
    throw new Error("Staff sign-in succeeded, but no session was returned.");
  }

  return data.session;
}

export async function signOutStaff(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message || "Failed to sign out.");
  }
}

export function subscribeToAuthStateChanges(
  onSessionChange: (session: Session | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    onSessionChange(session);
  });

  return () => {
    subscription.unsubscribe();
  };
}

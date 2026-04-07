import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { StaffProfile } from "../lib/auth";
import { signInStaffWithPassword, signOutStaff } from "../lib/auth";

interface StaffLoginPageProps {
  session: Session | null;
  profile: StaffProfile | null;
  isProfileLoading: boolean;
  onBackToCustomer: () => void;
  onOpenOpsJobs: () => void;
  onOpenMechanicDashboard: () => void;
}

function StaffLoginPage({
  session,
  profile,
  isProfileLoading,
  onBackToCustomer,
  onOpenOpsJobs,
  onOpenMechanicDashboard,
}: StaffLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canOpenOpsJobs = profile?.role === "ops" || profile?.role === "admin";
  const canOpenMechanicDashboard =
    profile?.role === "mechanic" || profile?.role === "admin";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setSubmitError("Email and password are both required.");
      setSuccessMessage(null);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await signInStaffWithPassword(email, password);
      setPassword("");
      setSuccessMessage("Staff login was successful.");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to sign in.",
      );
      setSuccessMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setSubmitError(null);
      await signOutStaff();
      setSuccessMessage("Staff sign out was successful.");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to sign out.",
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Staff Login
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Team sign-in
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          This page is for staff only. The customer booking flow stays public.
        </p>

        {session ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">
              You are signed in.
            </p>
            <p className="mt-2 text-sm text-emerald-900">
              <span className="font-semibold">Email:</span>{" "}
              {session.user.email ?? "No email"}
            </p>
            <p className="mt-1 text-sm text-emerald-900">
              <span className="font-semibold">User ID:</span> {session.user.id}
            </p>
            <p className="mt-1 text-sm text-emerald-900">
              <span className="font-semibold">Role:</span>{" "}
              {isProfileLoading ? "Loading role..." : profile?.role ?? "Profile missing"}
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {canOpenOpsJobs ? (
                <button
                  type="button"
                  onClick={onOpenOpsJobs}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                >
                  Open ops jobs
                </button>
              ) : null}
              {canOpenMechanicDashboard ? (
                <button
                  type="button"
                  onClick={onOpenMechanicDashboard}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  Open mechanic dashboard
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="rounded-2xl border border-rose-300 px-4 py-3 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-900">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
                placeholder="staff@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-900">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950"
                placeholder="Enter your password"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Staff sign in"}
            </button>
          </form>
        )}

        {submitError ? (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submitError}
          </p>
        ) : null}

        {successMessage ? (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onBackToCustomer}
          className="mt-6 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          Back to customer flow
        </button>
      </div>
    </main>
  );
}

export default StaffLoginPage;

import type { Session } from "@supabase/supabase-js";
import type { StaffProfile } from "../../lib/auth";

interface StaffSessionStatusProps {
  session: Session | null;
  profile: StaffProfile | null;
  isLoading: boolean;
  error: string | null;
}

function StaffSessionStatus({
  session,
  profile,
  isLoading,
  error,
}: StaffSessionStatusProps) {
  const statusLabel = isLoading
    ? "Loading session"
    : error
      ? "Session error"
      : session
        ? "Signed in"
        : "Signed out";

  const statusClassName = isLoading
    ? "border-amber-200 bg-amber-50 text-amber-800"
    : error
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : session
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-slate-200 bg-white text-slate-700";

  return (
    <aside className="fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Staff Auth
      </p>
      <div
        className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClassName}`}
      >
        {statusLabel}
      </div>

      <div className="mt-3 space-y-1 text-sm text-slate-700">
        <p>
          <span className="font-semibold text-slate-900">Email:</span>{" "}
          {session?.user.email ?? "No staff session"}
        </p>
        <p>
          <span className="font-semibold text-slate-900">User ID:</span>{" "}
          {session?.user.id ?? "Not available"}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Role:</span>{" "}
          {profile?.role ?? "No role loaded"}
        </p>
        {error ? (
          <p className="text-rose-700">{error}</p>
        ) : (
          <p className="text-slate-500">
            Session state is now loaded from Supabase on app start.
          </p>
        )}
      </div>
    </aside>
  );
}

export default StaffSessionStatus;

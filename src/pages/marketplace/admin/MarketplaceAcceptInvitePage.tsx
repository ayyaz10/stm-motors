import { CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import {
  acceptStaffInvitation,
  prepareStaffInvitationSession,
  validateStaffPassword,
} from "../../../lib/staffInvitations";
import { usePageMetadata } from "../../../lib/seo";
import { MARKETPLACE_SITE_ORIGIN } from "../../../lib/siteMode";

interface MarketplaceAcceptInvitePageProps {
  canonicalOrigin?: string;
  canonicalPath?: string;
  successHref?: string;
  successLabel?: string;
}

function MarketplaceAcceptInvitePage({
  canonicalOrigin = MARKETPLACE_SITE_ORIGIN,
  canonicalPath = "/admin/accept-invite",
  successHref = "/admin/vehicles",
  successLabel = "Open dashboard",
}: MarketplaceAcceptInvitePageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  usePageMetadata({
    title: "Accept Staff Invitation | STM Motors",
    description: "Securely accept an STM Motors marketplace staff invitation.",
    pathname: canonicalPath,
    canonicalOrigin,
    noIndex: true,
  });

  useEffect(() => {
    let active = true;
    prepareStaffInvitationSession()
      .then((user) => {
        if (active) setEmail(user.email ?? "");
      })
      .catch((sessionError: unknown) => {
        if (active) {
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : "This invitation link is invalid or expired.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const passwordError = validateStaffPassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await acceptStaffInvitation(password);
      setComplete(true);
      setPassword("");
      setConfirmPassword("");
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : "Unable to accept this invitation.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-12">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
        {complete ? (
          <>
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <h1 className="mt-5 text-3xl font-bold">Staff account activated</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your password and approved access are ready. Continue to the STM Motors staff portal.
            </p>
            <button
              type="button"
              onClick={() => window.location.assign(successHref)}
              className="mt-7 w-full rounded-xl bg-[#1c69d4] px-5 py-3 font-semibold text-white"
            >
              {successLabel}
            </button>
          </>
        ) : (
          <>
            <LockKeyhole className="h-10 w-10 text-[#1c69d4]" />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-[#1c69d4]">
              STM Motors Staff Portal
            </p>
            <h1 className="mt-2 text-3xl font-bold">Accept staff invitation</h1>
            {loading ? (
              <div className="mt-8 flex items-center gap-3 text-sm text-slate-600">
                <LoaderCircle className="h-5 w-5 animate-spin" /> Checking invitation…
              </div>
            ) : email ? (
              <form onSubmit={submit} className="mt-7 grid gap-5">
                <div className="rounded-xl bg-blue-50 p-4 text-sm">
                  <span className="font-semibold text-slate-700">Invited email</span>
                  <p className="mt-1 break-all text-slate-600">{email}</p>
                </div>
                <label className="text-sm font-semibold">
                  Create password
                  <input
                    required
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal"
                  />
                </label>
                <label className="text-sm font-semibold">
                  Confirm password
                  <input
                    required
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal"
                  />
                </label>
                <p className="text-xs leading-5 text-slate-500">
                  Use 12–128 characters with an uppercase letter, lowercase letter and number.
                </p>
                {error ? (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    {error}
                  </p>
                ) : null}
                <button
                  disabled={submitting}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] font-semibold text-white disabled:opacity-60"
                >
                  {submitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
                  {submitting ? "Activating…" : "Set password and activate"}
                </button>
              </form>
            ) : error ? (
              <p className="mt-7 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
                {error}
              </p>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}

export default MarketplaceAcceptInvitePage;

import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { signInStaffWithPassword } from "../../lib/auth";
import { usePageMetadata } from "../../lib/seo";
import { STAFF_SITE_ORIGIN } from "../../lib/siteMode";

function StaffPortalLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  usePageMetadata({ title: "Staff Login | STM Motors", description: "Secure STM Motors staff portal login.", pathname: "/login", canonicalOrigin: STAFF_SITE_ORIGIN, noIndex: true });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      await signInStaffWithPassword(email, password);
      setPassword("");
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-12"><section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-9"><LockKeyhole className="h-10 w-10 text-[#1c69d4]" /><p className="mt-5 text-xs font-semibold uppercase tracking-[.2em] text-[#1c69d4]">STM Motors Staff Portal</p><h1 className="mt-2 text-3xl font-bold">Staff sign in</h1><p className="mt-3 text-sm leading-6 text-slate-600">Admin, Ops and Mechanic staff use their approved STM Motors account. Staff accounts are invitation-only.</p><form onSubmit={submit} className="mt-7 grid gap-5"><label className="text-sm font-semibold">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>{error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}<button disabled={submitting} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-5 font-semibold text-white disabled:opacity-60">{submitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}{submitting ? "Signing in…" : "Sign in securely"}</button></form></section></main>;
}

export default StaffPortalLoginPage;


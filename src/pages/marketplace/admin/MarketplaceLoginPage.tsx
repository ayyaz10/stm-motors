import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { signInStaffWithPassword } from "../../../lib/auth";
import { navigateTo } from "../../../lib/navigation";
import { usePageMetadata } from "../../../lib/seo";
import { MARKETPLACE_SITE_ORIGIN } from "../../../lib/siteMode";

function MarketplaceLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  usePageMetadata({ title: "Marketplace Staff Login | STM Motors", description: "Authorised STM Motors marketplace staff login.", pathname: "/admin/login", canonicalOrigin: MARKETPLACE_SITE_ORIGIN, noIndex: true });
  const submit = async (event: React.FormEvent) => { event.preventDefault(); try { setSubmitting(true); setError(""); await signInStaffWithPassword(email, password); navigateTo("/admin/vehicles", true); } catch (signInError) { setError(signInError instanceof Error ? signInError.message : "Unable to sign in."); } finally { setSubmitting(false); } };
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-12"><div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><LockKeyhole className="h-9 w-9 text-[#1c69d4]" /><p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-[#1c69d4]">STM Motors Marketplace</p><h1 className="mt-2 text-3xl font-bold">Staff sign in</h1><p className="mt-3 text-sm leading-6 text-slate-600">Use your existing approved STM Motors staff account. Only ops and admin roles can manage vehicle sales.</p><form onSubmit={submit} className="mt-7 grid gap-5"><label className="text-sm font-semibold">Email<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label><label className="text-sm font-semibold">Password<input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>{error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}<button disabled={submitting} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] font-semibold text-white disabled:opacity-60">{submitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}{submitting ? "Signing in…" : "Sign in"}</button><button type="button" onClick={() => navigateTo("/")} className="rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700">Back to marketplace</button></form></div></main>;
}

export default MarketplaceLoginPage;


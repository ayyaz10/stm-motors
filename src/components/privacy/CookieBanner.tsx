import PublicLink from "../public/PublicLink";
import { useCookieConsent } from "./CookieConsentContext";
import { resolveSiteMode, SERVICE_SITE_ORIGIN } from "../../lib/siteMode";

export default function CookieBanner() {
  const { acceptOptional, openPreferences, rejectOptional } = useCookieConsent();
  const policyHref = resolveSiteMode() === "marketplace" ? `${SERVICE_SITE_ORIGIN}/legal/cookie-policy` : "/legal/cookie-policy";

  return (
    <section
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[90] max-h-dvh overflow-y-auto border-t border-slate-200 bg-white px-5 py-5 shadow-[0_-18px_50px_-30px_rgba(15,23,42,.45)] sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-lg font-bold text-slate-950">Your privacy choices</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            We use necessary storage to run and secure the website. With your permission, we can also use functional, analytics and marketing technologies. Optional technologies stay off unless you choose otherwise. Read our{" "}
            <PublicLink href={policyHref} className="font-semibold text-[#1c69d4] underline underline-offset-2">Cookie Policy</PublicLink>.
          </p>
        </div>
        <div className="grid shrink-0 gap-2 sm:grid-cols-3">
          <button type="button" onClick={rejectOptional} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c69d4]">Reject optional</button>
          <button type="button" onClick={openPreferences} className="min-h-11 rounded-xl border border-[#1c69d4] px-4 text-sm font-semibold text-[#1c69d4] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c69d4]">Manage preferences</button>
          <button type="button" onClick={acceptOptional} className="min-h-11 rounded-xl bg-[#1c69d4] px-4 text-sm font-semibold text-white hover:bg-[#1557b3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c69d4] focus-visible:ring-offset-2">Accept optional</button>
        </div>
      </div>
    </section>
  );
}

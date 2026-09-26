import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CookiePreferences } from "../../lib/cookieConsent";
import PublicLink from "../public/PublicLink";
import { useCookieConsent } from "./CookieConsentContext";
import { resolveSiteMode, SERVICE_SITE_ORIGIN } from "../../lib/siteMode";

const categories = [
  { key: "functional", title: "Functional", description: "Allows optional features such as the embedded Google map." },
  { key: "analytics", title: "Analytics", description: "Helps us understand website use when analytics is configured. No analytics tag loads without this choice." },
  { key: "marketing", title: "Marketing", description: "Allows configured advertising measurement. No advertising tag loads without this choice." },
] as const;

export default function CookiePreferencesDialog({ onClose }: { onClose: () => void }) {
  const { acceptOptional, preferences, rejectOptional, savePreferences } = useCookieConsent();
  const [draft, setDraft] = useState(preferences);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const policyHref = resolveSiteMode() === "marketplace" ? `${SERVICE_SITE_ORIGIN}/legal/cookie-policy` : "/legal/cookie-policy";

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const elements = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled])'));
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose]);

  const toggle = (key: "functional" | "analytics" | "marketing") => {
    setDraft((current) => ({ ...current, [key]: !current[key] } as CookiePreferences));
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-[2px] sm:items-center">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cookie-preferences-title" className="relative max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close cookie preferences" className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c69d4]"><X className="h-4 w-4" /></button>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#1c69d4]">Privacy controls</p>
        <h2 id="cookie-preferences-title" className="mt-2 pr-12 text-2xl font-bold text-slate-950">Cookie preferences</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">Choose which optional technologies STM Motors may use on this domain. You can change these choices at any time.</p>

        <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200">
          <div className="flex items-start justify-between gap-5 p-4 sm:p-5">
            <div><h3 className="font-bold text-slate-950">Necessary</h3><p className="mt-1 text-sm leading-6 text-slate-600">Required for security, consent records, forms, booking continuity and account sessions.</p></div>
            <span className="mt-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Always on</span>
          </div>
          {categories.map((category) => (
            <div key={category.key} className="flex items-start justify-between gap-5 p-4 sm:p-5">
              <div><h3 className="font-bold text-slate-950">{category.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{category.description}</p></div>
              <button type="button" role="switch" aria-checked={draft[category.key]} aria-label={`${category.title} cookies`} onClick={() => toggle(category.key)} className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1c69d4] focus-visible:ring-offset-2 ${draft[category.key] ? "bg-[#1c69d4]" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${draft[category.key] ? "left-6" : "left-1"}`} /></button>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-500">Learn more in our <PublicLink href={policyHref} className="font-semibold text-[#1c69d4] underline">Cookie Policy</PublicLink>.</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={rejectOptional} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700">Reject optional</button>
          <button type="button" onClick={() => savePreferences(draft)} className="min-h-11 rounded-xl border border-[#1c69d4] px-4 text-sm font-semibold text-[#1c69d4]">Save preferences</button>
          <button type="button" onClick={acceptOptional} className="min-h-11 rounded-xl bg-[#1c69d4] px-4 text-sm font-semibold text-white">Accept all</button>
        </div>
      </div>
    </div>
  );
}

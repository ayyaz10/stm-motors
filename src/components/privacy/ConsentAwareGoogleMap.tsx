import { MapPin } from "lucide-react";
import { useCookieConsent } from "./CookieConsentContext";

export default function ConsentAwareGoogleMap({
  address,
  embedUrl,
}: {
  address: string;
  embedUrl: string;
}) {
  const { allowFunctional, openPreferences, preferences } = useCookieConsent();

  if (preferences.functional) {
    return (
      <iframe
        src={embedUrl}
        title={`Map showing STM Motors at ${address}`}
        className="h-64 w-full rounded-lg border-0 lg:h-80"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  return (
    <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg bg-slate-50 px-6 text-center lg:h-80">
      <MapPin className="h-8 w-8 text-[#1c69d4]" aria-hidden="true" />
      <h3 className="mt-4 font-bold text-slate-950">Google map is turned off</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Allow functional technologies to load the interactive map for {address}.</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={allowFunctional} className="min-h-11 rounded-xl bg-[#1c69d4] px-5 text-sm font-semibold text-white">Load map</button>
        <button type="button" onClick={openPreferences} className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700">Manage preferences</button>
      </div>
    </div>
  );
}

import type { CookiePreferences } from "./cookieConsent";
import type { SiteMode } from "./siteMode";

type GtagCommand = [command: string, target: string | Date, parameters?: Record<string, unknown>];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagCommand) => void;
  }
}

const ga4MeasurementId =
  typeof __STM_GA4_MEASUREMENT_ID__ === "string"
    ? __STM_GA4_MEASUREMENT_ID__.trim()
    : "";
const googleAdsId =
  typeof __STM_GOOGLE_ADS_ID__ === "string" ? __STM_GOOGLE_ADS_ID__.trim() : "";

let activePreferences: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};
let scriptRequested = false;
let gaConfigured = false;
let adsConfigured = false;
let lastPageLocation = "";
const sentConversions = new Set<string>();
const sentLifecycleEvents = new Set<string>();

function consentParameters(preferences: CookiePreferences) {
  return {
    analytics_storage: preferences.analytics ? "granted" : "denied",
    ad_storage: preferences.marketing ? "granted" : "denied",
    ad_user_data: preferences.marketing ? "granted" : "denied",
    ad_personalization: preferences.marketing ? "granted" : "denied",
    functionality_storage: preferences.functional ? "granted" : "denied",
    personalization_storage: preferences.functional ? "granted" : "denied",
    security_storage: "granted",
  };
}

function initialiseGtag() {
  if (window.gtag) return;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = (...args: GtagCommand) => {
    window.dataLayer?.push(args);
  };
  window.gtag("consent", "default", consentParameters({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  }));
  window.gtag("js", new Date());
}

function requestGoogleTag(tagId: string) {
  if (!tagId || scriptRequested) return;
  initialiseGtag();
  scriptRequested = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagId)}`;
  script.dataset.stmGoogleTag = "true";
  document.head.appendChild(script);
}

function removeGoogleCookies() {
  const cookieNames = document.cookie
    .split(";")
    .map((cookie) => cookie.split("=")[0]?.trim())
    .filter((name) => name === "_ga" || name?.startsWith("_ga_") || name === "_gcl_au");
  cookieNames.forEach((name) => {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.${window.location.hostname}; SameSite=Lax`;
  });
}

export function applyGoogleConsent(preferences: CookiePreferences, siteMode: SiteMode) {
  activePreferences = preferences;
  if (siteMode === "staff") return;

  try {
    const shouldLoadAnalytics = preferences.analytics && Boolean(ga4MeasurementId);
    const shouldLoadMarketing = preferences.marketing && Boolean(googleAdsId);

    if (!shouldLoadAnalytics && !shouldLoadMarketing) {
      if (window.gtag) window.gtag("consent", "update", consentParameters(preferences));
      removeGoogleCookies();
      return;
    }

    requestGoogleTag(shouldLoadAnalytics ? ga4MeasurementId : googleAdsId);
    window.gtag?.("consent", "update", consentParameters(preferences));

    if (shouldLoadAnalytics && !gaConfigured) {
      window.gtag?.("config", ga4MeasurementId, { send_page_view: false });
      gaConfigured = true;
    }
    if (shouldLoadMarketing && !adsConfigured) {
      window.gtag?.("config", googleAdsId, { send_page_view: false });
      adsConfigured = true;
    }
  } catch (error) {
    console.warn("Optional Google tracking could not be updated.", error);
  }
}

export function trackPageView() {
  if (!activePreferences.analytics || !ga4MeasurementId || !window.gtag) return;
  try {
    const pageLocation = `${window.location.pathname}${window.location.search}`;
    if (pageLocation === lastPageLocation) return;
    lastPageLocation = pageLocation;
    window.gtag("event", "page_view", {
      page_location: window.location.href,
      page_path: pageLocation,
      page_title: document.title,
      send_to: ga4MeasurementId,
    });
    if ((pageLocation === "/book" || pageLocation.startsWith("/book?")) && !sentLifecycleEvents.has("booking_started")) {
      sentLifecycleEvents.add("booking_started");
      window.gtag("event", "booking_started", { source: "service", send_to: ga4MeasurementId });
    }
  } catch (error) {
    console.warn("Optional analytics page view could not be recorded.", error);
  }
}

export type StmAnalyticsEvent =
  | "booking_started"
  | "booking_submitted"
  | "contact_submitted"
  | "mechanic_application_submitted"
  | "marketplace_enquiry_submitted"
  | "vehicle_sale_request_submitted";

export function trackAnalyticsEvent(
  eventName: StmAnalyticsEvent,
  parameters: { service_slug?: string; source?: "service" | "marketplace" } = {},
) {
  if (!activePreferences.analytics || !ga4MeasurementId || !window.gtag) return;
  try {
    window.gtag("event", eventName, { ...parameters, send_to: ga4MeasurementId });
  } catch (error) {
    console.warn("Optional analytics event could not be recorded.", error);
  }
}

type ConversionKind = "booking" | "contact" | "mechanic" | "marketplace_enquiry" | "vehicle_sale";

const conversionLabels: Record<ConversionKind, string> = {
  booking: typeof __STM_GOOGLE_ADS_BOOKING_LABEL__ === "string" ? __STM_GOOGLE_ADS_BOOKING_LABEL__.trim() : "",
  contact: typeof __STM_GOOGLE_ADS_CONTACT_LABEL__ === "string" ? __STM_GOOGLE_ADS_CONTACT_LABEL__.trim() : "",
  mechanic: typeof __STM_GOOGLE_ADS_MECHANIC_LABEL__ === "string" ? __STM_GOOGLE_ADS_MECHANIC_LABEL__.trim() : "",
  marketplace_enquiry: typeof __STM_GOOGLE_ADS_MARKETPLACE_ENQUIRY_LABEL__ === "string" ? __STM_GOOGLE_ADS_MARKETPLACE_ENQUIRY_LABEL__.trim() : "",
  vehicle_sale: typeof __STM_GOOGLE_ADS_VEHICLE_SALE_LABEL__ === "string" ? __STM_GOOGLE_ADS_VEHICLE_SALE_LABEL__.trim() : "",
};

export function trackGoogleAdsConversion(kind: ConversionKind) {
  const label = conversionLabels[kind];
  if (!activePreferences.marketing || !googleAdsId || !label || !window.gtag) return;
  const dedupeKey = `${kind}:${window.location.pathname}`;
  if (sentConversions.has(dedupeKey)) return;
  try {
    window.gtag("event", "conversion", { send_to: `${googleAdsId}/${label}` });
    sentConversions.add(dedupeKey);
  } catch (error) {
    console.warn("Optional advertising conversion could not be recorded.", error);
  }
}

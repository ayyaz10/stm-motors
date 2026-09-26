import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultCookiePreferences,
  readCookieConsent,
  storeCookieConsent,
  type CookiePreferences,
} from "../../lib/cookieConsent";
import { applyGoogleConsent, trackPageView } from "../../lib/googleTracking";
import type { SiteMode } from "../../lib/siteMode";
import CookieBanner from "./CookieBanner";
import CookiePreferencesDialog from "./CookiePreferencesDialog";
import { CookieConsentContext, type CookieConsentContextValue } from "./CookieConsentContext";

export default function CookieConsentProvider({
  children,
  siteMode,
}: {
  children: ReactNode;
  siteMode: SiteMode;
}) {
  const enabled = siteMode !== "staff";
  const [initialConsent] = useState(() => enabled ? readCookieConsent() : null);
  const [preferences, setPreferences] = useState<CookiePreferences>(() => initialConsent?.preferences ?? defaultCookiePreferences);
  const [isConsentResolved, setIsConsentResolved] = useState(() => !enabled || Boolean(initialConsent));
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const commit = useCallback((nextPreferences: CookiePreferences) => {
    const record = storeCookieConsent(nextPreferences);
    setPreferences(record.preferences);
    setIsConsentResolved(true);
    setIsPreferencesOpen(false);
  }, []);

  const acceptOptional = useCallback(() => {
    commit({ necessary: true, functional: true, analytics: true, marketing: true });
  }, [commit]);
  const rejectOptional = useCallback(() => {
    commit(defaultCookiePreferences);
  }, [commit]);
  const allowFunctional = useCallback(() => {
    commit({ ...preferences, necessary: true, functional: true });
  }, [commit, preferences]);

  useEffect(() => {
    if (!enabled) return;
    applyGoogleConsent(preferences, siteMode);
    if (isConsentResolved) trackPageView();
  }, [enabled, isConsentResolved, preferences, siteMode]);

  useEffect(() => {
    if (!enabled) return;
    const handleNavigation = () => trackPageView();
    window.addEventListener("popstate", handleNavigation);
    return () => window.removeEventListener("popstate", handleNavigation);
  }, [enabled]);

  const value = useMemo<CookieConsentContextValue>(() => ({
    preferences,
    isConsentResolved,
    isConsentUiVisible: enabled && (!isConsentResolved || isPreferencesOpen),
    acceptOptional,
    rejectOptional,
    savePreferences: commit,
    allowFunctional,
    openPreferences: () => setIsPreferencesOpen(true),
  }), [acceptOptional, allowFunctional, commit, enabled, isConsentResolved, isPreferencesOpen, preferences, rejectOptional]);

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {enabled && !isConsentResolved && !isPreferencesOpen ? <CookieBanner /> : null}
      {enabled && isPreferencesOpen ? (
        <CookiePreferencesDialog onClose={() => setIsPreferencesOpen(false)} />
      ) : null}
    </CookieConsentContext.Provider>
  );
}

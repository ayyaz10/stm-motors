export const COOKIE_CONSENT_STORAGE_KEY = "stm_cookie_consent_v1";
export const COOKIE_POLICY_VERSION = "2026-09-04";
export const COOKIE_CONSENT_DURATION_MS = 180 * 24 * 60 * 60 * 1_000;

export interface CookiePreferences {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface StoredCookieConsent {
  version: 1;
  policyVersion: string;
  decidedAt: string;
  expiresAt: string;
  preferences: CookiePreferences;
}

export const defaultCookiePreferences: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function parseStoredCookieConsent(
  rawValue: string | null,
  now = Date.now(),
): StoredCookieConsent | null {
  if (!rawValue) return null;

  try {
    const value = JSON.parse(rawValue) as Partial<StoredCookieConsent>;
    const preferences = value.preferences as Partial<CookiePreferences> | undefined;
    const expiresAt = typeof value.expiresAt === "string" ? Date.parse(value.expiresAt) : Number.NaN;
    const decidedAt = typeof value.decidedAt === "string" ? Date.parse(value.decidedAt) : Number.NaN;

    if (
      value.version !== 1 ||
      value.policyVersion !== COOKIE_POLICY_VERSION ||
      !Number.isFinite(expiresAt) ||
      !Number.isFinite(decidedAt) ||
      expiresAt <= now ||
      !preferences ||
      preferences.necessary !== true ||
      !isBoolean(preferences.functional) ||
      !isBoolean(preferences.analytics) ||
      !isBoolean(preferences.marketing)
    ) {
      return null;
    }

    return value as StoredCookieConsent;
  } catch {
    return null;
  }
}

export function readCookieConsent(): StoredCookieConsent | null {
  if (typeof window === "undefined") return null;

  try {
    return parseStoredCookieConsent(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function storeCookieConsent(
  preferences: Omit<CookiePreferences, "necessary"> & { necessary?: true },
  now = Date.now(),
): StoredCookieConsent {
  const record: StoredCookieConsent = {
    version: 1,
    policyVersion: COOKIE_POLICY_VERSION,
    decidedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + COOKIE_CONSENT_DURATION_MS).toISOString(),
    preferences: {
      necessary: true,
      functional: preferences.functional,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
    },
  };

  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // The current page can still honour the choice in memory when storage is blocked.
  }

  return record;
}

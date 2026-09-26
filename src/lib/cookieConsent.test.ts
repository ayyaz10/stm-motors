import {
  COOKIE_CONSENT_DURATION_MS,
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_POLICY_VERSION,
  parseStoredCookieConsent,
  readCookieConsent,
  storeCookieConsent,
} from "./cookieConsent";

describe("cookie consent storage", () => {
  beforeEach(() => window.localStorage.clear());

  test("stores a versioned choice with a six-month expiry", () => {
    const now = Date.UTC(2026, 8, 4);
    const record = storeCookieConsent({ functional: true, analytics: false, marketing: false }, now);

    expect(record.policyVersion).toBe(COOKIE_POLICY_VERSION);
    expect(record.preferences).toEqual({ necessary: true, functional: true, analytics: false, marketing: false });
    expect(Date.parse(record.expiresAt) - now).toBe(COOKIE_CONSENT_DURATION_MS);
    expect(readCookieConsent()).not.toBeNull();
    expect(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)).toContain(COOKIE_POLICY_VERSION);
  });

  test("rejects malformed, expired, and stale-policy records", () => {
    expect(parseStoredCookieConsent("not-json")).toBeNull();
    expect(parseStoredCookieConsent(JSON.stringify({ version: 1 }))).toBeNull();

    const now = Date.UTC(2026, 8, 4);
    const record = storeCookieConsent({ functional: false, analytics: false, marketing: false }, now);
    expect(parseStoredCookieConsent(JSON.stringify(record), now + COOKIE_CONSENT_DURATION_MS + 1)).toBeNull();
    expect(parseStoredCookieConsent(JSON.stringify({ ...record, policyVersion: "old" }), now)).toBeNull();
  });
});

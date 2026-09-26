import type { SiteMode } from "./siteMode";

export const MECHANIC_RECRUITMENT_DELAY_MS = 6_000;
export const MECHANIC_RECRUITMENT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1_000;
export const MECHANIC_RECRUITMENT_DISMISSED_KEY =
  "stm-mechanic-recruitment-popup-dismissed-at";
export const MECHANIC_RECRUITMENT_SESSION_KEY =
  "stm-mechanic-recruitment-popup-shown";

export function isMechanicRecruitmentEligible(
  siteMode: SiteMode,
  pathname: string,
  hostname = typeof window === "undefined" ? "" : window.location.hostname,
) {
  const normalizedHostname = hostname.trim().toLowerCase();
  const isSupportedHostname =
    normalizedHostname === "stmmotors.com" ||
    normalizedHostname === "www.stmmotors.com" ||
    normalizedHostname === "localhost" ||
    normalizedHostname === "127.0.0.1" ||
    normalizedHostname === "[::1]";
  return siteMode === "service" && pathname === "/" && isSupportedHostname;
}

export function isMechanicRecruitmentInCooldown(
  storedValue: string | null,
  now = Date.now(),
) {
  if (!storedValue) return false;
  const dismissedAt = Number(storedValue);
  return (
    Number.isFinite(dismissedAt) &&
    dismissedAt > 0 &&
    dismissedAt <= now &&
    now - dismissedAt < MECHANIC_RECRUITMENT_COOLDOWN_MS
  );
}

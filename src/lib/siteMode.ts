export type SiteMode = "marketplace" | "service" | "staff";

export const SERVICE_SITE_ORIGIN = "https://stmmotors.com";
export const MARKETPLACE_SITE_ORIGIN = "https://stmmotors.co.uk";
export const STAFF_SITE_ORIGIN = "https://staff.stmmotors.com";

export function resolveSiteMode(
  hostname = typeof window === "undefined" ? "" : window.location.hostname,
  configuredMode =
    typeof __STM_SITE_MODE__ === "string" ? __STM_SITE_MODE__.trim() : "auto",
  pathname = typeof window === "undefined" ? "/" : window.location.pathname,
): SiteMode {
  if (
    configuredMode === "marketplace" ||
    configuredMode === "service" ||
    configuredMode === "staff"
  ) {
    return configuredMode;
  }

  const normalizedHostname = hostname.trim().toLowerCase();

  const isLocalHostname =
    normalizedHostname === "localhost" ||
    normalizedHostname === "127.0.0.1" ||
    normalizedHostname === "[::1]";
  const isMarketplaceOnlyPath =
    pathname === "/cars" ||
    pathname.startsWith("/cars/") ||
    pathname === "/cars-for-sale" ||
    pathname.startsWith("/cars-for-sale/") ||
    pathname === "/sell-your-car" ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/");
  const isStaffOnlyPath =
    pathname === "/login" ||
    pathname === "/dashboard" ||
    pathname === "/staff" ||
    pathname === "/accept-invite" ||
    pathname === "/accept-mechanic-invite" ||
    pathname.startsWith("/marketplace/") ||
    pathname.startsWith("/operations/") ||
    pathname === "/staff/login" ||
    pathname.startsWith("/ops/") ||
    pathname === "/mechanic/jobs" ||
    pathname === "/mechanic/job-overview" ||
    pathname === "/mechanic/service-checklist" ||
    pathname === "/mechanic/checklist" ||
    pathname === "/mechanic/vehicle-check-in" ||
    pathname === "/vehiclecheckin";
  const isLegacyStaffAdminPath =
    pathname !== "/admin/accept-invite" &&
    (pathname === "/admin" || pathname.startsWith("/admin/"));

  if (normalizedHostname === "staff.stmmotors.com") {
    return "staff";
  }

  if (isLocalHostname && (isStaffOnlyPath || isLegacyStaffAdminPath)) {
    return "staff";
  }

  if (isLocalHostname && isMarketplaceOnlyPath) {
    return "marketplace";
  }

  return normalizedHostname === "stmmotors.co.uk" ||
    normalizedHostname === "www.stmmotors.co.uk"
    ? "marketplace"
    : "service";
}

export function isMarketplaceSite(): boolean {
  return resolveSiteMode() === "marketplace";
}

export function isStaffSite(): boolean {
  return resolveSiteMode() === "staff";
}

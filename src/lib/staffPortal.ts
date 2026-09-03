import type { StaffRole } from "./auth";
import { STAFF_SITE_ORIGIN } from "./siteMode";

export const STAFF_PORTAL_ROUTES = {
  login: "/login",
  dashboard: "/dashboard",
  marketplaceVehicles: "/marketplace/vehicles",
  marketplaceVehicleNew: "/marketplace/vehicles/new",
  marketplaceEnquiries: "/marketplace/enquiries",
  marketplaceSellSubmissions: "/marketplace/sell-submissions",
  operationsJobs: "/operations/jobs",
  operationsProgress: "/operations/job-progress",
  operationsApplications: "/operations/mechanic-applications",
  mechanicJobs: "/mechanic/jobs",
  mechanicOverview: "/mechanic/job-overview",
  mechanicChecklist: "/mechanic/checklist",
  mechanicCheckIn: "/mechanic/vehicle-check-in",
  staff: "/staff",
  acceptInvite: "/accept-invite",
  acceptMechanicInvite: "/accept-mechanic-invite",
} as const;

const marketplaceRoles: StaffRole[] = ["admin", "ops"];
const operationsRoles: StaffRole[] = ["admin", "ops"];
const reviewRoles: StaffRole[] = ["admin", "ops", "mechanic"];

export function allowedRolesForStaffRoute(pathname: string): StaffRole[] | null {
  if (pathname === STAFF_PORTAL_ROUTES.dashboard) return reviewRoles;
  if (pathname === STAFF_PORTAL_ROUTES.staff) return ["admin"];
  if (pathname.startsWith("/marketplace/")) return marketplaceRoles;
  if (pathname.startsWith("/operations/")) return operationsRoles;
  if (pathname === STAFF_PORTAL_ROUTES.mechanicJobs) return ["admin", "mechanic"];
  if (pathname.startsWith("/mechanic/")) return reviewRoles;
  return null;
}

export function canAccessStaffRoute(role: StaffRole, pathname: string) {
  return allowedRolesForStaffRoute(pathname)?.includes(role) ?? false;
}

export function defaultRouteForRole(role: StaffRole) {
  return role === "mechanic"
    ? STAFF_PORTAL_ROUTES.mechanicJobs
    : STAFF_PORTAL_ROUTES.dashboard;
}

const exactLegacyRoutes: Record<string, string> = {
  "/staff/login": STAFF_PORTAL_ROUTES.login,
  "/admin/login": STAFF_PORTAL_ROUTES.login,
  "/admin/vehicles": STAFF_PORTAL_ROUTES.marketplaceVehicles,
  "/admin/vehicles/new": STAFF_PORTAL_ROUTES.marketplaceVehicleNew,
  "/admin/enquiries": STAFF_PORTAL_ROUTES.marketplaceEnquiries,
  "/admin/sell-submissions": STAFF_PORTAL_ROUTES.marketplaceSellSubmissions,
  "/admin/staff": STAFF_PORTAL_ROUTES.staff,
  "/ops/jobs": STAFF_PORTAL_ROUTES.operationsJobs,
  "/ops/job-progress": STAFF_PORTAL_ROUTES.operationsProgress,
  "/ops/mechanic-applications": STAFF_PORTAL_ROUTES.operationsApplications,
  "/mechanic/jobs": STAFF_PORTAL_ROUTES.mechanicJobs,
  "/mechanic/job-overview": STAFF_PORTAL_ROUTES.mechanicOverview,
  "/mechanic/service-checklist": STAFF_PORTAL_ROUTES.mechanicChecklist,
  "/vehiclecheckin": STAFF_PORTAL_ROUTES.mechanicCheckIn,
};

const safeWorkflowKeys = new Set([
  "jobId",
  "jobReference",
  "bookingId",
  "bookingNumber",
  "source",
]);
const safeValue = /^[a-zA-Z0-9_-]{1,120}$/;
const safeSources = new Set([
  "ops",
  "progress",
  "overview",
  "checkin",
  "checklist",
  "mechanic",
  "ops-assign",
  "ops-progress",
  "mechanic-dashboard",
]);

export function sanitizeStaffWorkflowSearch(search: string) {
  const source = new URLSearchParams(search);
  const safe = new URLSearchParams();
  for (const [key, value] of source.entries()) {
    if (!safeWorkflowKeys.has(key) || !safeValue.test(value)) continue;
    if (key === "source" && !safeSources.has(value)) continue;
    safe.set(key, value);
  }
  const query = safe.toString();
  return query ? `?${query}` : "";
}

export function mapLegacyStaffPath(pathname: string): string | null {
  const exact = exactLegacyRoutes[pathname];
  if (exact) return exact;
  const editorMatch = pathname.match(/^\/admin\/vehicles\/([0-9a-f-]+)\/edit$/i);
  return editorMatch ? `/marketplace/vehicles/${editorMatch[1]}/edit` : null;
}

export function isLocalStaffPreview(hostname = window.location.hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function buildStaffPortalUrl(
  pathname: string,
  search = "",
  hostname = window.location.hostname,
) {
  const targetPath = mapLegacyStaffPath(pathname) ?? pathname;
  const safeSearch = sanitizeStaffWorkflowSearch(search);
  if (isLocalStaffPreview(hostname)) return `${targetPath}${safeSearch}`;
  return `${STAFF_SITE_ORIGIN}${targetPath}${safeSearch}`;
}

import {
  buildStaffPortalUrl,
  canAccessStaffRoute,
  mapLegacyStaffPath,
  sanitizeStaffWorkflowSearch,
} from "./staffPortal";

describe("staff portal routing and permissions", () => {
  test("maps legacy marketplace, Ops and Mechanic routes", () => {
    expect(mapLegacyStaffPath("/admin/vehicles")).toBe("/marketplace/vehicles");
    expect(mapLegacyStaffPath("/admin/vehicles/123e4567-e89b-12d3-a456-426614174000/edit")).toBe("/marketplace/vehicles/123e4567-e89b-12d3-a456-426614174000/edit");
    expect(mapLegacyStaffPath("/ops/job-progress")).toBe("/operations/job-progress");
    expect(mapLegacyStaffPath("/mechanic/service-checklist")).toBe("/mechanic/checklist");
  });

  test("preserves only allowlisted workflow identifiers", () => {
    const safe = sanitizeStaffWorkflowSearch("?jobId=job_123&bookingNumber=STM-42&source=ops-progress&access_token=secret&password=bad&redirect=https://evil.example");
    expect(safe).toBe("?jobId=job_123&bookingNumber=STM-42&source=ops-progress");
  });

  test("never creates a production redirect during localhost testing", () => {
    expect(buildStaffPortalUrl("/ops/jobs", "?jobId=abc", "localhost")).toBe("/operations/jobs?jobId=abc");
    expect(buildStaffPortalUrl("/ops/jobs", "?jobId=abc", "stmmotors.com")).toBe("https://staff.stmmotors.com/operations/jobs?jobId=abc");
  });

  test("enforces the requested role matrix", () => {
    expect(canAccessStaffRoute("admin", "/staff")).toBe(true);
    expect(canAccessStaffRoute("ops", "/marketplace/vehicles")).toBe(true);
    expect(canAccessStaffRoute("ops", "/staff")).toBe(false);
    expect(canAccessStaffRoute("mechanic", "/mechanic/jobs")).toBe(true);
    expect(canAccessStaffRoute("mechanic", "/operations/jobs")).toBe(false);
    expect(canAccessStaffRoute("mechanic", "/marketplace/vehicles")).toBe(false);
  });
});


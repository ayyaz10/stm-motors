import {
  isValidStaffEmail,
  normalizeStaffEmail,
  validateStaffPassword,
} from "./staffInvitations";

describe("staff invitation validation", () => {
  test("normalizes staff email addresses", () => {
    expect(normalizeStaffEmail("  Admin@STMmotors.CO.UK ")).toBe(
      "admin@stmmotors.co.uk",
    );
  });

  test("accepts valid email addresses and rejects malformed values", () => {
    expect(isValidStaffEmail("ops@stmmotors.co.uk")).toBe(true);
    expect(isValidStaffEmail("not-an-email")).toBe(false);
    expect(isValidStaffEmail("a@b")).toBe(false);
  });

  test("requires a strong staff password", () => {
    expect(validateStaffPassword("StrongPassword2026")).toBeNull();
    expect(validateStaffPassword("short1A")).toMatch(/12/);
    expect(validateStaffPassword("alllowercase1234")).toMatch(/uppercase/);
  });
});

import {
  hasExactKeys,
  isInvitedStaffRole,
  isValidStaffEmail,
  normalizeStaffEmail,
  validateStaffPassword,
} from "./staff-invitations.ts";

Deno.test("staff invitation inputs are normalized and validated", () => {
  if (normalizeStaffEmail(" Admin@STMmotors.CO.UK ") !== "admin@stmmotors.co.uk") {
    throw new Error("Email normalization failed.");
  }
  if (!isValidStaffEmail("ops@stmmotors.co.uk") || isValidStaffEmail("invalid")) {
    throw new Error("Email validation failed.");
  }
  if (!isInvitedStaffRole("admin") || !isInvitedStaffRole("ops") || isInvitedStaffRole("mechanic")) {
    throw new Error("Role allowlist validation failed.");
  }
});

Deno.test("staff invitation payloads reject unexpected fields", () => {
  if (!hasExactKeys({ action: "list" }, ["action"])) {
    throw new Error("Expected list payload to be accepted.");
  }
  if (hasExactKeys({ action: "list", role: "admin" }, ["action"])) {
    throw new Error("Unexpected payload field was accepted.");
  }
});

Deno.test("staff invitation passwords meet the elevated-access policy", () => {
  if (validateStaffPassword("StrongPassword2026") !== null) {
    throw new Error("Strong password was rejected.");
  }
  if (!validateStaffPassword("weak")) {
    throw new Error("Weak password was accepted.");
  }
});

export const STAFF_INVITE_EXPIRY_MS = 60 * 60 * 1000;
export const STAFF_INVITE_RESEND_COOLDOWN_MS = 5 * 60 * 1000;
export const STAFF_ROLES = ["admin", "ops"] as const;

export type InvitedStaffRole = (typeof STAFF_ROLES)[number];

export function normalizeStaffEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidStaffEmail(value: string) {
  return (
    value.length >= 3 &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

export function isInvitedStaffRole(value: unknown): value is InvitedStaffRole {
  return value === "admin" || value === "ops";
}

export function normalizeStaffName(value: unknown) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, 120)
    : "";
}

export function validateStaffPassword(value: unknown) {
  if (typeof value !== "string" || value.length < 12 || value.length > 128) {
    return "Use a password between 12 and 128 characters.";
  }
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    return "Include an uppercase letter, a lowercase letter and a number.";
  }
  return null;
}

export function hasExactKeys(
  value: unknown,
  required: string[],
  optional: string[] = [],
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value as Record<string, unknown>);
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => keys.includes(key)) &&
    keys.every((key) => allowed.has(key));
}

export function safeStaffFailureReason(value: unknown) {
  const text = value instanceof Error ? value.message : String(value || "Unknown error");
  return text.replace(/[\r\n\t]+/g, " ").slice(0, 500);
}

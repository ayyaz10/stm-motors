/**
 * UK Postcode validation utility
 * Validates UK postcodes according to government format standards
 */

// Constants for validation rules
const INVALID_FIRST_CHARS = ["Q", "V", "X"] as const;
const INVALID_INWARD_CHARS = /[CIJKMPQVXYZ]/; // Letters not allowed in last 3 chars
const SPECIAL_CASE = "GIR0AA";

// Postcode format patterns (without spaces)
const POSTCODE_PATTERNS = [
  /^[A-Z][0-9][0-9]?[0-9]?[A-Z]{2}$/, // AN NAA (e.g., M1 1AE)
  /^[A-Z]{2}[0-9][0-9]?[0-9]?[A-Z]{2}$/, // AAN NAA (e.g., DN55 8XT)
  /^[A-Z][0-9][A-Z][0-9][A-Z]{2}$/, // ANA NAA (e.g., E1W 3TJ)
  /^[A-Z]{2}[0-9][A-Z][0-9][A-Z]{2}$/, // AANA NAA (e.g., EC1Y 8SY)
] as const;

type PostcodeFormat = "AN NAA" | "AAN NAA" | "ANA NAA" | "AANA NAA" | "SPECIAL";

interface ValidationResult {
  isValid: boolean;
  formatted?: string;
  format?: PostcodeFormat;
  error?: string;
}

/**
 * Normalizes a postcode by removing spaces and converting to uppercase
 */
const normalizePostcode = (postcode: string): string => {
  return postcode.replace(/\s+/g, "").toUpperCase();
};

/**
 * Formats a postcode with the standard UK space
 * e.g., "SW1A1AA" -> "SW1A 1AA"
 */
const formatPostcode = (postcode: string): string => {
  const normalized = normalizePostcode(postcode);

  if (normalized.length < 5) return normalized;

  const outward = normalized.slice(0, -3);
  const inward = normalized.slice(-3);

  return `${outward} ${inward}`;
};

/**
 * Validates a UK postcode
 * @param postcode - The postcode to validate (can include spaces, lowercase)
 * @returns boolean - true if valid, false otherwise
 *
 * @example
 * validatePostcode('SW1A 1AA') // true
 * validatePostcode('sw1a1aa') // true
 * validatePostcode('INVALID') // false
 */
const validatePostcode = (postcode: unknown): boolean => {
  // Handle invalid inputs
  if (!postcode || typeof postcode !== "string") {
    return false;
  }

  // Normalize the postcode
  const normalized = normalizePostcode(postcode);

  // Check minimum length
  if (normalized.length < 5 || normalized.length > 7) {
    return false;
  }

  // Special case
  if (normalized === SPECIAL_CASE) {
    return true;
  }

  // Check format against patterns
  const hasValidFormat = POSTCODE_PATTERNS.some((pattern) =>
    pattern.test(normalized),
  );

  if (!hasValidFormat) {
    return false;
  }

  // Check first character is not invalid
  const firstChar = normalized[0];
  if (
    INVALID_FIRST_CHARS.includes(
      firstChar as (typeof INVALID_FIRST_CHARS)[number],
    )
  ) {
    return false;
  }

  // Check inward code (last 3 chars) doesn't contain invalid letters
  const inwardCode = normalized.slice(-3);
  if (INVALID_INWARD_CHARS.test(inwardCode)) {
    return false;
  }

  return true;
};

/**
 * Validates a UK postcode with detailed result
 * @param postcode - The postcode to validate
 * @returns ValidationResult object with details
 *
 * @example
 * validatePostcodeDetailed('SW1A 1AA')
 * // { isValid: true, formatted: 'SW1A 1AA', format: 'AANA NAA' }
 */
const validatePostcodeDetailed = (postcode: unknown): ValidationResult => {
  // Handle invalid inputs
  if (!postcode || typeof postcode !== "string") {
    return {
      isValid: false,
      error: !postcode ? "No postcode provided" : "Postcode must be a string",
    };
  }

  const normalized = normalizePostcode(postcode);

  // Check minimum length
  if (normalized.length < 5) {
    return { isValid: false, error: "Postcode too short" };
  }

  if (normalized.length > 7) {
    return { isValid: false, error: "Postcode too long" };
  }

  // Special case
  if (normalized === SPECIAL_CASE) {
    return {
      isValid: true,
      formatted: formatPostcode(normalized),
      format: "SPECIAL",
    };
  }

  // Check format and identify which pattern matched
  let matchedFormat: PostcodeFormat | undefined;

  if (POSTCODE_PATTERNS[0].test(normalized)) matchedFormat = "AN NAA";
  else if (POSTCODE_PATTERNS[1].test(normalized)) matchedFormat = "AAN NAA";
  else if (POSTCODE_PATTERNS[2].test(normalized)) matchedFormat = "ANA NAA";
  else if (POSTCODE_PATTERNS[3].test(normalized)) matchedFormat = "AANA NAA";

  if (!matchedFormat) {
    return { isValid: false, error: "Invalid postcode format" };
  }

  // Check first character
  const firstChar = normalized[0];
  if (
    INVALID_FIRST_CHARS.includes(
      firstChar as (typeof INVALID_FIRST_CHARS)[number],
    )
  ) {
    return { isValid: false, error: `Postcode cannot start with ${firstChar}` };
  }

  // Check inward code
  const inwardCode = normalized.slice(-3);
  if (INVALID_INWARD_CHARS.test(inwardCode)) {
    return { isValid: false, error: "Invalid characters in postcode suffix" };
  }

  return {
    isValid: true,
    formatted: formatPostcode(normalized),
    format: matchedFormat,
  };
};

// Export utility functions
export {
  validatePostcode,
  validatePostcodeDetailed,
  formatPostcode,
  normalizePostcode,
};

// Default export for simple boolean validation
export default validatePostcode;








// function normalizePostcode(postcode) {
//   const clean = postcode.toUpperCase().replace(/[^A-Z0-9]/g, "");

//   if (clean.length < 5) return clean;

//   return clean.slice(0, -3) + " " + clean.slice(-3);
// }

// function validateUKPostcode(postcode) {
//   const pc = normalizePostcode(postcode).toUpperCase().replace(/\s+/g, "");

//   if (pc === "GIR0AA") return true;

//   const patterns = [
//     /^[A-PR-UWYZ][0-9][0-9]?[0-9][ABD-HJLNP-UW-Z]{2}$/,
//     /^[A-PR-UWYZ][A-HK-Y][0-9][0-9]?[0-9][ABD-HJLNP-UW-Z]{2}$/,
//     /^[A-PR-UWYZ][0-9][A-HJKSTUW][0-9][ABD-HJLNP-UW-Z]{2}$/,
//     /^[A-PR-UWYZ][A-HK-Y][0-9][ABEHMNPRVWXY][0-9][ABD-HJLNP-UW-Z]{2}$/,
//   ];

//   return patterns.some((pattern) => pattern.test(pc));
// }

// export default validateUKPostcode;

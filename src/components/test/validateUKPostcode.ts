/**
 * Validates a UK postcode according to UK Government Data Standards Catalogue rules.
 * @param postcode - The postcode string to validate, or null/undefined
 * @returns true if valid, false otherwise
 */
const validateUKPostcode = (postcode: string | null | undefined): boolean => {
  if (!postcode || typeof postcode !== 'string') {
    return false;
  }

  // Normalize: trim whitespace, convert to uppercase
  const normalized = postcode.trim().toUpperCase();

  // Special case: GIR 0AA (Girobank) - handle before regex
  if (normalized.replace(/\s+/g, '') === 'GIR0AA') {
    return true;
  }

  // UK postcode regex pattern - allow multiple spaces
  const postcodeRegex = /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s*[0-9][A-Z]{2}$/;

  if (!postcodeRegex.test(normalized)) {
    return false;
  }

  // Check for invalid first letters (Q, V, X not allowed in first position)
  const firstChar = normalized.charAt(0);
  if (['Q', 'V', 'X'].includes(firstChar)) {
    return false;
  }

  // Check inward code (last 3 characters) - I, J, Q, Z not allowed
  const inwardCode = normalized.slice(-3);
  if (/[IJQZ]/.test(inwardCode)) {
    return false;
  }

  return true;
};

export default validateUKPostcode;
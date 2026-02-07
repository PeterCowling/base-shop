// /src/types/checkInCode.ts

/**
 * Check-in code data stored in Firebase for QR-based check-in.
 * Bidirectional index enables both:
 *   - Staff lookup by code: checkInCodes/byCode/{code}
 *   - Guest lookup by UUID: checkInCodes/byUuid/{uuid}
 *
 * Codes are generated server-side via Cloud Function using an atomic counter
 * to ensure uniqueness. Codes expire 48 hours after checkout date.
 */

/**
 * Check-in code format: "BRK-XXXXX" where X is alphanumeric.
 * Example: "BRK-A7K9M"
 */
export const CHECK_IN_CODE_PREFIX = 'BRK-';
export const CHECK_IN_CODE_LENGTH = 5; // Characters after prefix

/**
 * Check-in code record stored at checkInCodes/byCode/{code}
 * and checkInCodes/byUuid/{uuid}.
 *
 * @property code - The unique check-in code (e.g., "BRK-A7K9M")
 * @property uuid - Guest's unique identifier
 * @property createdAt - Timestamp when code was generated
 * @property expiresAt - Timestamp when code becomes invalid (checkout + 48h)
 */
export interface CheckInCodeRecord {
  code: string;
  uuid: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Minimal data returned to staff when looking up a check-in code.
 * Intentionally limited to protect guest privacy.
 *
 * @property guestName - First name + last initial only (e.g., "Marco R.")
 * @property roomAssignment - Room number or "Not assigned"
 * @property checkInDate - ISO date string (e.g., "2026-01-15")
 * @property checkOutDate - ISO date string (e.g., "2026-01-18")
 * @property nights - Number of nights staying
 * @property cityTaxDue - Amount in EUR
 * @property depositDue - Amount in EUR (typically keycard deposit)
 * @property etaWindow - Expected arrival time or null (e.g., "18:00-18:30")
 * @property etaMethod - Travel method or null (e.g., "ferry")
 */
export interface StaffCheckInView {
  guestName: string;
  roomAssignment: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  cityTaxDue: number;
  depositDue: number;
  etaWindow: string | null;
  etaMethod: string | null;
}

/**
 * Hours after checkout when the check-in code expires.
 * Allows guests to still access their portal briefly after leaving.
 */
export const CODE_EXPIRY_HOURS_AFTER_CHECKOUT = 48;

/**
 * Firebase paths for check-in code storage.
 */
export const CHECK_IN_CODE_PATHS = {
  /** Code → UUID lookup (staff access) */
  byCode: (code: string) => `checkInCodes/byCode/${code}` as const,
  /** UUID → Code lookup (guest access) */
  byUuid: (uuid: string) => `checkInCodes/byUuid/${uuid}` as const,
  /** Atomic counter for code generation */
  counter: 'checkInCodeCounter/lastCode' as const,
} as const;

// src/types/booking.ts
// Shared booking-domain types for the brikette app.

/**
 * State of a booking query (date + pax combination).
 * - valid: query has valid dates within constraints
 * - invalid: dates are present but fail validation rules
 * - absent: no dates have been entered yet
 */
export type RoomQueryState = "valid" | "invalid" | "absent";

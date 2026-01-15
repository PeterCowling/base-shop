/* /src/types/guestsDetails.ts */

/**
 * Defines the TypeScript types for the "guestsDetails" node in Firebase.
 *
 * Structure:
 * "guestsDetails": {
 *   "<booking_reference>": {
 *     "<occupant_id>": {
 *       "citizenship": "<string>",
 *       "dateOfBirth": {
 *         "dd": "<string>",
 *         "mm": "<string>",
 *         "yyyy": "<string>"
 *       },
 *       "document": {
 *         "number": "<string>",
 *         "type": "<string>"
 *       },
 *       "email": "<string>",
 *       "firstName": "<string>",
 *       "gender": "<string>",
 *       "language": "<string>",
 *       "lastName": "<string>",
 *       "municipality": "<string>",
 *       "placeOfBirth": "<string>"
 *     }
 *   }
 * }
 */

export interface GuestDetailsDateOfBirth {
  dd: string;
  mm: string;
  yyyy: string;
}

export interface GuestDetailsDocument {
  number: string;
  type: string; // e.g., "Passport"
}

export interface GuestDetailsRecord {
  citizenship: string;
  dateOfBirth: GuestDetailsDateOfBirth;
  document: GuestDetailsDocument;
  email: string;
  firstName: string;
  gender: string;
  language: string; // e.g., 'en', 'es', ...
  lastName: string;
  municipality: string;
  placeOfBirth: string;
}

/**
 * For occupantId -> occupant details (single occupant).
 */
export type OccupantDetails = GuestDetailsRecord;

/**
 * Mapping from occupantId to a GuestDetailsRecord.
 */
export interface GuestsDetailsByOccupantId {
  [occupantId: string]: GuestDetailsRecord;
}

/**
 * Top-level structure for "guestsDetails", keyed by booking reference,
 * which contains occupant data keyed by occupant ID.
 */
export interface GuestsDetails {
  [bookingReference: string]: GuestsDetailsByOccupantId;
}

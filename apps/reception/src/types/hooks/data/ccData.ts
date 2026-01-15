/* src/types/hooks/data/ccData.ts */

/**
 * Represents the credit card details for a single occupant.
 *
 * Example:
 *   ccNum: "4111111111111111",  // Credit card number
 *   expDate: "12/30"             // Expiration date of the card (e.g., "MM/YY" or "MM/YYYY")
 */
export interface CCDetails {
  ccNum: string;
  expDate: string;
}

/**
 * A map of occupantId -> CCDetails.
 *
 * Example:
 *   "occ_1740508445159": {
 *     ccNum: "4111111111111111",
 *     expDate: "12/30"
 *   }
 */
export interface BookingCCData {
  [occupantId: string]: CCDetails;
}

/**
 * The entire "ccData" node for a given booking reference -> occupantId -> CCDetails.
 *
 * Structure:
 *   "ccData": {
 *     "<booking_reference>": {
 *       "<occupant_id>": {
 *         ccNum: "<string>",
 *         expDate: "<string>"
 *       }
 *     }
 *   }
 *
 * Where:
 *   - booking_reference (string): The same booking code used in the bookings node (e.g., "4092716050" or "DT1PO8").
 *   - occupant_id (string): Unique identifier for an occupant (e.g., occ_1740508445159).
 *   - ccNum (string): Credit card number.
 *   - expDate (string): Expiration date (format is flexible, e.g., "MM/YY" or "MM/YYYY").
 *
 * Example:
 *   "ccData": {
 *     "4092716050": {
 *       "occ_1740508445159": {
 *         ccNum: "4111111111111111",
 *         expDate: "12/30"
 *       }
 *     }
 *   }
 */
export type CCData = Record<string, BookingCCData>;

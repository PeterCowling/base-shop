/* src/types/hooks/data/checkinData.ts */

/**
 * Represents occupant data for a single check-in record.
 *
 *   reservationCode: "4092716050",        // Booking reference for the occupant’s stay
 *   timestamp: "2024-02-19T08:00:00.000Z"   // When the check-in was recorded (ISO 8601 format)
 */
export interface CheckinRecord {
  reservationCode?: string;
  timestamp?: string;
}

/**
 * A map of occupantId -> CheckinRecord.
 *
 *   "occ_1740508445159": {
 *     reservationCode: "4092716050",
 *     timestamp: "2024-02-19T08:00:00.000Z"
 *   }
 */
export interface CheckinData {
  [occupantId: string]: CheckinRecord;
}

/**
 * The entire "checkins" node for a given date (YYYY-MM-DD) -> CheckinData.
 *
 *   "checkins": {
 *     "2025-03-20": {
 *       "occ_1740508445159": {
 *         reservationCode: "4092716050",
 *         timestamp: "2024-02-19T08:00:00.000Z"
 *       }
 *     }
 *   }
 */
export type Checkins = Record<string, CheckinData> | null;

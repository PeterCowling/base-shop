/* src/types/hooks/data/activitiesData.ts */

/**
 * Represents data for a single activity record.
 *
 * Example:
 *   code: 1,                               // Numeric code indicating the type of event (e.g., 1 for check-in, 21 for a specific system action)
 *   timestamp: "2024-02-19T08:00:00.000Z",   // When the activity occurred (ISO 8601 format)
 *   who: "System"                          // Entity responsible for the activity (e.g., "System" or a staff name)
 */
export interface Activity {
  code: number;
  timestamp?: string;
  who: string;
}

/**
 * A map of activityId -> Activity record.
 *
 * Example:
 *   "act_1740508445748": {
 *     code: 1,
 *     timestamp: "2024-02-19T08:00:00.000Z",
 *     who: "System"
 *   }
 */
export interface ActivityData {
  [activityId: string]: Activity;
}

/**
 * The entire "activities" node mapping occupantId to their activity records.
 *
 * Structure:
 *   "activities": {
 *     "<occupant_id>": {
 *       "<activity_id>": {
 *         code: <number>,
 *         timestamp: "<ISO 8601 string>",
 *         who: "<string>"
 *       }
 *     }
 *   }
 *
 * Example:
 *   "activities": {
 *     "occ_1740508445159": {
 *       "act_1740508445748": {
 *         code: 1,
 *         timestamp: "2024-02-19T08:00:00.000Z",
 *         who: "System"
 *       },
 *       "act_1740508446229": {
 *         code: 21,
 *         timestamp: "2024-02-19T08:00:00.000Z",
 *         who: "System"
 *       }
 *     }
 *   }
 */
export type Activities = Record<string, ActivityData> | null;

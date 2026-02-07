/* src/types/hoos/data/activitiesByCodeData.ts */

/**
 * Represents an activity record under a specific activity code for an occupant.
 *
 * Example:
 *   timestamp: "2024-02-19T08:00:00.000Z",     // When the activity occurred (ISO 8601 format)
 *   who: "System"                            // Entity responsible for the activity
 */
export interface ActivityByCodeData {
  timestamp?: string;
  who: string;
}

/**
 * A map of activity_by_code_id -> ActivityByCodeData.
 *
 * Example:
 *   "act_1740508445748": {
 *     timestamp: "2024-02-19T08:00:00.000Z",
 *     who: "System"
 *   }
 */
export interface OccupantActivitiesByCode {
  [activityByCodeId: string]: ActivityByCodeData;
}

/**
 * A map of occupantId -> OccupantActivitiesByCode.
 *
 * Example:
 *   "occ_1740508445159": {
 *     "act_1740508445748": {
 *       timestamp: "2024-02-19T08:00:00.000Z",
 *       who: "System"
 *     }
 *   }
 */
export interface ActivitiesByCodeForOccupant {
  [occupantId: string]: OccupantActivitiesByCode;
}

/**
 * The complete "activitiesByCode" node mapping activity_code to ActivitiesByCodeForOccupant.
 *
 * Structure:
 *   "activitiesByCode": {
 *     "<activity_code>": {
 *       "<occupant_id>": {
 *         "<activity_by_code_id>": {
 *           timestamp: "<ISO 8601 string>",
 *           who: "<string>"
 *         }
 *       }
 *     }
 *   }
 *
 * Example:
 *   "activitiesByCode": {
 *     "1": {
 *       "occ_1740508445159": {
 *         "act_1740508445748": {
 *           timestamp: "2024-02-19T08:00:00.000Z",
 *           who: "System"
 *         }
 *       }
 *     }
 *   }
 */
export type ActivitiesByCode = Record<
  string,
  ActivitiesByCodeForOccupant
> | null;

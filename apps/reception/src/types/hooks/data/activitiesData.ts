/* src/types/hooks/data/activitiesData.ts */

import type { z } from "zod";

import type { activitySchema } from "../../../schemas/activitySchema";

/**
 * A single activity record stored under an occupant.
 *
 * Example:
 *   {
 *     code: 1,
 *     timestamp: "2024-02-19T08:00:00.000Z",
 *     who: "System"
 *   }
 */
export type Activity = z.infer<typeof activitySchema>;

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

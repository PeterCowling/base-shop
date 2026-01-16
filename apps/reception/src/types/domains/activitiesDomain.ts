// File: /src/types/domains/activitiesDomain.ts

import type { Activity } from "../hooks/data/activitiesData";

/**
 * Structure returned by add/save activity attempts.
 */
export interface ActivityResult {
  success: boolean;
  data?: Activity;
  message?: string;
  error?: string;
}

/**
 * Input structure when saving an activity. Accepts partial fields.
 */
export interface ActivityDataInput {
  code: number;
  description?: string;
  who?: string;
  timestamp?: string;
  // add any additional fields you want to permit
}

/**
 * If needed, an extended shape for the full activities node.
 * (This can be used elsewhere if more than the data hook’s minimal shape is required.)
 */
export type ActivitiesData = Record<string, Record<string, Activity>>;

export type ActivityRecord = Record<string, unknown>;

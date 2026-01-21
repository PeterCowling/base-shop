// File: src/hooks/data/activities/useActivitiesData.ts
import { useMemo } from "react";

import useFirebaseSubscription from "../useFirebaseSubscription";

/**
 * Shape for an individual activity entry.
 */
export interface IActivity {
  code: number; // Should align with MyLocalStatus values like '1', '8', etc.
  timestamp: string; // ISO 8601 string
  who: string;
}

/**
 * Shape for the /activities node in Firebase.
 * {
 * "<occupant_id>": {
 * "<activity_id>": IActivity
 * }
 * }
 */
export interface IActivitiesData {
  [occupantId: string]: {
    [activityId: string]: IActivity;
  };
}

/**
 * Pure Data Hook: Retrieves raw /activities data from Firebase.
 */
export default function useActivitiesData() {
  const { data, loading, error } =
    useFirebaseSubscription<IActivitiesData>("activities");

  const activitiesData = useMemo(() => data ?? {}, [data]);

  return { activitiesData, loading, error };
}

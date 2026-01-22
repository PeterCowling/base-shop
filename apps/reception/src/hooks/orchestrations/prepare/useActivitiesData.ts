/* File: src/hooks/orchestrations/prepare/useActivitiesData.ts */

import React from "react";

import { activitySchema } from "../../../schemas/activitySchema";
import type {
  Activities,
  Activity,
  ActivityData,
} from "../../../types/hooks/data/activitiesData";
import useFirebaseSubscription from "../../data/useFirebaseSubscription";

/**
 * Hook for reading the full /activities node, which stores occupant activities.
 * Returns the current activities, a loading flag, and any error encountered.
 */
export function useActivitiesData() {
  const {
    data,
    loading,
    error: subError,
  } = useFirebaseSubscription<Record<string, unknown>>("activities");

  const [activities, setActivities] = React.useState<Activities>({});
  const [error, setError] = React.useState<unknown>(subError);

  React.useEffect(() => {
    if (subError) {
      setError(subError);
      return;
    }
    if (!data) {
      setActivities({});
      return;
    }
    const parsed: Activities = {};
    Object.entries(data).forEach(([occId, acts]) => {
      const actMap: ActivityData = {};
      Object.entries((acts as Record<string, unknown>) || {}).forEach(
        ([id, a]) => {
          const res = activitySchema.safeParse(a);
          if (res.success) {
            actMap[id] = res.data as Activity;
          } else {
            setError(res.error);
          }
        }
      );
      parsed[occId] = actMap;
    });
    setActivities(parsed);
  }, [data, subError]);

  return { activities, loading, error };
}

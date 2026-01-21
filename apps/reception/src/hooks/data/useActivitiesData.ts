// File: /src/hooks/data/useActivitiesData.ts

import {
  DataSnapshot,
  endAt,
  limitToFirst,
  onValue,
  orderByKey,
  query,
  ref,
  startAt,
} from "firebase/database";
import { useEffect, useMemo, useState } from "react";

import { activitySchema } from "../../schemas/activitySchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import {
  Activities,
  ActivityData,
} from "../../types/hooks/data/activitiesData";

export interface UseActivitiesDataParams {
  startAt?: string;
  endAt?: string;
  limitToFirst?: number;
}
/**
 * Hook for reading the full /activities node, which stores occupant activities.
 * Returns the current activities, a loading flag, and any error encountered.
 */
export default function useActivitiesData(
  params: UseActivitiesDataParams = {}
) {
  const database = useFirebaseDatabase();
  const { startAt: startKey, endAt: endKey, limitToFirst: limit } = params;

  const [activities, setActivities] = useState<Activities>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const baseRef = ref(database, "activities");
    let q = query(baseRef, orderByKey());
    if (startKey) q = query(q, startAt(startKey));
    if (endKey) q = query(q, endAt(endKey));
    if (limit !== undefined) q = query(q, limitToFirst(limit));

    const handleSnapshot = (snap: DataSnapshot) => {
      try {
        if (!snap.exists()) {
          setActivities({});
          setLoading(false);
          return;
        }
        const raw = snap.val() as Record<string, Record<string, unknown>>;
        const parsed: Activities = {};
        Object.entries(raw).forEach(([occId, acts]) => {
          const parsedActs: ActivityData = {};
          Object.entries(acts || {}).forEach(([actId, act]) => {
            const res = activitySchema.safeParse(act);
            if (res.success) {
              parsedActs[actId] = res.data;
            } else {
              setError(res.error);
            }
          });
          parsed[occId] = parsedActs;
        });
        setActivities(parsed);
      } finally {
        setLoading(false);
      }
    };

    const handleError = (err: unknown) => {
      setError(err);
      setLoading(false);
    };

    const unsubscribe = onValue(q, handleSnapshot, handleError);
    return () => unsubscribe();
  }, [database, startKey, endKey, limit]);

  const memoActivities = useMemo(() => activities, [activities]);

  return { activities: memoActivities, loading, error };
}

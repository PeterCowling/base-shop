// File: src/hooks/data/useActivitiesByCodeData.ts

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";

import { activitiesByCodeForOccupantSchema } from "../../schemas/activitiesByCodeSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { type ActivitiesByCodeForOccupant } from "../../types/hooks/data/activitiesByCodeData";

// Define the parameter type for the hook.
export type UseActivitiesByCodeDataParams = {
  codes?: number[];
  skip?: boolean; // Optional flag to disable fetching if needed.
};

export default function useActivitiesByCodeData({
  codes = [],
  skip = false,
}: UseActivitiesByCodeDataParams = {}): {
  activitiesByCodes: Record<string, ActivitiesByCodeForOccupant>;
  loading: boolean;
  error: unknown;
} {
  const database = useFirebaseDatabase();
  const [activitiesByCodes, setActivitiesByCodes] = useState<
    Record<string, ActivitiesByCodeForOccupant>
  >({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  // Create a stable key for the provided codes array so that the
  // subscription only resubscribes when the actual set of codes changes,
  // not simply when the array reference changes on re-render.
  const codesKey = JSON.stringify([...codes].sort());

  useEffect(() => {
    if (skip) {
      setActivitiesByCodes({});
      setLoading(false);
      return;
    }
    if (!database) return;

    const codesList: number[] = JSON.parse(codesKey);

    // If no codes are provided, skip subscription.
    if (codesList.length === 0) {
      setActivitiesByCodes({});
      setLoading(false);
      return;
    }

    setLoading(true);

    // Single subtree listener on the activitiesByCode root.
    // The snapshot delivers all code keys at once; we filter to only the
    // requested codes client-side, then validate each sub-node individually.
    const rootRef = ref(database, "activitiesByCode");

    const unsubscribe = onValue(
      rootRef,
      (snapshot) => {
        const rawRoot = snapshot.exists() ? snapshot.val() : {};

        setActivitiesByCodes((prev) => {
          let next = prev;

          for (const code of codesList) {
            const codeStr = String(code);
            const rawNode = rawRoot?.[codeStr];

            if (!rawNode) {
              // No data for this code — represent as an empty occupant map.
              if (prev[codeStr] === undefined || Object.keys(prev[codeStr] ?? {}).length !== 0) {
                next = { ...next, [codeStr]: {} };
              }
              continue;
            }

            const result = activitiesByCodeForOccupantSchema.safeParse(rawNode);
            if (!result.success) {
              setError(result.error);
              continue;
            }

            const transformed = result.data as ActivitiesByCodeForOccupant;

            // Per-code shallow equality check — reference equality cannot be used here
            // because safeParse always constructs a new object for identical input.
            const prev_code = next[codeStr];
            const prevKeys = prev_code ? Object.keys(prev_code) : null;
            const nextKeys = Object.keys(transformed);
            const isEqual =
              prevKeys !== null &&
              prevKeys.length === nextKeys.length &&
              nextKeys.every((k) => (prev_code as Record<string, unknown>)[k] === (transformed as Record<string, unknown>)[k]);
            if (!isEqual) {
              next = { ...next, [codeStr]: transformed };
            }
          }

          return next;
        });

        // The subtree delivers all codes in a single snapshot; loading is
        // complete after the first delivery regardless of which codes are present.
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
        console.error("[useActivitiesByCodeData] Error fetching activitiesByCode:", err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [codesKey, database, skip]);

  return { activitiesByCodes, loading, error };
}

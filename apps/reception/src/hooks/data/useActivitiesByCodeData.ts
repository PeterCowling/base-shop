// File: src/hooks/data/useActivitiesByCodeData.ts

import { useCallback, useEffect, useState } from "react";
import { type DataSnapshot, onValue, ref } from "firebase/database";

import { activitiesByCodeForOccupantSchema } from "../../schemas/activitiesByCodeSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import { type ActivitiesByCodeForOccupant } from "../../types/hooks/data/activitiesByCodeData";

function isEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

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
  // subscriptions only resubscribe when the actual set of codes changes,
  // not simply when the array reference changes on re-render.
  const codesKey = JSON.stringify([...codes].sort());

  const handleCodeDataChange = useCallback(
    (codeStr: string, snapshot: DataSnapshot): void => {
      const rawData = snapshot.exists() ? snapshot.val() : null;
      if (!rawData) {
        // When there's no data for this code, update the key with an empty object.
        setActivitiesByCodes((prev) => {
          if (!prev[codeStr] || Object.keys(prev[codeStr]).length !== 0) {
            return { ...prev, [codeStr]: {} };
          }
          return prev;
        });
        return;
      }

      const result = activitiesByCodeForOccupantSchema.safeParse(rawData);
      if (!result.success) {
        setError(result.error);
        return;
      }

      const transformed = result.data as ActivitiesByCodeForOccupant;

      setActivitiesByCodes((prev) => {
        const current = prev[codeStr] ?? {};
        if (isEqual(current, transformed)) {
          return prev; // No change detected.
        }
        return { ...prev, [codeStr]: transformed };
      });
    },
    []
  );

  const handleError = useCallback((err: unknown): void => {
    setError(err);
    setLoading(false);
    console.error("[useActivitiesByCodeData] Error fetching code data:", err);
  }, []);

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
    const unsubscribes: Array<() => void> = [];

    // Subscribe to each code's node. The codes are already sorted via
    // `codesKey` to ensure consistent subscription order regardless of the
    // original array ordering.
    codesList.forEach((code) => {
      const codeStr = String(code);
      const codeRef = ref(database, `activitiesByCode/${codeStr}`);

      const onDataChange = (snapshot: DataSnapshot) =>
        handleCodeDataChange(codeStr, snapshot);

      const unsubscribe = onValue(codeRef, onDataChange, handleError);
      unsubscribes.push(unsubscribe);
    });

    return () => {
      // Cleanup all listeners on unmount.
      unsubscribes.forEach((fn) => fn());
    };
  }, [codesKey, database, handleCodeDataChange, handleError, skip]);

  useEffect(() => {
    // Once each code has an entry (even if empty {}) we consider it loaded.
    const codesList: number[] = JSON.parse(codesKey);

    if (
      codesList.length > 0 &&
      codesList.every((code) => activitiesByCodes[String(code)] !== undefined)
    ) {
      setLoading(false);
    }
  }, [activitiesByCodes, codesKey]);

  return { activitiesByCodes, loading, error };
}

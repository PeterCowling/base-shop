/* File: /src/hooks/data/bar/useBleepersData.ts */
import { useCallback, useEffect, useMemo, useState } from "react";
import { type DatabaseReference, get, ref, set } from "firebase/database";

import { useFirebaseDatabase } from "../../../services/useFirebase";
import { type BleepersState } from "../../../types/bar/BleeperTypes";
import useFirebaseSubscription from "../useFirebaseSubscription";

/**
 * useBleepersData:
 * - Loads bleeper availability from Firebase DB
 * - Exposes helper methods to find next available bleeper
 */
export function useBleepersData() {
  const database = useFirebaseDatabase();
  const { data, loading, error } =
    useFirebaseSubscription<BleepersState>("bleepers");
  const bleeperData = useMemo(() => data ?? {}, [data]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) {
      return;
    }

    const bleeperRef: DatabaseReference = ref(database, "bleepers");
    let isActive = true;

    (async () => {
      try {
        const snapshot = await get(bleeperRef);
        const shouldInitialize =
          typeof snapshot?.exists === "function" ? !snapshot.exists() : true;

        if (shouldInitialize) {
          const initialData: BleepersState = {};
          for (let i = 1; i <= 18; i++) initialData[i] = true;

          await set(bleeperRef, initialData);
        }

        if (isActive) {
          setInitialized(true);
        }
      } catch (err) {
        console.error("[useBleepersData] Initialization error:", err);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [database, initialized]);

  /**
   * firstAvailableBleeper:
   * - Returns the lowest-numbered bleeper that is available (true).
   */
  const firstAvailableBleeper = useMemo<number | null>(() => {
    for (let i = 1; i <= 18; i++) {
      if (bleeperData[i] === true) {
        return i;
      }
    }
    return null;
  }, [bleeperData]);

  /**
   * findNextAvailableBleeper:
   * - Finds the next available bleeper at or after startIndex.
   */
  const findNextAvailableBleeper = useCallback(
    (startIndex = 1): number | null => {
      for (let i = startIndex; i <= 18; i++) {
        if (bleeperData[i] === true) {
          return i;
        }
      }
      return null;
    },
    [bleeperData]
  );

  return {
    bleepers: bleeperData,
    loading,
    error,
    firstAvailableBleeper,
    findNextAvailableBleeper,
  };
}

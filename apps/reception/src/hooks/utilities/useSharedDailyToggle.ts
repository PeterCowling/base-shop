// src/hooks/utilities/useSharedDailyToggle.ts
//
// A custom React hook that stores a boolean toggle in Firebase Realtime
// Database.  The toggle is shared across all clients via a database path
// derived from the provided `key`.  The hook automatically resets the
// toggle at local midnight each day, ensuring a fresh value for every
// calendar day.  React state is used to keep the local UI in sync with
// Firebase.  Listeners are cleaned up on unmount to prevent memory leaks.

import { useCallback, useEffect, useState } from "react";
import { getDatabase, off, onValue, ref, set } from "firebase/database";

import { getLocalToday, isToday } from "../../utils/dateUtils";

import { scheduleDailyReset } from "./scheduleDailyReset";

// Shape of the data stored in Firebase: a date string and a boolean value.
interface StoredData {
  date: string;
  value: boolean;
}

/**
 * A React hook that manages a shared boolean toggle in Firebase Realtime
 * Database.  The returned state reflects the persisted value for the
 * current day, and updates are persisted by calling the provided setter.
 * The toggle automatically resets to `false` at local midnight for all
 * clients using the same `key`.
 *
 * @param key A unique identifier for the shared toggle.  All clients using
 * the same key will observe the same value.
 * @returns A tuple with the current boolean value and an async setter.
 */
export default function useSharedDailyToggle(
  key: string
): [boolean, (v: boolean) => Promise<void>] {
  // Retrieve the database instance.  Firebase will return the existing
  // instance if already initialised.
  const db = getDatabase();
  const [value, setValueState] = useState<boolean>(false);

  // Subscribe to value changes at the `sharedToggles/{key}` path.  When the
  // stored date matches today, update the local state; otherwise, reset the
  // value in Firebase and locally.  The subscription is cleaned up when
  // either the component unmounts or the `key` changes.
  useEffect(() => {
    const toggleRef = ref(db, `sharedToggles/${key}`);
    const unsubscribe = onValue(toggleRef, (snap) => {
      const data = snap.val() as StoredData | null;
      if (data && isToday(data.date)) {
        setValueState(data.value);
      } else {
        const today = getLocalToday();
        set(toggleRef, { date: today, value: false });
        setValueState(false);
      }
    });
    return () => off(toggleRef, "value", unsubscribe);
  }, [db, key]);

  // Persist a new value to Firebase.  The setter includes today's date
  // alongside the boolean so other clients know whether to reset or use
  // the stored value on initialization.
  const setValue = useCallback(
    async (v: boolean): Promise<void> => {
      const toggleRef = ref(db, `sharedToggles/${key}`);
      await set(toggleRef, { date: getLocalToday(), value: v });
    },
    [db, key]
  );

  // Schedule a reset at the next local midnight using the shared helper.
  // The timeout is cleared when the component unmounts or the key changes.
  useEffect(() => {
    const timer = scheduleDailyReset(async () => {
      const toggleRef = ref(db, `sharedToggles/${key}`);
      await set(toggleRef, { date: getLocalToday(), value: false });
    });
    return () => clearTimeout(timer);
  }, [db, key]);

  return [value, setValue];
}

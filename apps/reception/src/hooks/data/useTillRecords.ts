/* src/hooks/data/useTillRecords.ts
 *
 * A custom React hook for listening to and mutating till record data stored
 * in the Firebase Realtime Database. This hook encapsulates the logic for
 * subscribing to the `tillRecords` node, exposing a convenient API for
 * consuming components to access the records, loading state, potential
 * errors, and a mutation helper for saving individual till records.
 */

import type { DataSnapshot } from "firebase/database";
import { off, onValue, ref, update } from "firebase/database";
import { useCallback, useEffect, useMemo, useState } from "react";
import { tillRecordMapSchema } from "../../schemas/tillRecordSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import type {
  TillRecordData,
  TillRecords,
} from "../../types/hooks/data/tillRecordData";

/**
 * UseTillRecordsResult
 *
 * Defines the return shape for the `useTillRecords` hook. See implementation
 * below for details on each property.
 */
export interface UseTillRecordsResult {
  /**
   * The collection of till records keyed by record ID. Will be `null` while
   * loading or if no records are present in the database.
   */
  tillRecords: TillRecords;
  /**
   * Indicates whether the hook is currently awaiting the first snapshot.
   */
  loading: boolean;
  /**
   * Contains any error encountered either when fetching the initial data or
   * when updating a record. Undefined when no error has occurred.
   */
  error: unknown;
  /**
   * Persists a partial till record to the database under the given record ID.
   * The returned promise resolves on success and rejects on failure. Any
   * caught error will also update the `error` state within the hook.
   */
  saveTillRecord: (
    recordId: string,
    recordData: Partial<TillRecordData>
  ) => Promise<void>;
}

/**
 * useTillRecords
 *
 * Subscribes to the `tillRecords` node in the Firebase Realtime Database and
 * exposes the collection of records along with helper state. A memoized
 * `saveTillRecord` function is provided to allow updating individual records
 * without redefining the function on every render.
 */
export default function useTillRecords(): UseTillRecordsResult {
  const database = useFirebaseDatabase();

  // Internal state for the till records, loading flag, and error.
  const [tillRecords, setTillRecords] = useState<TillRecords>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    // Create a reference to the `tillRecords` collection in the database.
    const recordsRef = ref(database, "tillRecords");

    // Snapshot callback: fires whenever the data at `recordsRef` changes.
    const handleValue = (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.val() as Record<string, unknown>;
        const result = tillRecordMapSchema.safeParse(raw);
        if (result.success) {
          setTillRecords(result.data);
        } else {
          setError(result.error);
          // Preserve existing till records on validation failure.
        }
      } else {
        setTillRecords(null);
      }
      setLoading(false);
    };

    // Error callback: triggered if the listener encounters an error. Note
    // that in most Firebase scenarios this will not fire unless there are
    // permissions issues.
    const handleError = (err: unknown) => {
      setError(err);
      setLoading(false);
    };

    // Attach a listener. The return value of onValue is an unsubscribe
    // function; depending on the Firebase SDK version this may be returned
    // directly or via a wrapper. We store it in a variable so we can call
    // it on cleanup if it exists.
    const unsubscribe = onValue(recordsRef, handleValue, handleError);

    // Cleanup: remove the listener when the component unmounts or when the
    // database reference changes. Some versions of the Firebase SDK return a
    // cleanup function from onValue; otherwise we fall back to calling off().
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      } else {
        off(recordsRef);
      }
    };
  }, [database]);

  /**
   * saveTillRecord
   *
   * Updates the record with the given ID using a partial payload. When
   * Firebase successfully writes the data the promise resolves; if an error
   * occurs the error state is updated and the promise rejects.
   */
  const saveTillRecord = useCallback(
    async (
      recordId: string,
      recordData: Partial<TillRecordData>
    ): Promise<void> => {
      // Build a reference to the specific record based on ID.
      const recordRef = ref(database, `tillRecords/${recordId}`);
      try {
        await update(recordRef, recordData);
      } catch (err) {
        setError(err);
        // Re-throw so callers can handle the error if they wish.
        throw err;
      }
    },
    [database]
  );

  // Memoize the returned object to avoid unnecessary re-renders in components
  // that consume this hook. Each property is included in the dependency
  // array to ensure changes propagate correctly.
  return useMemo(
    () => ({ tillRecords, loading, error, saveTillRecord }),
    [tillRecords, loading, error, saveTillRecord]
  );
}

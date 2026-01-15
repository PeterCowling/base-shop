/* File: src/hooks/data/useFirebaseSubscription.ts */

import { DataSnapshot, off, onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import type { ZodSchema } from "zod";

import { useFirebaseDatabase } from "../../services/useFirebase";
import { showToast } from "../../utils/toastUtils";
import { getErrorMessage } from "../../utils/errorMessage";

/**
 * Hook to subscribe to a Firebase Realtime Database path. Returns the
 * current value at the given path, whether it is still loading, and any
 * error thrown by the subscription. The hook will automatically tear
 * down the subscription on unmount or when the `path` changes.
 *
 * When a `schema` is supplied, incoming snapshots are validated. If
 * validation fails, the previous successfully parsed value is retained
 * and an error toast is shown, meaning the returned data may be stale
 * until a valid snapshot is received.
 *
 * @param path The database path to subscribe to.
 * @param schema Optional Zod schema used to validate incoming values.
 */
export default function useFirebaseSubscription<T>(
  path: string,
  schema?: ZodSchema<T>
) {
  const database = useFirebaseDatabase();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    // Construct a database reference based on the supplied path. In
    // production code the `database` would be a Firebase DB instance;
    // during tests it can be mocked to return any value.
    const dbRef = ref(database, path);

    const handleValue = (snap: DataSnapshot) => {
      if (!snap.exists()) {
        setData(null);
        setError(null);
        setLoading(false);
        return;
      }

      if (schema) {
        const parsed = schema.safeParse(snap.val());
        if (!parsed.success) {
          setError(parsed.error);
          showToast(getErrorMessage(parsed.error), "error");
          setLoading(false);
          return; // keep previous data
        }
        setData(parsed.data);
      } else {
        setData(snap.val() as T);
      }

      setError(null);
      setLoading(false);
    };

    const handleError = (err: unknown) => {
      setError(err);
      setLoading(false);
    };

    onValue(dbRef, handleValue, handleError);

    return () => {
      off(dbRef, "value", handleValue);
    };
  }, [database, path, schema]);

  return { data, loading, error };
}

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type DataSnapshot, off, onValue, ref } from "firebase/database";

import { useFirebaseDatabase } from "../services/useFirebase";

interface CacheEntry<T = unknown> {
  data: T | null;
  loading: boolean;
  error: unknown;
}

interface FirebaseCacheContextValue {
  subscribe: (path: string, prefill?: () => Promise<unknown>) => void;
  unsubscribe: (path: string) => void;
  getEntry: <T = unknown>(path: string) => CacheEntry<T>;
}

const FirebaseCacheContext = createContext<
  FirebaseCacheContextValue | undefined
>(undefined);

export const FirebaseSubscriptionCacheProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const database = useFirebaseDatabase();
  const databaseRef = useRef(database);
  const [cache, setCache] = useState<Record<string, CacheEntry>>({});
  const subscribers = useRef<Record<string, number>>({});
  const unsubscribes = useRef<Record<string, () => void>>({});

  useEffect(() => {
    databaseRef.current = database;
  }, [database]);

  const startListening = useCallback(
    (path: string, prefill?: () => Promise<unknown>) => {
      // Cancelled token: shared between prefill and the unsubscribe closure.
      // Set to true when the subscription is torn down OR Firebase data arrives
      // (whichever comes first) to prevent a late prefill from overwriting live data.
      let cancelled = false;

      // Run optional prefill before Firebase listener fires
      if (prefill) {
        void (async () => {
          try {
            const prefillData = await prefill();
            if (
              !cancelled &&
              prefillData !== null &&
              prefillData !== undefined
            ) {
              setCache((prev) => ({
                ...prev,
                [path]: {
                  data: prefillData,
                  loading: false,
                  error: null,
                },
              }));
            }
          } catch {
            // Prefill errors are silently swallowed; Firebase will resolve the
            // loading state independently via onValue.
          }
        })();
      }

      const dbRef = ref(databaseRef.current, path);

      const handleDataChange = (snapshot: DataSnapshot) => {
        // Firebase data always wins; mark cancelled so any in-flight prefill
        // cannot overwrite this result.
        cancelled = true;
        setCache((prev) => ({
          ...prev,
          [path]: {
            data: snapshot.exists() ? snapshot.val() : null,
            loading: false,
            error: null,
          },
        }));
      };

      const handleError = (err: unknown) => {
        cancelled = true;
        setCache((prev) => ({
          ...prev,
          [path]: {
            ...(prev[path] || { data: null }),
            loading: false,
            error: err,
          },
        }));
      };

      onValue(dbRef, handleDataChange, handleError);
      unsubscribes.current[path] = () => {
        cancelled = true;
        off(dbRef, "value", handleDataChange);
      };
    },
    []
  );

  const subscribe = useCallback(
    (path: string, prefill?: () => Promise<unknown>) => {
      subscribers.current[path] = (subscribers.current[path] || 0) + 1;
      setCache((prev) => ({
        ...prev,
        [path]: prev[path] || { data: null, loading: true, error: null },
      }));
      if (subscribers.current[path] === 1) {
        startListening(path, prefill);
      }
    },
    [startListening]
  );

  const unsubscribe = useCallback((path: string) => {
    if (!subscribers.current[path]) return;
    subscribers.current[path] -= 1;
    if (subscribers.current[path] <= 0) {
      subscribers.current[path] = 0;
      const unsub = unsubscribes.current[path];
      if (unsub) unsub();
      delete unsubscribes.current[path];
      setCache((prev) => {
        const newCache = { ...prev };
        delete newCache[path];
        return newCache;
      });
    }
  }, []);

  const getEntry = useCallback(
    <T,>(path: string): CacheEntry<T> => {
      return (
        (cache[path] as CacheEntry<T>) || {
          data: null,
          loading: true,
          error: null,
        }
      );
    },
    [cache]
  );

  const value = useMemo(
    () => ({ subscribe, unsubscribe, getEntry }),
    [subscribe, unsubscribe, getEntry]
  );

  useEffect(() => {
    return () => {
      Object.values(unsubscribes.current).forEach((unsub) => unsub());
      unsubscribes.current = {};
      subscribers.current = {};
    };
  }, []);

  return (
    <FirebaseCacheContext.Provider value={value}>
      {children}
    </FirebaseCacheContext.Provider>
  );
};

export const useFirebaseSubscriptionCache = (): FirebaseCacheContextValue => {
  const context = useContext(FirebaseCacheContext);
  if (!context) {
    throw new Error(
      "useFirebaseSubscriptionCache must be used within FirebaseSubscriptionCacheProvider"
    );
  }
  return context;
};

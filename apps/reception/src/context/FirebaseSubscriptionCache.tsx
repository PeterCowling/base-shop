import { DataSnapshot, off, onValue, ref } from "firebase/database";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useFirebaseDatabase } from "../services/useFirebase";

interface CacheEntry<T = unknown> {
  data: T | null;
  loading: boolean;
  error: unknown;
}

interface FirebaseCacheContextValue {
  subscribe: (path: string) => void;
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

  const startListening = useCallback((path: string) => {
    const dbRef = ref(databaseRef.current, path);
    const handleDataChange = (snapshot: DataSnapshot) => {
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
    unsubscribes.current[path] = () => off(dbRef, "value", handleDataChange);
  }, []);

  const subscribe = useCallback(
    (path: string) => {
      subscribers.current[path] = (subscribers.current[path] || 0) + 1;
      setCache((prev) => ({
        ...prev,
        [path]: prev[path] || { data: null, loading: true, error: null },
      }));
      if (subscribers.current[path] === 1) {
        startListening(path);
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

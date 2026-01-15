/* File: /src/services/useFirebase.ts */
'use client';

import logger from '@/utils/logger';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FirebaseConfig } from '../types/firebase';
import {
  type Database,
  type DataSnapshot,
  db,
  firebaseApp,
  type FirebaseApp,
  type FirebaseStorage,
  get,
  off,
  onValue,
  type Query,
  storage,
} from './firebase';

/**
 * Client Hook:
 * Returns the Firebase configuration based on environment variables.
 */
export function useFirebaseConfig(): FirebaseConfig {
  const config = useMemo<FirebaseConfig>(() => {
    const envConfig: FirebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
      messagingSenderId:
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? '',
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
    };
    return envConfig;
  }, []);

  return config;
}

/**
 * Client Hook:
 * Initializes and returns the Firebase App instance.
 * Ensures that the Firebase app is only initialized once.
 */
export function useFirebaseApp(): FirebaseApp {
  return useMemo(() => firebaseApp, []);
}

/**
 * Client Hook:
 * Returns the Firebase Realtime Database instance for the initialized app.
 */
export function useFirebaseDatabase(): Database {
  return useMemo(() => db, []);
}

/** Returns Firebase Cloud Storage instance */
export function useFirebaseStorage(): FirebaseStorage {
  return useMemo(() => storage, []);
}

/**
 * Pure Data Hook:
 * Subscribes to a Firebase Realtime Database query and returns the transformed data,
 * along with loading and error flags. Also provides a `refetch` function for a one-time
 * forced get, in case the component wants to manually refresh data.
 *
 * @param query - Firebase Database reference or query to subscribe to.
 * @param transform - Optional transformation function to process the snapshot data.
 */
export function useFirebaseSubscription<T>(
  query: Query,
  transform?: (snapshot: DataSnapshot) => T,
): {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // ---------------
  // 1) Real-time subscription effect
  // ---------------
  useEffect(() => {
    const unsubscribe = onValue(
      query,
      (snapshot: DataSnapshot) => {
        if (!snapshot.exists()) {
          setData(null);
        } else {
          const value = transform ? transform(snapshot) : (snapshot.val() as T);
          setData(value);
        }
        setIsLoading(false);
      },
      (error) => {
        logger.error('Firebase subscription error:', error);
        setIsError(true);
        setIsLoading(false);
      },
    );

    // Cleanup
    return () => {
      off(query);
      unsubscribe();
    };
  }, [query, transform]);

  // ---------------
  // 2) Refetch method for a forced one-time "get(query)".
  //    We reapply `transform` so that the data shape remains consistent.
  // ---------------
  const refetch = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const snapshot = await get(query);
      if (!snapshot.exists()) {
        setData(null);
      } else {
        const value = transform ? transform(snapshot) : (snapshot.val() as T);
        setData(value);
      }
      setIsError(false);
    } catch (err) {
      logger.error('Firebase refetch error:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [query, transform]);

  return { data, isLoading, isError, refetch };
}

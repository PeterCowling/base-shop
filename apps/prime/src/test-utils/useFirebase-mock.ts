// /apps/prime/src/test-utils/useFirebase-mock.ts
// Jest mock for useFirebase hooks to avoid Firebase initialization in tests

import { jest } from '@jest/globals';
import { useCallback, useMemo, useState } from 'react';
import {
  mockDb,
  mockFirebaseApp,
  mockStorage,
  mockGet,
  mockOnValue,
  mockOff,
  createMockSnapshot,
} from './firebase-mock';
import type { FirebaseConfig } from '../types/firebase';

// Mock DataSnapshot type
type MockDataSnapshot = {
  val: () => unknown;
  exists: () => boolean;
  key: string | null;
  ref: unknown;
};

// Re-export types that the real module exports
export type { MockDataSnapshot as DataSnapshot };

/**
 * Mock useFirebaseConfig hook
 */
export function useFirebaseConfig(): FirebaseConfig {
  return useMemo<FirebaseConfig>(() => ({
    apiKey: 'mock-api-key',
    authDomain: 'mock.firebaseapp.com',
    projectId: 'mock-project',
    storageBucket: 'mock.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abc123',
    databaseURL: 'https://mock-project.firebaseio.com',
    measurementId: 'G-MOCK123',
  }), []);
}

/**
 * Mock useFirebaseApp hook
 */
export function useFirebaseApp() {
  return useMemo(() => mockFirebaseApp, []);
}

/**
 * Mock useFirebaseDatabase hook
 */
export function useFirebaseDatabase() {
  return useMemo(() => mockDb, []);
}

/**
 * Mock useFirebaseStorage hook
 */
export function useFirebaseStorage() {
  return useMemo(() => mockStorage, []);
}

/**
 * Mock useFirebaseSubscription hook
 * Returns mock data that can be controlled via the mock functions
 */
export function useFirebaseSubscription<T>(
  query: unknown,
  transform?: (snapshot: MockDataSnapshot) => T,
): {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const snapshot = (await mockGet(query)) as MockDataSnapshot;
      if (!snapshot.exists()) {
        setData(null);
      } else {
        const value = transform ? transform(snapshot) : (snapshot.val() as T);
        setData(value);
      }
      setIsError(false);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [query, transform]);

  return { data, isLoading, isError, refetch };
}

// Re-export Firebase mock utilities for tests that need direct access
export { mockDb as db, mockFirebaseApp as firebaseApp, mockStorage as storage };
export { mockGet as get, mockOnValue as onValue, mockOff as off };

// src/services/firebase.ts
 

import {
  type FirebaseApp,
  getApp,
  getApps,
  initializeApp,
  setLogLevel,
} from 'firebase/app';
import {
  type Database,
  type DataSnapshot,
  endAt,
  endBefore,
  equalTo,
  get as fbGet,
  getDatabase,
  limitToFirst,
  limitToLast,
  type ListenOptions,
  off,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  onValue as fbOnValue,
  orderByChild,
  push,
  type Query,
  query,
  ref,
  set,
  startAt,
  type Unsubscribe,
  update,
} from 'firebase/database';
import {
  deleteObject,
  type FirebaseStorage,
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';

import logger from '@/utils/logger';

/* -------------------------------------------------------------------------- */
/*                              Firebase config                               */
/* -------------------------------------------------------------------------- */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
};

/* -------------------------------------------------------------------------- */
/*                           SDK singletons (v9+)                             */
/* -------------------------------------------------------------------------- */

const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

// Reduce Firebase console noise in production
setLogLevel('error');

export const firebaseApp = app;
export const db = getDatabase(app);
export const storage = getStorage(app);

/* -------------------------------------------------------------------------- */
/*                            Firebase Metrics (OPT-07)                       */
/* -------------------------------------------------------------------------- */

interface QueryRecord {
  path: string;
  sizeBytes: number;
  durationMs: number;
  timestamp: number;
}

const SLOW_QUERY_THRESHOLD_MS = 1000;

class FirebaseMetrics {
  private _queryCount = 0;
  private _totalBytes = 0;
  private _activeListeners = 0;
  private _slowQueries: QueryRecord[] = [];
  private _recentQueries: QueryRecord[] = [];

  recordQuery(path: string, sizeBytes: number, durationMs: number): void {
    this._queryCount++;
    this._totalBytes += sizeBytes;

    const record: QueryRecord = { path, sizeBytes, durationMs, timestamp: Date.now() };
    this._recentQueries.push(record);
    // Keep only the last 50 queries
    if (this._recentQueries.length > 50) this._recentQueries.shift();

    if (durationMs > SLOW_QUERY_THRESHOLD_MS) {
      this._slowQueries.push(record);
      logger.warn(`[firebase] Slow query (${durationMs}ms): ${path} (${(sizeBytes / 1024).toFixed(1)}KB)`);
    }
  }

  listenerAdded(): void { this._activeListeners++; }
  listenerRemoved(): void { this._activeListeners = Math.max(0, this._activeListeners - 1); }

  getMetrics() {
    return {
      queryCount: this._queryCount,
      totalBytes: this._totalBytes,
      totalKB: +(this._totalBytes / 1024).toFixed(2),
      activeListeners: this._activeListeners,
      slowQueries: [...this._slowQueries],
      recentQueries: [...this._recentQueries],
    };
  }

  reset(): void {
    this._queryCount = 0;
    this._totalBytes = 0;
    this._slowQueries = [];
    this._recentQueries = [];
  }
}

export const firebaseMetrics = new FirebaseMetrics();

// Expose on window in development for console access
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as unknown as Record<string, unknown>).__firebaseMetrics = firebaseMetrics;
}

/* -------------------------------------------------------------------------- */
/*                               Helper methods                               */
/* -------------------------------------------------------------------------- */

/**
 * Logged wrapper around `get()` that records payload size, timing, and metrics.
 */
export async function get(queryRef: Query): Promise<DataSnapshot> {
  const path = queryRef.toString();
  logger.debug(`[firebase] get ${path}`);

  const start = performance.now();
  const snapshot = await fbGet(queryRef);
  const durationMs = Math.round(performance.now() - start);
  const size = JSON.stringify(snapshot.val()).length;

  firebaseMetrics.recordQuery(path, size, durationMs);
  logger.debug(`[firebase] get complete ${path} bytes=${size} duration=${durationMs}ms`);
  return snapshot;
}

/**
 * Strongly-typed wrapper around `onValue()` that chooses the correct
 * overload at compile-time, preventing the "no overload matches" errors.
 * Tracks active listener count in metrics.
 */
export function onValue(
  queryRef: Query,
  callback: (snapshot: DataSnapshot) => unknown,
  errorCallback?: (error: Error) => unknown,
  options?: ListenOptions,
): Unsubscribe {
  const path = queryRef.toString();
  logger.debug(`[firebase] onValue subscribe ${path}`);
  firebaseMetrics.listenerAdded();

  const wrapped = (snapshot: DataSnapshot): void => {
    const size = JSON.stringify(snapshot.val()).length;
    logger.debug(`[firebase] onValue snapshot ${path} bytes=${size}`);
    callback(snapshot);
  };

  const unsubscribe: Unsubscribe = errorCallback
    ? options
      ? fbOnValue(queryRef, wrapped, errorCallback, options) // 4-arg overload
      : fbOnValue(queryRef, wrapped, errorCallback) // 3-arg overload
    : options
      ? fbOnValue(queryRef, wrapped, options) // 3-arg overload (options)
      : fbOnValue(queryRef, wrapped); // 2-arg overload

  return () => {
    logger.debug(`[firebase] onValue unsubscribe ${path}`);
    firebaseMetrics.listenerRemoved();
    unsubscribe();
  };
}

/* -------------------------------------------------------------------------- */
/*                               Re-exports                                   */
/* -------------------------------------------------------------------------- */

export {
  deleteObject,
  endAt,
  endBefore,
  equalTo,
  fbGet,
  onValue as fbOnValue,
  getDownloadURL,
  limitToFirst,
  limitToLast,
  off,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  orderByChild,
  push,
  query,
  ref,
  set,
  startAt,
  storageRef,
  update,
  uploadBytes,
};
export type { Database, DataSnapshot, FirebaseApp, FirebaseStorage, Query };

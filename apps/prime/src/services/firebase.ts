// src/services/firebase.ts
/* eslint-disable import/order */

import logger from '@/utils/logger';
import {
  getApp,
  getApps,
  initializeApp,
  setLogLevel,
  type FirebaseApp,
} from 'firebase/app';
import {
  endAt,
  endBefore,
  equalTo,
  get as fbGet,
  onValue as fbOnValue,
  getDatabase,
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
  update,
  type Database,
  type DataSnapshot,
  type ListenOptions,
  type Query,
  type Unsubscribe,
} from 'firebase/database';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes,
  type FirebaseStorage,
} from 'firebase/storage';

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
/*                               Helper methods                               */
/* -------------------------------------------------------------------------- */

/**
 * Logged wrapper around `get()` that also records payload size.
 */
export async function get(queryRef: Query): Promise<DataSnapshot> {
  logger.debug(`[firebase] get ${queryRef.toString()}`);

  const snapshot = await fbGet(queryRef);
  const size = JSON.stringify(snapshot.val()).length;

  logger.debug(`[firebase] get complete ${queryRef.toString()} bytes=${size}`);
  return snapshot;
}

/**
 * Strongly-typed wrapper around `onValue()` that chooses the correct
 * overload at compile-time, preventing the "no overload matches" errors.
 */
export function onValue(
  queryRef: Query,
  callback: (snapshot: DataSnapshot) => unknown,
  errorCallback?: (error: Error) => unknown,
  options?: ListenOptions,
): Unsubscribe {
  logger.debug(`[firebase] onValue subscribe ${queryRef.toString()}`);

  const wrapped = (snapshot: DataSnapshot): void => {
    const size = JSON.stringify(snapshot.val()).length;
    logger.debug(
      `[firebase] onValue snapshot ${queryRef.toString()} bytes=${size}`,
    );
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
    logger.debug(`[firebase] onValue unsubscribe ${queryRef.toString()}`);
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

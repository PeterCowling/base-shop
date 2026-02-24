/* File: /src/services/firebase.ts */

import { useMemo } from "react";
import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Database, getDatabase } from "firebase/database";
import { type Firestore, getFirestore } from "firebase/firestore";

import { firebaseEnvSchema } from "../schemas/firebaseEnvSchema";
import type { FirebaseConfig } from "../types/FirebaseConfig";

function getFirebasePublicEnv() {
  // In Next.js client bundles, parse(process.env) is unreliable because only
  // explicit NEXT_PUBLIC_* property accesses are inlined.
  return {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

/**
 * Client Hook (Pure Data Hook):
 * Returns the Firebase configuration based on environment variables.
 */
export function getFirebaseConfigFromEnv(): FirebaseConfig {
  const env = firebaseEnvSchema.parse(getFirebasePublicEnv());
  return {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    databaseURL: env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

export function useFirebaseConfig(): FirebaseConfig {
  const config = useMemo<FirebaseConfig>(() => getFirebaseConfigFromEnv(), []);
  return config;
}

/**
 * Client Hook (Client Hook):
 * Initializes and returns the Firebase App instance.
 * Ensures that the Firebase app is only initialized once.
 */
export function useFirebaseApp(): FirebaseApp {
  const config = useFirebaseConfig();

  const app = useMemo<FirebaseApp>(() => {
    if (!getApps().length) {
      return initializeApp(config);
    }
    return getApp();
  }, [config]);

  return app;
}

/**
 * Client Hook (Client Hook):
 * Returns the Firebase Realtime Database instance for the initialized app.
 */
export function useFirebaseDatabase(): Database {
  const app = useFirebaseApp();

  const database = useMemo<Database>(() => {
    return getDatabase(app);
  }, [app]);

  return database;
}

/**
 * Client Hook (Client Hook):
 * Returns the Firestore instance for the initialized app.
 */
export function useFirebaseFirestore(): Firestore {
  const app = useFirebaseApp();

  const firestore = useMemo<Firestore>(() => {
    return getFirestore(app);
  }, [app]);

  return firestore;
}

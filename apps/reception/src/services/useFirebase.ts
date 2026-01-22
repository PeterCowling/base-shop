/* File: /src/services/firebase.ts */

import { useMemo } from "react";
import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Database, getDatabase } from "firebase/database";
import { type Firestore, getFirestore } from "firebase/firestore";

import { firebaseEnvSchema } from "../schemas/firebaseEnvSchema";
import type { FirebaseConfig } from "../types/FirebaseConfig";

/**
 * Client Hook (Pure Data Hook):
 * Returns the Firebase configuration based on environment variables.
 */
export function useFirebaseConfig(): FirebaseConfig {
  const config = useMemo<FirebaseConfig>(() => {
    const env = firebaseEnvSchema.parse(process.env);
    const envConfig: FirebaseConfig = {
      apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
      databaseURL: env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    return envConfig;
  }, []);

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

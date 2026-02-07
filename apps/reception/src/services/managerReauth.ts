import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getDatabase } from "firebase/database";

import { canAccess, Permissions } from "../lib/roles";
import type { User } from "../types/domains/userDomain";

import { loadUserWithProfile } from "./firebaseAuth";
import { getFirebaseConfigFromEnv } from "./useFirebase";

export interface ManagerAuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

const MANAGER_REAUTH_APP_NAME = "manager-reauth";

function getManagerReauthApp() {
  const existing = getApps().find((app) => app.name === MANAGER_REAUTH_APP_NAME);
  if (existing) return existing;
  return initializeApp(getFirebaseConfigFromEnv(), MANAGER_REAUTH_APP_NAME);
}

function mapAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Authentication failed";
  if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password")) {
    return "Invalid email or password.";
  }
  if (message.includes("auth/user-not-found")) {
    return "No account found with this email.";
  }
  if (message.includes("auth/too-many-requests")) {
    return "Too many failed attempts. Please try again later.";
  }
  if (message.includes("auth/network-request-failed")) {
    return "Network error. Check your connection.";
  }
  return message;
}

export async function verifyManagerCredentials(
  email: string,
  password: string
): Promise<ManagerAuthResult> {
  if (!email.trim() || !password.trim()) {
    return { success: false, error: "Email and password are required." };
  }

  const app = getManagerReauthApp();
  const auth = getAuth(app);
  const database = getDatabase(app);

  try {
    await setPersistence(auth, inMemoryPersistence);
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
    const user = await loadUserWithProfile(database, credential.user);
    if (!user) {
      await signOut(auth);
      return { success: false, error: "User profile not found." };
    }
    if (!canAccess(user, Permissions.MANAGEMENT_ACCESS)) {
      await signOut(auth);
      return { success: false, error: "Manager access required." };
    }
    await signOut(auth);
    return { success: true, user };
  } catch (error) {
    await signOut(auth).catch(() => undefined);
    return { success: false, error: mapAuthError(error) };
  }
}

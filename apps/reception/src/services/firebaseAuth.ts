/**
 * Firebase Auth service for Reception app.
 * Handles authentication and user profile loading.
 */

import type { FirebaseApp } from "firebase/app";
import {
  type Auth,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import type { Database } from "firebase/database";
import { get,ref } from "firebase/database";

import { getMeta, setMeta } from "../lib/offline/receptionDb";
import type { User, UserProfile, UserRole } from "../types/domains/userDomain";
import { normalizeRoles, userProfileSchema } from "../types/domains/userDomain";

let authInstance: Auth | null = null;
const userProfileSnapshotSchema = userProfileSchema.partial({
  uid: true,
  email: true,
  user_name: true,
});
const FIREBASE_KEY_UNSAFE_CHARS = /[.#$/\[\]]/g;

function toSafeUserName(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.replace(FIREBASE_KEY_UNSAFE_CHARS, "_");
}

function resolveUserName(
  profile: { user_name?: string; displayName?: string; email?: string },
  firebaseUser: FirebaseUser
): string {
  const emailLocalPart = (firebaseUser.email ?? profile.email ?? "").split("@")[0];
  return (
    toSafeUserName(profile.user_name) ??
    toSafeUserName(profile.displayName) ??
    toSafeUserName(firebaseUser.displayName) ??
    toSafeUserName(emailLocalPart) ??
    firebaseUser.uid
  );
}

export function getFirebaseAuth(app: FirebaseApp): Auth {
  if (!authInstance) {
    authInstance = getAuth(app);
  }
  return authInstance;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

export async function loginWithEmailPassword(
  auth: Auth,
  database: Database,
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;

    const user = await loadUserWithProfile(database, firebaseUser);
    if (!user) {
      await signOut(auth);
      return { success: false, error: "User profile not found. Contact an administrator." };
    }

    return { success: true, user };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";

    // Provide user-friendly error messages
    if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password")) {
      return { success: false, error: "Invalid email or password." };
    }
    if (message.includes("auth/user-not-found")) {
      return { success: false, error: "No account found with this email." };
    }
    if (message.includes("auth/too-many-requests")) {
      return { success: false, error: "Too many failed attempts. Please try again later." };
    }
    if (message.includes("auth/network-request-failed")) {
      return { success: false, error: "Network error. Check your connection." };
    }

    return { success: false, error: message };
  }
}

export async function logout(auth: Auth): Promise<void> {
  await signOut(auth);
}

export interface PasswordResetResult {
  success: boolean;
  error?: string;
}

export async function sendPasswordResetEmail(
  auth: Auth,
  email: string
): Promise<PasswordResetResult> {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send reset email";

    if (message.includes("auth/user-not-found")) {
      // Don't reveal if user exists for security
      return { success: true };
    }
    if (message.includes("auth/invalid-email")) {
      return { success: false, error: "Please enter a valid email address." };
    }
    if (message.includes("auth/too-many-requests")) {
      return { success: false, error: "Too many requests. Please try again later." };
    }

    return { success: false, error: "Failed to send reset email. Please try again." };
  }
}

export async function loadUserWithProfile(
  database: Database,
  firebaseUser: FirebaseUser
): Promise<User | null> {
  try {
    // Load user profile from /userProfiles/{uid}
    const profileRef = ref(database, `userProfiles/${firebaseUser.uid}`);
    const snapshot = await get(profileRef);

    if (!snapshot.exists()) {
      console.warn(`No profile found for user ${firebaseUser.uid}`);
      return null;
    }

    const profileData = snapshot.val();
    const parseResult = userProfileSnapshotSchema.safeParse(profileData);

    if (!parseResult.success) {
      console.error("Invalid user profile data:", parseResult.error);
      return null;
    }

    const parsedProfile = parseResult.data;
    const resolvedEmail = firebaseUser.email ?? parsedProfile.email;
    if (!resolvedEmail) {
      console.error(`Unable to resolve email for user ${firebaseUser.uid}`);
      return null;
    }

    const resolvedUserName = resolveUserName(parsedProfile, firebaseUser);
    const resolvedDisplayName = parsedProfile.displayName ?? firebaseUser.displayName ?? undefined;

    const profile: UserProfile = {
      uid: parsedProfile.uid ?? firebaseUser.uid,
      email: resolvedEmail,
      user_name: resolvedUserName,
      displayName: resolvedDisplayName,
      roles: normalizeRoles(parsedProfile.roles),
    };

    const resolvedUser: User = {
      uid: firebaseUser.uid,
      email: resolvedEmail,
      user_name: profile.user_name,
      displayName: profile.displayName,
      roles: profile.roles,
    };

    await setMeta<User | null>("cachedUserProfile", resolvedUser);

    return resolvedUser;
  } catch (error) {
    console.error("Failed to load user profile:", error);
    const cached = await getMeta<User>("cachedUserProfile");
    return cached;
  }
}

export type AuthStateListener = (user: User | null) => void;

export function subscribeToAuthState(
  auth: Auth,
  database: Database,
  listener: AuthStateListener
): () => void {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const user = await loadUserWithProfile(database, firebaseUser);
      listener(user);
    } else {
      await setMeta<User | null>("cachedUserProfile", null);
      listener(null);
    }
  });

  return unsubscribe;
}

// Helper to check if a user has a specific role
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user || !user.roles) return false;
  return user.roles.includes(role);
}

// Helper to check if a user has any of the specified roles
export function hasAnyRole(user: User | null, roles: UserRole[]): boolean {
  if (!user || !user.roles) return false;
  return roles.some((role) => user.roles!.includes(role));
}

// Check if user is an owner or developer (privileged)
export function isPrivileged(user: User | null): boolean {
  return hasAnyRole(user, ["owner", "developer"]);
}

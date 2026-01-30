/**
 * Authentication helpers
 * MVP-B1: Invite-only auth system
 *
 * Provides password hashing/verification and session management
 * using bcryptjs and iron-session.
 */

import bcrypt from "bcryptjs";
import { getIronSession, type IronSession, type IronSessionData } from "iron-session";

import { type User,USERS } from "./current-user";

/**
 * Session data structure (extends IronSessionData)
 */
export interface SessionData extends IronSessionData {
  userId?: string;
  locale?: "en" | "it"; // MVP-G1: User locale preference
}

/**
 * Iron session configuration
 */
const sessionOptions = {
  // i18n-exempt -- BOS-04 Phase 0 session config [ttl=2026-03-31]
  password: process.env.SESSION_SECRET || "development-secret-min-32-chars-long!!",
  cookieName: "business_os_session",
  cookieOptions: {
    // Secure in production, but allow HTTP in development
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  },
};

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Bcrypt hash
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a bcrypt hash
 * @param password - Plain text password to verify
 * @param hash - Bcrypt hash to compare against
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
}

/**
 * Get user from session data
 * @param session - Session data object
 * @returns User if session contains valid userId, null otherwise
 */
export function getSessionUser(session: SessionData): User | null {
  if (!session.userId) {
    return null;
  }

  const user = USERS[session.userId];
  return user || null;
}

/**
 * Get session from Request/Response objects
 * Use this in API routes and middleware
 */
export async function getSession(
  request: Request,
  response: Response
): Promise<IronSession & SessionData> {
  return getIronSession(request, response, sessionOptions);
}

/**
 * Get the current authenticated user from session
 * Returns null if not authenticated
 *
 * Use this in API routes where you have Request/Response objects.
 */
export async function getAuthenticatedUser(
  request: Request,
  response: Response
): Promise<User | null> {
  const session = await getSession(request, response);
  return getSessionUser(session);
}

/**
 * Get the current authenticated user from Next.js headers
 * Returns null if not authenticated
 *
 * Use this in server components and server actions where you only have access to headers().
 */
export async function getAuthenticatedUserFromHeaders(): Promise<User | null> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(sessionOptions.cookieName);

    if (!sessionCookie?.value) {
      return null;
    }

    // Decode iron session manually
    const iron = await import("iron-session");
    const sessionData = await iron.unsealData<SessionData>(sessionCookie.value, {
      password: sessionOptions.password,
    });

    return getSessionUser(sessionData);
  } catch {
    // Session cookie doesn't exist or can't be decoded
    return null;
  }
}

/**
 * User data from JSON file
 */
export interface UserData {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  passcodeHash: string;
}

/**
 * Load users from JSON file
 * Returns user data with hashed passcodes
 */
export async function loadUsers(): Promise<UserData[]> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const { getRepoRoot } = await import("./get-repo-root");

  const repoRoot = getRepoRoot();
  const usersPath = path.join(repoRoot, "docs/business-os/people/users.json");

  try {
    const content = await fs.readFile(usersPath, "utf-8");
    const data = JSON.parse(content);
    return data.users || [];
  } catch {
    // File doesn't exist or can't be read - return empty array
    return [];
  }
}

/**
 * Validate user credentials
 * @param username - Username to validate
 * @param passcode - Plain text passcode
 * @returns User if credentials are valid, null otherwise
 */
export async function validateCredentials(
  username: string,
  passcode: string
): Promise<User | null> {
  const users = await loadUsers();
  const userData = users.find((u) => u.id === username);

  if (!userData) {
    return null;
  }

  const isValid = await verifyPassword(passcode, userData.passcodeHash);
  if (!isValid) {
    return null;
  }

  // Return User object (matches current-user.ts interface)
  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    role: userData.role,
  };
}

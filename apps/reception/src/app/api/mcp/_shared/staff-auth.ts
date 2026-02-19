import { NextResponse } from "next/server";

import {
  normalizeRoles,
  type RawUserProfile,
  type UserRole,
} from "../../../../types/domains/userDomain";

type Success = {
  ok: true;
  uid: string;
  roles: UserRole[];
  email?: string;
};

type Failure = {
  ok: false;
  response: Response;
};

type StaffAuthResult = Success | Failure;

const STAFF_ROLES: ReadonlySet<UserRole> = new Set([
  "owner",
  "developer",
  "admin",
  "manager",
  "staff",
]);

function unauthorized(error: string): Failure {
  return {
    ok: false,
    response: NextResponse.json({ success: false, error }, { status: 401 }),
  };
}

function forbidden(error: string): Failure {
  return {
    ok: false,
    response: NextResponse.json({ success: false, error }, { status: 403 }),
  };
}

function serverError(error: string): Failure {
  return {
    ok: false,
    response: NextResponse.json({ success: false, error }, { status: 500 }),
  };
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return null;
  const token = match[1]?.trim();
  return token?.length ? token : null;
}

function readRequiredEnv(): { apiKey: string; dbUrl: string } | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim();
  if (!apiKey || !dbUrl) return null;
  return { apiKey, dbUrl: dbUrl.replace(/\/+$/, "") };
}

type AccountsLookupResponse = {
  users?: Array<{
    localId?: string;
    email?: string;
  }>;
};

async function lookupFirebaseUser(idToken: string, apiKey: string): Promise<{ uid: string; email?: string } | null> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as AccountsLookupResponse;
  const user = payload.users?.[0];
  if (!user?.localId) {
    return null;
  }

  return { uid: user.localId, email: user.email };
}

type UserProfilePayload = {
  roles?: RawUserProfile["roles"];
};

async function lookupUserRoles(idToken: string, uid: string, dbUrl: string): Promise<UserRole[] | null> {
  const profileUrl = `${dbUrl}/userProfiles/${encodeURIComponent(uid)}.json?auth=${encodeURIComponent(idToken)}`;
  const response = await fetch(profileUrl);

  if (!response.ok) {
    return null;
  }

  const profile = (await response.json()) as UserProfilePayload | null;
  if (!profile) {
    return null;
  }

  return normalizeRoles(profile.roles) ?? [];
}

export async function requireStaffAuth(request: Request): Promise<StaffAuthResult> {
  const token = extractBearerToken(request);
  if (!token) {
    return unauthorized("Missing bearer token");
  }

  const env = readRequiredEnv();
  if (!env) {
    return serverError("Server auth configuration missing");
  }

  let firebaseUser: { uid: string; email?: string } | null = null;
  try {
    firebaseUser = await lookupFirebaseUser(token, env.apiKey);
  } catch {
    return unauthorized("Unable to verify auth token");
  }

  if (!firebaseUser) {
    return unauthorized("Invalid auth token");
  }

  let roles: UserRole[] | null = null;
  try {
    roles = await lookupUserRoles(token, firebaseUser.uid, env.dbUrl);
  } catch {
    return forbidden("Unable to resolve user profile");
  }

  if (!roles) {
    return forbidden("User profile not found");
  }

  const isStaff = roles.some((role) => STAFF_ROLES.has(role));
  if (!isStaff) {
    return forbidden("Insufficient role");
  }

  return {
    ok: true,
    uid: firebaseUser.uid,
    roles,
    email: firebaseUser.email,
  };
}

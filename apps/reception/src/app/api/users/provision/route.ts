import { NextResponse } from "next/server";

import { Permissions } from "../../../../lib/roles";
import { requireStaffAuth } from "../../mcp/_shared/staff-auth";

const ALLOWED_ROLES = ["staff", "manager", "admin"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

type ProvisionRequestBody = {
  email: string;
  user_name: string;
  displayName?: string;
  role: AllowedRole;
};

type SignUpPayload = {
  localId?: string;
  error?: {
    message?: string;
  };
};

function readRequiredEnv(): { apiKey: string; dbUrl: string } | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim();
  if (!apiKey || !dbUrl) return null;
  return { apiKey, dbUrl: dbUrl.replace(/\/+$/, "") };
}

async function createFirebaseAuthAccount(
  email: string,
  apiKey: string,
): Promise<{ localId: string } | { error: string; status: number }> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: crypto.randomUUID(),
      returnSecureToken: false,
    }),
  });

  const payload = (await response.json()) as SignUpPayload;

  if (!response.ok) {
    if (payload.error?.message === "EMAIL_EXISTS") {
      return { error: "An account with this email already exists", status: 409 };
    }
    return { error: "Failed to create auth account", status: 502 };
  }

  if (!payload.localId) {
    return { error: "Unexpected response from auth provider", status: 502 };
  }

  return { localId: payload.localId };
}

export async function POST(request: Request): Promise<Response> {
  // 1. Parse request body
  let body: ProvisionRequestBody;
  try {
    body = (await request.json()) as ProvisionRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { email, user_name, role } = body;
  const displayName = body.displayName ?? user_name;

  // 2. Validate required fields
  if (!email?.trim()) {
    return NextResponse.json(
      { success: false, error: "email is required" },
      { status: 400 },
    );
  }
  if (!user_name?.trim()) {
    return NextResponse.json(
      { success: false, error: "user_name is required" },
      { status: 400 },
    );
  }
  if (!role) {
    return NextResponse.json(
      { success: false, error: "role is required" },
      { status: 400 },
    );
  }
  if (!(ALLOWED_ROLES as readonly string[]).includes(role)) {
    return NextResponse.json(
      {
        success: false,
        error: `role must be one of: ${ALLOWED_ROLES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // 3. Authenticate caller (any staff role)
  const authResult = await requireStaffAuth(request);
  if ("response" in authResult) {
    return authResult.response;
  }

  // 4. Authorize: USER_MANAGEMENT gate (owner/developer only)
  const mgmtRoles = new Set<string>(Permissions.USER_MANAGEMENT);
  if (!authResult.roles.some((r) => mgmtRoles.has(r))) {
    return NextResponse.json(
      { success: false, error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  // 5. Read environment
  const env = readRequiredEnv();
  if (!env) {
    return NextResponse.json(
      { success: false, error: "Server configuration missing" },
      { status: 500 },
    );
  }

  // 6. Extract bearer token for DB REST writes (already verified by requireStaffAuth)
  const bearerToken =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ??
    "";

  // 7. Create Firebase Auth account (server-side — does not displace caller's session)
  const signUpResult = await createFirebaseAuthAccount(email.trim(), env.apiKey);
  if ("error" in signUpResult) {
    return NextResponse.json(
      { success: false, error: signUpResult.error },
      { status: signUpResult.status },
    );
  }

  const { localId } = signUpResult;

  // 8. Write userProfiles/{uid} — roles in map form required by DB security rules
  const profileUrl = `${env.dbUrl}/userProfiles/${encodeURIComponent(localId)}.json?auth=${encodeURIComponent(bearerToken)}`;
  const profileResponse = await fetch(profileUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim(),
      user_name: user_name.trim(),
      displayName,
      roles: { [role]: true },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  });

  if (!profileResponse.ok) {
    return NextResponse.json(
      {
        success: false,
        error: "Auth account created but profile write failed",
        uid: localId,
      },
      { status: 502 },
    );
  }

  // 9. Write audit record (non-fatal — failure does not block user creation)
  const auditId = crypto.randomUUID();
  const auditUrl = `${env.dbUrl}/audit/settingChanges/${encodeURIComponent(auditId)}.json?auth=${encodeURIComponent(bearerToken)}`;
  await fetch(auditUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "user_provisioned",
      targetEmail: email.trim(),
      targetRole: role,
      createdBy: authResult.uid,
      timestamp: Date.now(),
    }),
  }).catch(() => {
    // Non-fatal: audit failure does not block user creation
  });

  return NextResponse.json({
    success: true,
    uid: localId,
    email: email.trim(),
  });
}

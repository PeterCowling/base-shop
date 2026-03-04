import { NextResponse } from "next/server";

import { Permissions } from "../../../../lib/roles";
import { isStaffAccountsPeteIdentity } from "../../../../lib/staffAccountsAccess";
import {
  normalizeRoles,
  type RawUserProfile,
  type UserRole,
  UserRoleSchema,
} from "../../../../types/domains/userDomain";
import { requireStaffAuth } from "../../mcp/_shared/staff-auth";

const ALLOWED_PROVISION_ROLES = ["staff", "manager", "admin"] as const;
type AllowedProvisionRole = (typeof ALLOWED_PROVISION_ROLES)[number];

type ProvisionRequestBody = {
  email: string;
  user_name: string;
  displayName?: string;
  role?: AllowedProvisionRole;
  roles?: UserRole[];
};

type SignUpPayload = {
  localId?: string;
  error?: {
    message?: string;
  };
};

type UserProfileRecord = {
  email: string;
  user_name: string;
  displayName?: string;
  roles?: RawUserProfile["roles"];
  createdAt?: number;
  updatedAt?: number;
};

type UserProfileCollection = Record<string, UserProfileRecord | null>;

function readRequiredEnv(): { apiKey: string; dbUrl: string } | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim();
  if (!apiKey || !dbUrl) return null;
  return { apiKey, dbUrl: dbUrl.replace(/\/+$/, "") };
}

function extractBearerToken(request: Request): string {
  return (
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? ""
  );
}

function toRoleMap(roles: UserRole[]): Record<string, true> {
  return Object.fromEntries(roles.map((role) => [role, true]));
}

function normalizeRequestedRoles(input: ProvisionRequestBody): UserRole[] | null {
  if (Array.isArray(input.roles)) {
    const parsed = UserRoleSchema.array().safeParse(input.roles);
    if (!parsed.success) return null;
    return Array.from(new Set(parsed.data));
  }

  if (input.role) {
    if (!(ALLOWED_PROVISION_ROLES as readonly string[]).includes(input.role)) {
      return null;
    }
    return [input.role];
  }

  return null;
}

function validateProvisionInput(body: ProvisionRequestBody): string | null {
  if (!body.email?.trim()) return "email is required";
  if (!body.user_name?.trim()) return "user_name is required";

  const roles = normalizeRequestedRoles(body);
  if (!roles || roles.length === 0) {
    return `role is required (allowed: ${ALLOWED_PROVISION_ROLES.join(", ")})`;
  }

  // Provisioning remains limited to operational roles for now.
  const invalidProvisionRole = roles.find(
    (role) => !(ALLOWED_PROVISION_ROLES as readonly string[]).includes(role),
  );
  if (invalidProvisionRole) {
    return `role must be one of: ${ALLOWED_PROVISION_ROLES.join(", ")}`;
  }

  return null;
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

async function writeAudit(
  dbUrl: string,
  bearerToken: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const auditId = crypto.randomUUID();
  const auditUrl = `${dbUrl}/audit/settingChanges/${encodeURIComponent(auditId)}.json?auth=${encodeURIComponent(bearerToken)}`;
  await fetch(auditUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Non-fatal: audit writes do not block user operations.
  });
}

async function authorize(request: Request): Promise<
  | {
      ok: true;
      uid: string;
      email?: string;
      bearerToken: string;
      dbUrl: string;
      apiKey: string;
    }
  | { ok: false; response: Response }
> {
  const authResult = await requireStaffAuth(request);
  if ("response" in authResult) {
    return { ok: false, response: authResult.response };
  }

  const managementRoles = new Set<string>(Permissions.USER_MANAGEMENT);
  if (!authResult.roles.some((role) => managementRoles.has(role))) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      ),
    };
  }

  if (!isStaffAccountsPeteIdentity({ uid: authResult.uid, email: authResult.email })) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Staff Accounts is restricted to Pete" },
        { status: 403 },
      ),
    };
  }

  const env = readRequiredEnv();
  if (!env) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Server configuration missing" },
        { status: 500 },
      ),
    };
  }

  const bearerToken = extractBearerToken(request);
  if (!bearerToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Missing bearer token" },
        { status: 401 },
      ),
    };
  }

  return {
    ok: true,
    uid: authResult.uid,
    email: authResult.email,
    bearerToken,
    dbUrl: env.dbUrl,
    apiKey: env.apiKey,
  };
}

export async function GET(request: Request): Promise<Response> {
  const authz = await authorize(request);
  if ("response" in authz) {
    return authz.response;
  }

  const url = `${authz.dbUrl}/userProfiles.json?auth=${encodeURIComponent(authz.bearerToken)}`;
  const response = await fetch(url);

  if (!response.ok) {
    return NextResponse.json(
      { success: false, error: "Failed to load staff accounts" },
      { status: 502 },
    );
  }

  const payload = (await response.json()) as UserProfileCollection | null;
  const accounts = Object.entries(payload ?? {})
    .filter(([, profile]) => Boolean(profile?.email && profile?.user_name))
    .map(([uid, profile]) => {
      const safeProfile = profile as UserProfileRecord;
      return {
        uid,
        email: safeProfile.email,
        user_name: safeProfile.user_name,
        displayName: safeProfile.displayName ?? safeProfile.user_name,
        roles: normalizeRoles(safeProfile.roles) ?? [],
        createdAt: safeProfile.createdAt ?? null,
        updatedAt: safeProfile.updatedAt ?? null,
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email));

  return NextResponse.json({ success: true, accounts });
}

export async function POST(request: Request): Promise<Response> {
  let body: ProvisionRequestBody;
  try {
    body = (await request.json()) as ProvisionRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const validationError = validateProvisionInput(body);
  if (validationError) {
    return NextResponse.json(
      { success: false, error: validationError },
      { status: 400 },
    );
  }

  const authz = await authorize(request);
  if ("response" in authz) {
    return authz.response;
  }

  const roles = normalizeRequestedRoles(body) ?? [];
  const email = body.email.trim();
  const userName = body.user_name.trim();
  const displayName = body.displayName?.trim() || userName;

  const signUpResult = await createFirebaseAuthAccount(email, authz.apiKey);
  if ("error" in signUpResult) {
    return NextResponse.json(
      { success: false, error: signUpResult.error },
      { status: signUpResult.status },
    );
  }

  const profileUrl = `${authz.dbUrl}/userProfiles/${encodeURIComponent(signUpResult.localId)}.json?auth=${encodeURIComponent(authz.bearerToken)}`;
  const profileResponse = await fetch(profileUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      user_name: userName,
      displayName,
      roles: toRoleMap(roles),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  });

  if (!profileResponse.ok) {
    return NextResponse.json(
      {
        success: false,
        error: "Auth account created but profile write failed",
        uid: signUpResult.localId,
      },
      { status: 502 },
    );
  }

  await writeAudit(authz.dbUrl, authz.bearerToken, {
    action: "user_provisioned",
    targetEmail: email,
    targetRoles: roles,
    createdBy: authz.uid,
    timestamp: Date.now(),
  });

  return NextResponse.json({
    success: true,
    uid: signUpResult.localId,
    email,
    roles,
  });
}

type UpdateRequestBody = {
  uid: string;
  roles: UserRole[];
  user_name?: string;
  displayName?: string;
};

export async function PATCH(request: Request): Promise<Response> {
  let body: UpdateRequestBody;
  try {
    body = (await request.json()) as UpdateRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!body.uid?.trim()) {
    return NextResponse.json(
      { success: false, error: "uid is required" },
      { status: 400 },
    );
  }

  const parsedRoles = UserRoleSchema.array().safeParse(body.roles);
  if (!parsedRoles.success || parsedRoles.data.length === 0) {
    return NextResponse.json(
      { success: false, error: "roles must be a non-empty role array" },
      { status: 400 },
    );
  }

  const authz = await authorize(request);
  if ("response" in authz) {
    return authz.response;
  }

  const uid = body.uid.trim();
  const profileUrl = `${authz.dbUrl}/userProfiles/${encodeURIComponent(uid)}.json?auth=${encodeURIComponent(authz.bearerToken)}`;

  const currentResponse = await fetch(profileUrl);
  if (!currentResponse.ok) {
    return NextResponse.json(
      { success: false, error: "Unable to load account" },
      { status: 502 },
    );
  }

  const currentProfile = (await currentResponse.json()) as UserProfileRecord | null;
  if (!currentProfile) {
    return NextResponse.json(
      { success: false, error: "Account not found" },
      { status: 404 },
    );
  }

  const updateResponse = await fetch(profileUrl, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_name: body.user_name?.trim() || currentProfile.user_name,
      displayName:
        body.displayName?.trim() || currentProfile.displayName || currentProfile.user_name,
      roles: toRoleMap(Array.from(new Set(parsedRoles.data))),
      updatedAt: Date.now(),
    }),
  });

  if (!updateResponse.ok) {
    return NextResponse.json(
      { success: false, error: "Failed to update account" },
      { status: 502 },
    );
  }

  await writeAudit(authz.dbUrl, authz.bearerToken, {
    action: "user_permissions_updated",
    targetUid: uid,
    targetEmail: currentProfile.email,
    targetRoles: Array.from(new Set(parsedRoles.data)),
    createdBy: authz.uid,
    timestamp: Date.now(),
  });

  return NextResponse.json({ success: true, uid, roles: Array.from(new Set(parsedRoles.data)) });
}

type DeleteRequestBody = {
  uid: string;
};

export async function DELETE(request: Request): Promise<Response> {
  let body: DeleteRequestBody;
  try {
    body = (await request.json()) as DeleteRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const uid = body.uid?.trim();
  if (!uid) {
    return NextResponse.json(
      { success: false, error: "uid is required" },
      { status: 400 },
    );
  }

  const authz = await authorize(request);
  if ("response" in authz) {
    return authz.response;
  }

  if (uid === authz.uid) {
    return NextResponse.json(
      { success: false, error: "Cannot remove the active Pete account" },
      { status: 400 },
    );
  }

  const profileUrl = `${authz.dbUrl}/userProfiles/${encodeURIComponent(uid)}.json?auth=${encodeURIComponent(authz.bearerToken)}`;

  const currentResponse = await fetch(profileUrl);
  if (!currentResponse.ok) {
    return NextResponse.json(
      { success: false, error: "Unable to load account" },
      { status: 502 },
    );
  }

  const currentProfile = (await currentResponse.json()) as UserProfileRecord | null;
  if (!currentProfile) {
    return NextResponse.json(
      { success: false, error: "Account not found" },
      { status: 404 },
    );
  }

  const deleteResponse = await fetch(profileUrl, { method: "DELETE" });
  if (!deleteResponse.ok) {
    return NextResponse.json(
      { success: false, error: "Failed to remove account" },
      { status: 502 },
    );
  }

  await writeAudit(authz.dbUrl, authz.bearerToken, {
    action: "user_profile_removed",
    targetUid: uid,
    targetEmail: currentProfile.email,
    createdBy: authz.uid,
    timestamp: Date.now(),
  });

  return NextResponse.json({ success: true, uid });
}

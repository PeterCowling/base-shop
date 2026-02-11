import { errorResponse } from './firebase-rest';
import { enforceStaffOwnerApiGate, type StaffOwnerGateEnv } from './staff-owner-gate';

const STAFF_ROLE_PRIORITY = ['owner', 'admin', 'staff'] as const;

type PrimeStaffRole = (typeof STAFF_ROLE_PRIORITY)[number];

interface FirebaseLookupUser {
  localId?: string;
  customAttributes?: string;
}

interface FirebaseLookupResponse {
  users?: FirebaseLookupUser[];
}

export interface StaffAuthTokenGateEnv extends StaffOwnerGateEnv {
  CF_FIREBASE_API_KEY?: string;
}

export interface VerifiedStaffIdentity {
  uid: string;
  role: PrimeStaffRole;
  claims: Record<string, unknown>;
}

export type VerifyStaffTokenClaims = (
  idToken: string,
  env: StaffAuthTokenGateEnv,
) => Promise<Record<string, unknown> | null>;

export interface StaffAuthTokenGateDependencies {
  verifyStaffTokenClaims?: VerifyStaffTokenClaims;
}

export type StaffAuthTokenGateResult =
  | { ok: true; identity: VerifiedStaffIdentity }
  | { ok: false; response: Response };

function extractBearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization') ?? '';
  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function parseStaffRole(claims: Record<string, unknown>): PrimeStaffRole | null {
  const role = typeof claims.role === 'string' ? claims.role.toLowerCase() : null;
  if (role && STAFF_ROLE_PRIORITY.includes(role as PrimeStaffRole)) {
    return role as PrimeStaffRole;
  }

  if (Array.isArray(claims.roles)) {
    const normalizedRoles = claims.roles
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.toLowerCase());

    for (const prioritizedRole of STAFF_ROLE_PRIORITY) {
      if (normalizedRoles.includes(prioritizedRole)) {
        return prioritizedRole;
      }
    }
  }

  if (claims.staff === true || claims.isStaff === true) {
    return 'staff';
  }

  return null;
}

function parseUid(claims: Record<string, unknown>): string | null {
  const claimUid = typeof claims.uid === 'string' ? claims.uid.trim() : '';
  if (claimUid) {
    return claimUid;
  }

  const subjectUid = typeof claims.sub === 'string' ? claims.sub.trim() : '';
  if (subjectUid) {
    return subjectUid;
  }

  return null;
}

function decodeBase64UrlSegment(segment: string): string | null {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = normalized.length % 4;
  const padded = padLength === 0 ? normalized : `${normalized}${'='.repeat(4 - padLength)}`;

  try {
    if (typeof atob === 'function') {
      return atob(padded);
    }

    const maybeBuffer = (globalThis as { Buffer?: any }).Buffer;
    if (maybeBuffer) {
      return maybeBuffer.from(padded, 'base64').toString('utf8');
    }
  } catch {
    return null;
  }

  return null;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const segments = token.split('.');
  if (segments.length < 2) {
    return {};
  }

  const decoded = decodeBase64UrlSegment(segments[1]);
  if (!decoded) {
    return {};
  }

  try {
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function verifyStaffTokenClaimsWithFirebaseLookup(
  idToken: string,
  env: StaffAuthTokenGateEnv,
): Promise<Record<string, unknown> | null> {
  if (!env.CF_FIREBASE_API_KEY) {
    throw new Error('CF_FIREBASE_API_KEY is required for staff token verification');
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.CF_FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    },
  );

  if (!response.ok) {
    return null;
  }

  let payload: FirebaseLookupResponse;
  try {
    payload = await response.json() as FirebaseLookupResponse;
  } catch {
    return null;
  }

  const user = payload.users?.[0];
  if (!user?.localId) {
    return null;
  }

  let customClaims: Record<string, unknown> = {};
  if (typeof user.customAttributes === 'string' && user.customAttributes.trim()) {
    try {
      customClaims = JSON.parse(user.customAttributes) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  const idTokenClaims = decodeJwtPayload(idToken);
  const mergedClaims = {
    ...idTokenClaims,
    ...customClaims,
  };

  return {
    ...mergedClaims,
    uid: user.localId,
  };
}

export async function enforceStaffAuthTokenGate(
  request: Request,
  env: StaffAuthTokenGateEnv,
  dependencies: StaffAuthTokenGateDependencies = {},
): Promise<StaffAuthTokenGateResult> {
  const defaultGateResponse = enforceStaffOwnerApiGate(request, env);
  if (defaultGateResponse) {
    return {
      ok: false,
      response: defaultGateResponse,
    };
  }

  const idToken = extractBearerToken(request);
  if (!idToken) {
    return {
      ok: false,
      response: errorResponse('Missing Authorization bearer token', 401),
    };
  }

  const verifyStaffTokenClaims =
    dependencies.verifyStaffTokenClaims ?? verifyStaffTokenClaimsWithFirebaseLookup;

  let claims: Record<string, unknown> | null;
  try {
    claims = await verifyStaffTokenClaims(idToken, env);
  } catch {
    return {
      ok: false,
      response: errorResponse('Invalid staff token', 401),
    };
  }

  if (!claims) {
    return {
      ok: false,
      response: errorResponse('Invalid staff token', 401),
    };
  }

  const role = parseStaffRole(claims);
  if (!role) {
    return {
      ok: false,
      response: errorResponse('Staff role claim is required', 403),
    };
  }

  const uid = parseUid(claims);
  if (!uid) {
    return {
      ok: false,
      response: errorResponse('Staff token is missing uid claim', 401),
    };
  }

  return {
    ok: true,
    identity: {
      uid,
      role,
      claims,
    },
  };
}

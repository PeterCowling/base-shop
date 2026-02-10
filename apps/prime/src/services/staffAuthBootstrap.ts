import { type FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';

import { isStaffRole } from '../lib/checkin/helpers';

const PRIME_STAFF_ROLE_PRIORITY = ['owner', 'admin', 'staff'] as const;

type PrimeStaffRole = (typeof PRIME_STAFF_ROLE_PRIORITY)[number];

export type StaffAuthBootstrapFailureReason =
  | 'missing_custom_token'
  | 'signin_failed'
  | 'missing_id_token'
  | 'missing_claims'
  | 'invalid_role_claim';

interface TokenResultShape {
  claims?: Record<string, unknown>;
}

interface AuthCredentialShape {
  user: {
    uid: string;
    getIdToken: () => Promise<string>;
    getIdTokenResult: () => Promise<TokenResultShape>;
  };
}

interface StaffAuthBootstrapDependencies {
  signInWithCustomToken: (customToken: string) => Promise<AuthCredentialShape>;
}

export interface StaffAuthBootstrapSuccess {
  ok: true;
  userId: string;
  idToken: string;
  role: PrimeStaffRole;
  claims: Record<string, unknown>;
}

export interface StaffAuthBootstrapFailure {
  ok: false;
  reason: StaffAuthBootstrapFailureReason;
  message: string;
}

export type StaffAuthBootstrapResult = StaffAuthBootstrapSuccess | StaffAuthBootstrapFailure;

function parseRoleFromClaims(claims: Record<string, unknown>): PrimeStaffRole | null {
  const directRole = typeof claims.role === 'string' ? claims.role.toLowerCase() : null;
  if (directRole && isStaffRole(directRole)) {
    return directRole as PrimeStaffRole;
  }

  if (Array.isArray(claims.roles)) {
    const normalizedRoles = claims.roles
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.toLowerCase());

    for (const role of PRIME_STAFF_ROLE_PRIORITY) {
      if (normalizedRoles.includes(role)) {
        return role;
      }
    }
  }

  if (claims.staff === true || claims.isStaff === true) {
    return 'staff';
  }

  return null;
}

function getPrimeFirebaseApp(): FirebaseApp {
  const existing = getApps().find((app) => app.name === 'prime-staff-auth');
  if (existing) {
    return existing;
  }

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  };

  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }

  try {
    return getApp();
  } catch {
    return initializeApp(firebaseConfig, 'prime-staff-auth');
  }
}

async function defaultSignInWithCustomToken(customToken: string): Promise<AuthCredentialShape> {
  const { getAuth, signInWithCustomToken } = await import('firebase/auth');
  const auth = getAuth(getPrimeFirebaseApp());
  const credential = await signInWithCustomToken(auth, customToken);
  return credential as unknown as AuthCredentialShape;
}

function buildFailure(
  reason: StaffAuthBootstrapFailureReason,
  message: string,
): StaffAuthBootstrapFailure {
  return {
    ok: false,
    reason,
    message,
  };
}

/**
 * Minimal Firebase Auth bootstrap spike:
 * exchanges a custom token, reads role claims, and fails closed for non-staff claims.
 */
export async function bootstrapStaffAuthSession(
  customToken: string | null | undefined,
  dependencies: Partial<StaffAuthBootstrapDependencies> = {},
): Promise<StaffAuthBootstrapResult> {
  if (!customToken || !customToken.trim()) {
    return buildFailure('missing_custom_token', 'Missing custom token');
  }

  const signIn = dependencies.signInWithCustomToken ?? defaultSignInWithCustomToken;

  let credential: AuthCredentialShape;
  try {
    credential = await signIn(customToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign in with custom token';
    return buildFailure('signin_failed', message);
  }

  const tokenResult = await credential.user.getIdTokenResult();
  const idToken = await credential.user.getIdToken();
  if (!idToken || !idToken.trim()) {
    return buildFailure('missing_id_token', 'Firebase sign-in did not return an ID token');
  }

  const claims = tokenResult.claims;
  if (!claims || Object.keys(claims).length === 0) {
    return buildFailure('missing_claims', 'Token is missing required role claims');
  }

  const role = parseRoleFromClaims(claims);
  if (!role || !isStaffRole(role)) {
    return buildFailure('invalid_role_claim', 'Token claims do not map to a staff/admin/owner role');
  }

  return {
    ok: true,
    userId: credential.user.uid,
    idToken,
    role,
    claims,
  };
}

/**
 * TASK-55 output artifact for TASK-51 promotion decisioning.
 */
export function getTask51PromotionRecommendation(result: StaffAuthBootstrapResult): string {
  if (result.ok) {
    return 'PROMOTE_TASK_51_WITH_FIREBASE_BOOTSTRAP';
  }

  const failureReason = 'reason' in result ? result.reason : 'signin_failed';
  return `BLOCK_TASK_51_UNTIL_${failureReason.toUpperCase()}`;
}

import { errorResponse } from './firebase-rest';

export interface StaffOwnerGateEnv {
  NODE_ENV?: string;
  PRIME_ENABLE_STAFF_OWNER_ROUTES?: string;
  PRIME_STAFF_OWNER_GATE_TOKEN?: string;
}

function isProduction(env: StaffOwnerGateEnv): boolean {
  return (env.NODE_ENV ?? 'development') === 'production';
}

function isFeatureEnabled(env: StaffOwnerGateEnv): boolean {
  return env.PRIME_ENABLE_STAFF_OWNER_ROUTES === 'true';
}

function hasAccessToken(request: Request, env: StaffOwnerGateEnv): boolean {
  if (!env.PRIME_STAFF_OWNER_GATE_TOKEN) {
    return false;
  }
  const token = request.headers.get('x-prime-access-token');
  return token === env.PRIME_STAFF_OWNER_GATE_TOKEN;
}

function hasCloudflareAccess(request: Request): boolean {
  const accessUser = request.headers.get('cf-access-authenticated-user-email');
  return Boolean(accessUser && accessUser.trim());
}

export function enforceStaffOwnerApiGate(
  request: Request,
  env: StaffOwnerGateEnv,
): Response | null {
  if (!isProduction(env)) {
    return null;
  }
  if (isFeatureEnabled(env)) {
    return null;
  }
  if (hasCloudflareAccess(request) || hasAccessToken(request, env)) {
    return null;
  }

  return errorResponse(
    'Staff/owner APIs are disabled in production until secure route gates are enabled.',
    403,
  );
}

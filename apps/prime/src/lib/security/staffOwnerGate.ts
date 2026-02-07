export interface StaffOwnerGateEnv {
  NODE_ENV?: string;
  NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES?: string;
}

export function isProductionRuntime(
  env: StaffOwnerGateEnv = process.env,
): boolean {
  return (env.NODE_ENV ?? 'development') === 'production';
}

export function isStaffOwnerRoutesFeatureEnabled(
  env: StaffOwnerGateEnv = process.env,
): boolean {
  return env.NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES === 'true';
}

export function canAccessStaffOwnerRoutes(
  env: StaffOwnerGateEnv = process.env,
): boolean {
  if (!isProductionRuntime(env)) {
    return true;
  }
  return isStaffOwnerRoutesFeatureEnabled(env);
}

export function getStaffOwnerGateMessage(): string {
  return 'Staff and owner tools are disabled in production until secure access controls are enabled.';
}

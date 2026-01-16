export const ACCESS_COOKIE_NAME = "xa_access";
export const ADMIN_COOKIE_NAME = "xa_access_admin";

export function normalizeInviteCode(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function resolveInviteCodes(): string[] {
  const raw =
    process.env.XA_STEALTH_INVITE_CODES ??
    process.env.STEALTH_INVITE_CODES ??
    process.env.STEALTH_INVITE_CODE ??
    "";
  return raw
    .split(",")
    .map((code) => normalizeInviteCode(code))
    .filter(Boolean);
}

export function isInviteCodeValid(code: string, codes: string[]): boolean {
  if (!codes.length) return false;
  return codes.includes(normalizeInviteCode(code));
}

export function resolveAccessCookieSecret(): string {
  return (
    process.env.XA_ACCESS_COOKIE_SECRET ??
    process.env.SESSION_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    ""
  );
}

export function resolveInviteHashSecret(): string {
  return (
    process.env.XA_INVITE_HASH_SECRET ??
    resolveAccessCookieSecret()
  );
}

export function resolveAdminToken(): string {
  return (process.env.XA_ACCESS_ADMIN_TOKEN ?? "").trim();
}

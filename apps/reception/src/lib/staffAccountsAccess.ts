import type { User } from "../types/domains/userDomain";

const DEFAULT_PETE_EMAIL = "peter.cowling1976@gmail.com";

type IdentityLike = Pick<User, "uid" | "email"> | { uid?: string; email?: string };

function normalizeIdentity(value: string | undefined | null): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}

function parseCsvEnv(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((value) => normalizeIdentity(value))
    .filter((value): value is string => value !== null);
}

function configuredPeteEmails(): Set<string> {
  const configured = new Set<string>([
    ...parseCsvEnv(process.env.RECEPTION_STAFF_ACCOUNTS_PETE_EMAILS),
    ...parseCsvEnv(process.env.NEXT_PUBLIC_RECEPTION_STAFF_ACCOUNTS_PETE_EMAILS),
  ]);

  if (configured.size === 0) {
    configured.add(DEFAULT_PETE_EMAIL);
  }

  return configured;
}

function configuredPeteUids(): Set<string> {
  return new Set<string>([
    ...parseCsvEnv(process.env.RECEPTION_STAFF_ACCOUNTS_PETE_UIDS),
    ...parseCsvEnv(process.env.NEXT_PUBLIC_RECEPTION_STAFF_ACCOUNTS_PETE_UIDS),
  ]);
}

export function isStaffAccountsPeteIdentity(identity: IdentityLike | null | undefined): boolean {
  if (!identity) return false;

  const uid = normalizeIdentity(identity.uid);
  const email = normalizeIdentity(identity.email);

  const allowedUids = configuredPeteUids();
  if (uid && allowedUids.has(uid)) {
    return true;
  }

  const allowedEmails = configuredPeteEmails();
  return email ? allowedEmails.has(email) : false;
}

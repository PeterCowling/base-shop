// apps/cms/src/auth/secret.ts

import { env } from "@acme/config";

// `NEXTAUTH_SECRET` is required to ensure sessions are cryptographically
// signed.
const secret = env.NEXTAUTH_SECRET;

if (!secret) {
  throw new Error("NEXTAUTH_SECRET is not set"); // i18n-exempt: developer configuration error, not user-facing UI copy
}

// Explicitly cast to string so consumers receive a correctly typed secret
export const authSecret = secret as string;

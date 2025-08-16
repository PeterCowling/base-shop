// apps/cms/src/auth/secret.ts

import { env } from "@acme/config";

if (!env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set");
}

// Explicitly cast to string so consumers receive a correctly typed secret
export const authSecret = env.NEXTAUTH_SECRET as string;

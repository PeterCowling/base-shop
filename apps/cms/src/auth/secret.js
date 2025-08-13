// apps/cms/src/auth/secret.ts
import { env } from "@acme/config";
if (!env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set");
}
export const authSecret = env.NEXTAUTH_SECRET;

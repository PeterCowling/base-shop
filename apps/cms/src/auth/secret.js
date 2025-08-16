// apps/cms/src/auth/secret.ts
import { env } from "@acme/config";
if (!env.NEXTAUTH_SECRET) {
    throw new Error("NEXTAUTH_SECRET is not set");
}
// Ensure the secret is treated as a string at runtime
export const authSecret = String(env.NEXTAUTH_SECRET);

// apps/cms/src/auth/secret.ts
import { env } from "@acme/config";

export const authSecret = env.NEXTAUTH_SECRET || "dev-secret";

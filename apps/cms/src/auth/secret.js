// apps/cms/src/auth/secret.ts
import { coreEnv } from "@acme/config/env/core";
export const authSecret = coreEnv.NEXTAUTH_SECRET || "dev-secret";

import { PrismaClient } from "@prisma/client";
import { coreEnv } from "@acme/config/env/core";
const databaseUrl = coreEnv.DATABASE_URL ?? "file:./packages/platform-core/dev.db";
export const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
});

import { PrismaClient } from "@prisma/client";
import { env } from "@acme/config";

const databaseUrl =
  env.DATABASE_URL ?? "file:./packages/platform-core/dev.db";

export const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

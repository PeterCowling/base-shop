import { PrismaClient } from "@prisma/client";

const databaseUrl =
  process.env.DATABASE_URL ?? "file:./packages/platform-core/dev.db";

export const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

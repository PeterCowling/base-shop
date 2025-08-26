import { coreEnv } from "@acme/config/env/core";

let prisma: unknown;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
  const databaseUrl =
    coreEnv.DATABASE_URL ?? "file:./packages/platform-core/dev.db";
  prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
} catch {
  // Fallback stub for environments without Prisma client (e.g., tests)
  prisma = new Proxy(
    {},
    {
      get: () =>
        new Proxy(
          {},
          {
            get: () => async () => null,
          }
        ),
    }
  );
}

export { prisma };

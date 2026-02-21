// Use a loose PrismaClient type to avoid requiring the heavy @prisma/client
// dependency during tests. The actual client will be loaded dynamically when
// available.

import { createRequire } from "module";

import { loadCoreEnv } from "@acme/config/env/core";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PrismaClient type varies by generated schema; safe to use any here
type PrismaClientType = any;

type RequireFn = ReturnType<typeof createRequire>;

function resolveRequire(): RequireFn | undefined {
  const globalRequire = (globalThis as { require?: unknown }).require;
  if (typeof globalRequire === "function") {
    return globalRequire as RequireFn;
  }
  if (typeof __filename === "string") {
    try {
      return createRequire(__filename);
    } catch {
      // ignore and fall back to cwd based resolution
    }
  }
  try {
    return createRequire(process.cwd() + "/");
  } catch {
    return undefined;
  }
}

let PrismaCtor: (new (...args: unknown[]) => PrismaClientType) | undefined;

function loadPrismaClient(): (new (...args: unknown[]) => PrismaClientType) | undefined {
  if (PrismaCtor !== undefined) return PrismaCtor;
  try {
    const req = resolveRequire();
    if (!req) {
      PrismaCtor = undefined;
      return PrismaCtor;
    }
    const modAny = req("@prisma/client"); // i18n-exempt -- DS-0001 Module identifier string, not user-facing copy
    const reqMod = modAny as {
      PrismaClient: new (...args: unknown[]) => PrismaClientType;
    };
    PrismaCtor = reqMod.PrismaClient;
  } catch {
    PrismaCtor = undefined;
  }
  return PrismaCtor;
}

function missingPrismaClient(): PrismaClientType {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        throw new Error(
          `Prisma client unavailable (DATABASE_URL missing or @prisma/client not installed). Tried to access prisma.${String(
            prop,
          )}`,
        );
      },
    },
  ) as unknown as PrismaClientType;
}

let DATABASE_URL: string | undefined;
try {
  ({ DATABASE_URL } = loadCoreEnv());
} catch {
  // Fall back to raw process.env when core env validation fails in tests
  DATABASE_URL = process.env.DATABASE_URL;
}
// Ensure direct env var takes precedence when core env omits DATABASE_URL
if (!DATABASE_URL && typeof process.env.DATABASE_URL === "string") {
  DATABASE_URL = process.env.DATABASE_URL;
}

const prisma: PrismaClientType = (() => {
  if (process.env.NODE_ENV === "test") {
    // Test-only stub: keep it out of production builds.
    const req = resolveRequire();
    if (!req) return missingPrismaClient();
    const modAny = req("./db/testStub");
    return (modAny as { createTestPrismaStub: () => PrismaClientType }).createTestPrismaStub();
  }

  if (!DATABASE_URL) return missingPrismaClient();

  const PC = loadPrismaClient();
  if (!PC) return missingPrismaClient();

  return new PC({ datasources: { db: { url: DATABASE_URL } } }) as unknown as PrismaClientType;
})();

export { loadPrismaClient, prisma };

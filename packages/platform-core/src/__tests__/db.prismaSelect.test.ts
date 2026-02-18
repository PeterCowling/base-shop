/** @jest-environment node */

import { jest } from "@jest/globals";

describe("prisma client selection", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete (process.env as any).NODE_ENV;
    delete process.env.DATABASE_URL;
  });

  it("instantiates PrismaClient with DATABASE_URL", async () => {
    (process.env as any).NODE_ENV = "production";
    const fakeUrl = "postgres://fake";
    process.env.DATABASE_URL = fakeUrl;

    class FakePrismaClient {
      static args: unknown;
      constructor(args: unknown) {
        FakePrismaClient.args = args;
      }
    }

    jest.doMock("@acme/config/env/core", () => ({
      loadCoreEnv: () => ({ DATABASE_URL: fakeUrl }),
    }));

    jest.doMock(
      "@prisma/client",
      () => ({ PrismaClient: FakePrismaClient }),
      { virtual: true }
    );

    const { prisma } = await import("../db");

    expect(FakePrismaClient.args).toEqual({
      datasources: { db: { url: fakeUrl } },
    });
    expect(prisma).toBeInstanceOf(FakePrismaClient);
  });

  it("throws when DATABASE_URL is missing", async () => {
    (process.env as any).NODE_ENV = "production";

    const ctor = jest.fn();
    jest.doMock("@acme/config/env/core", () => ({
      loadCoreEnv: () => ({}),
    }));
    jest.doMock(
      "@prisma/client",
      () => ({ PrismaClient: ctor }),
      { virtual: true }
    );

    const { prisma } = await import("../db");

    // missingPrismaClient() proxy throws on any property access
    expect(() => (prisma as any).rentalOrder).toThrow("Prisma client unavailable");
    expect(ctor).not.toHaveBeenCalled();
  });
});


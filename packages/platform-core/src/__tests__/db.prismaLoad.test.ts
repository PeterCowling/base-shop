/** @jest-environment node */

import type { PrismaClient } from "@prisma/client";

describe("loadPrismaClient", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete (process.env as any).NODE_ENV;
  });

  it("returns undefined when DATABASE_URL is missing and createRequire throws", async () => {
    await jest.isolateModulesAsync(async () => {
      (process.env as any).NODE_ENV = "production";
      jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv: () => ({}) }));
      const createRequireMock = jest.fn(() => {
        throw new Error("cannot load");
      });
      jest.doMock("module", () => ({ createRequire: createRequireMock }));

      const { loadPrismaClient, prisma } = (await import("../db")) as {
        loadPrismaClient: () => any;
        prisma: any;
      };

      expect(loadPrismaClient()).toBeUndefined();
      expect(createRequireMock).toHaveBeenCalled();
      // prisma is missingPrismaClient() — throws on property access
      expect(() => prisma.rentalOrder).toThrow("Prisma client unavailable");
    });
  });

  it("caches the Prisma client after first load", async () => {
    await jest.isolateModulesAsync(async () => {
      (process.env as any).NODE_ENV = "production";
      jest.doMock("@acme/config/env/core", () => ({
        loadCoreEnv: () => ({ DATABASE_URL: "postgres://example" }),
      }));
      const requireMock = jest.fn().mockReturnValue({ PrismaClient: class {} });
      const createRequireMock = jest.fn(() => requireMock);
      jest.doMock("module", () => ({ createRequire: createRequireMock }));

      const { loadPrismaClient } = await import("../db");
      loadPrismaClient();
      loadPrismaClient();
      expect(createRequireMock).toHaveBeenCalledTimes(1);
      expect(requireMock).toHaveBeenCalledTimes(1);
    });
  });

  it("propagates errors from the Prisma constructor", async () => {
    await jest.isolateModulesAsync(async () => {
      (process.env as any).NODE_ENV = "production";
      jest.doMock("@acme/config/env/core", () => ({
        loadCoreEnv: () => ({ DATABASE_URL: "postgres://example" }),
      }));
      class BadPrisma {
        constructor() {
          throw new Error("connection failed");
        }
      }
      const requireMock = jest.fn().mockReturnValue({ PrismaClient: BadPrisma });
      jest.doMock("module", () => ({ createRequire: () => requireMock }));

      await expect(import("../db")).rejects.toThrow("connection failed");
    });
  });
});

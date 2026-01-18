/** @jest-environment node */
import { jest } from "@jest/globals";

describe("db env guards", () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.DATABASE_URL;
    delete process.env.NODE_ENV;
  });

  it("falls back to the stub client when core env throws", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    let prisma: any;
    await jest.isolateModulesAsync(async () => {
      jest.doMock("@acme/config/env/core", () => ({
        loadCoreEnv: () => {
          throw new Error("missing");
        },
      }));
      prisma = (await import("@acme/platform-core/db")).prisma;
    });

    const marker = {};
    await expect(prisma.$transaction(() => marker)).resolves.toBe(marker);
  });

  it("errors on invalid DATABASE_URL", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    await expect(
      jest.isolateModulesAsync(async () => {
        jest.doMock("@acme/config/env/core", () => ({
          loadCoreEnv: () => ({ DATABASE_URL: "bad" }),
        }));
        jest.doMock(
          "@prisma/client",
          () => ({
            PrismaClient: jest.fn(() => {
              throw new Error("invalid url");
            }),
          }),
          { virtual: true },
        );
        await import("@acme/platform-core/db");
      }),
    ).rejects.toThrow("invalid url");
  });

  it("creates client with valid URL", async () => {
    await jest.isolateModulesAsync(async () => {
      const ctor = jest.fn().mockReturnValue({});
      jest.doMock("@acme/config/env/core", () => ({
        loadCoreEnv: () => ({ DATABASE_URL: "postgres://ok" }),
      }));
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      jest.doMock("@prisma/client", () => ({ PrismaClient: ctor }), {
        virtual: true,
      });
      const { prisma } = await import("@acme/platform-core/db");
      expect(prisma).toBeDefined();
      expect(ctor).toHaveBeenCalledWith({
        datasources: { db: { url: "postgres://ok" } },
      });
    });
  });

  it("returns cached client on reinit", async () => {
    await jest.isolateModulesAsync(async () => {
      const ctor = jest.fn().mockReturnValue({});
      jest.doMock("@acme/config/env/core", () => ({
        loadCoreEnv: () => ({ DATABASE_URL: "postgres://ok" }),
      }));
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      jest.doMock("@prisma/client", () => ({ PrismaClient: ctor }), {
        virtual: true,
      });
      const { prisma } = await import("@acme/platform-core/db");
      const { prisma: again } = await import("@acme/platform-core/db");
      expect(prisma).toBe(again);
      expect(ctor).toHaveBeenCalledTimes(1);
    });
  });
});

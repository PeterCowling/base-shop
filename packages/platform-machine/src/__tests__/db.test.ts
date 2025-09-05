import { jest } from "@jest/globals";

describe("db fallbacks", () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
  });

  it("uses in-memory stub when in test env", async () => {
    await jest.isolateModulesAsync(async () => {
      process.env.NODE_ENV = "test";
      jest.doMock("@acme/config/env/core", () => ({
        loadCoreEnv: () => ({ DATABASE_URL: "postgres://unused" }),
      }));
      const { prisma } = await import("@acme/platform-core/db");
      await prisma.rentalOrder.create({ data: { shop: "s1" } });
      const orders = await prisma.rentalOrder.findMany({});
      expect(orders).toEqual([{ shop: "s1" }]);
    });
  });

  it("constructs PrismaClient in production", async () => {
    await jest.isolateModulesAsync(async () => {
      process.env.NODE_ENV = "production";
      jest.doMock("@acme/config/env/core", () => ({
        loadCoreEnv: () => ({ DATABASE_URL: "postgres://example" }),
      }));
      const ctor = jest.fn().mockReturnValue({});
      jest.doMock("@prisma/client", () => ({ PrismaClient: ctor }), {
        virtual: true,
      });
      await import("@acme/platform-core/db");
      expect(ctor).toHaveBeenCalledWith({
        datasources: { db: { url: "postgres://example" } },
      });
    });
  });

  it("falls back to stub when Prisma client missing", async () => {
    await jest.isolateModulesAsync(async () => {
      process.env.NODE_ENV = "production";
      jest.doMock("@acme/config/env/core", () => ({
        loadCoreEnv: () => ({ DATABASE_URL: "postgres://example" }),
      }));
      jest.doMock("@prisma/client", () => ({}), { virtual: true });
      const { prisma } = await import("@acme/platform-core/db");
      await prisma.rentalOrder.create({ data: { shop: "s2" } });
      const orders = await prisma.rentalOrder.findMany({});
      expect(orders).toEqual([{ shop: "s2" }]);
    });
  });
});


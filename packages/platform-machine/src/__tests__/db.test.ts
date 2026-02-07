import { jest } from "@jest/globals";

describe("db fallbacks", () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
  });

  const exerciseStub = async (shop: string, prisma: any) => {
    await prisma.rentalOrder.create({
      data: { shop, sessionId: "s1", trackingNumber: "t1" },
    });
    await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId: "s1" } },
      data: { trackingNumber: "t2" },
    });
    const orders = await prisma.rentalOrder.findMany({ where: { shop } });
    expect(orders).toEqual([
      { shop, sessionId: "s1", trackingNumber: "t2" },
    ]);
    await expect(
      prisma.rentalOrder.update({
        where: { shop_sessionId: { shop, sessionId: "missing" } },
        data: { trackingNumber: "t3" },
      }),
    ).rejects.toThrow("Order not found");
  };

  it("uses in-memory stub in test env", async () => {
    await (jest as any).isolateModulesAsync(async () => {
      process.env.NODE_ENV = "test";
      jest.doMock("@acme/config/env/core", () => ({
        loadCoreEnv: () => ({ DATABASE_URL: "postgres://unused" }),
      }));
      const { prisma } = await import("@acme/platform-core/db");
      await exerciseStub("s1", prisma);
    });
  });

  it("uses in-memory stub when DATABASE_URL is undefined", async () => {
    await (jest as any).isolateModulesAsync(async () => {
      process.env.NODE_ENV = "production";
      jest.doMock("@acme/config/env/core", () => ({
        loadCoreEnv: () => ({}),
      }));
      const { prisma } = await import("@acme/platform-core/db");
      await exerciseStub("s2", prisma);
    });
  });

  it("constructs PrismaClient in production", async () => {
    await (jest as any).isolateModulesAsync(async () => {
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

  it("falls back to stub when createRequire throws", async () => {
    await (jest as any).isolateModulesAsync(async () => {
      process.env.NODE_ENV = "production";
      jest.doMock("@acme/config/env/core", () => ({
        loadCoreEnv: () => ({ DATABASE_URL: "postgres://example" }),
      }));
      jest.doMock(
        "module",
        () => ({
          createRequire: () => {
            throw new Error("cannot load");
          },
        }),
        { virtual: true },
      );
      const { prisma } = await import("@acme/platform-core/db");
      await prisma.rentalOrder.create({
        data: { shop: "s3", sessionId: "s3", trackingNumber: "t3" },
      });
      const orders = await prisma.rentalOrder.findMany({ where: { shop: "s3" } });
      expect(orders).toEqual([
        { shop: "s3", sessionId: "s3", trackingNumber: "t3" },
      ]);
    });
  });
});


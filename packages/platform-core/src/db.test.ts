/** @jest-environment node */

import type { PrismaClient } from "@prisma/client";

describe("db", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
  });

  it("uses stub when NODE_ENV=test and no DATABASE_URL", async () => {
    process.env.NODE_ENV = "test";
    jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv: () => ({}) }));
    jest.doMock(
      "@prisma/client",
      () => {
        throw new Error("should not load");
      },
      { virtual: true }
    );

    const { prisma } = (await import("./db")) as { prisma: PrismaClient };

    const shop = "stub-shop";
    expect(await prisma.rentalOrder.findMany({ where: { shop } })).toEqual([]);

    await prisma.rentalOrder.create({
      data: { shop, sessionId: "s1", trackingNumber: "t1" },
    });

    const updated = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId: "s1" } },
      data: { trackingNumber: "t2" },
    });
    expect(updated.trackingNumber).toBe("t2");

    const orders = await prisma.rentalOrder.findMany({ where: { shop } });
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      shop,
      sessionId: "s1",
      trackingNumber: "t2",
    });
  });

  it("uses stub when NODE_ENV=test even with DATABASE_URL", async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgres://example";
    jest.doMock("@acme/config/env/core", () => ({
      loadCoreEnv: () => ({ DATABASE_URL: "postgres://example" }),
    }));
    jest.doMock(
      "@prisma/client",
      () => {
        throw new Error("should not load");
      },
      { virtual: true }
    );

    const { prisma } = (await import("./db")) as { prisma: PrismaClient };

    const shop = "shop2";
    await prisma.rentalOrder.create({
      data: { shop, sessionId: "s1", trackingNumber: "t1" },
    });
    const orders = await prisma.rentalOrder.findMany({ where: { shop } });
    expect(orders).toHaveLength(1);
  });

  it("falls back to stub when @prisma/client fails to load", async () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgres://example";
    jest.doMock("@acme/config/env/core", () => ({
      loadCoreEnv: () => ({ DATABASE_URL: "postgres://example" }),
    }));
    jest.doMock(
      "@prisma/client",
      () => {
        throw new Error("module load failed");
      },
      { virtual: true }
    );

    const { prisma } = (await import("./db")) as { prisma: PrismaClient };

    await prisma.rentalOrder.create({
      data: { shop: "s", sessionId: "1", trackingNumber: "t1" },
    });
    const orders = await prisma.rentalOrder.findMany({ where: { shop: "s" } });
    expect(orders).toHaveLength(1);
  });

  it("passes DATABASE_URL to PrismaClient", async () => {
    process.env.NODE_ENV = "production";
    const databaseUrl = "postgres://from-core-env";
    jest.doMock("@acme/config/env/core", () => ({
      loadCoreEnv: () => ({ DATABASE_URL: databaseUrl }),
    }));
    const PrismaClientMock = jest.fn().mockImplementation(() => ({}));
    jest.doMock(
      "@prisma/client",
      () => ({ PrismaClient: PrismaClientMock }),
      { virtual: true }
    );

    await import("./db");

    expect(PrismaClientMock).toHaveBeenCalledWith({
      datasources: { db: { url: databaseUrl } },
    });
  });
});

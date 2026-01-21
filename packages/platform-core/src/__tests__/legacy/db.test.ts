/** @jest-environment node */

import type { PrismaClient } from "@prisma/client";

describe("db", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.unmock("module");
    jest.unmock("@prisma/client");
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

    const { prisma } = (await import("../../db")) as { prisma: PrismaClient };

    const shop = "stub-shop";
    expect(await prisma.rentalOrder.findMany({ where: { shop } })).toEqual([]);

    const created = await prisma.rentalOrder.create({
      data: {
        shop,
        customerId: "c1",
        sessionId: "s1",
        trackingNumber: "t1",
      },
    });
    expect(created).toMatchObject({
      shop,
      customerId: "c1",
      sessionId: "s1",
      trackingNumber: "t1",
    });

    const updated = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId: "s1" } },
      data: { trackingNumber: "t2" },
    });
    expect(updated.trackingNumber).toBe("t2");

    const orders = await prisma.rentalOrder.findMany({
      where: { shop, customerId: "c1" },
    });
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      shop,
      customerId: "c1",
      sessionId: "s1",
      trackingNumber: "t2",
    });
  });

  it("findMany filters by shop and customerId", async () => {
    process.env.NODE_ENV = "test";
    jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv: () => ({}) }));
    jest.doMock(
      "@prisma/client",
      () => {
        throw new Error("should not load");
      },
      { virtual: true }
    );

    const { prisma } = (await import("../../db")) as { prisma: PrismaClient };

    await prisma.rentalOrder.create({
      data: {
        shop: "shop1",
        customerId: "c1",
        sessionId: "s1",
        trackingNumber: "t1",
      },
    });
    await prisma.rentalOrder.create({
      data: {
        shop: "shop1",
        customerId: "c2",
        sessionId: "s2",
        trackingNumber: "t2",
      },
    });
    await prisma.rentalOrder.create({
      data: {
        shop: "shop2",
        customerId: "c1",
        sessionId: "s3",
        trackingNumber: "t3",
      },
    });

    const results = await prisma.rentalOrder.findMany({
      where: { shop: "shop1", customerId: "c1" },
    });

    expect(results).toEqual([
      {
        shop: "shop1",
        customerId: "c1",
        sessionId: "s1",
        trackingNumber: "t1",
      },
    ]);
  });

  it("throws when updating a nonexistent order", async () => {
    process.env.NODE_ENV = "test";
    jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv: () => ({}) }));
    jest.doMock(
      "@prisma/client",
      () => {
        throw new Error("should not load");
      },
      { virtual: true }
    );

    const { prisma } = (await import("../../db")) as { prisma: PrismaClient };

    await expect(
      prisma.rentalOrder.update({
        where: {
          shop_trackingNumber: { shop: "s", trackingNumber: "missing" },
        },
        data: { trackingNumber: "t1" },
      })
    ).rejects.toThrow("Order not found");
  });

  it("updates orders by trackingNumber", async () => {
    process.env.NODE_ENV = "test";
    jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv: () => ({}) }));
    jest.doMock(
      "@prisma/client",
      () => {
        throw new Error("should not load");
      },
      { virtual: true }
    );

    const { prisma } = (await import("../../db")) as { prisma: PrismaClient };

    await prisma.rentalOrder.create({
      data: {
        shop: "shop",
        trackingNumber: "t1",
        sessionId: "s1",
      },
    });

    const updated = await prisma.rentalOrder.update({
      where: { shop_trackingNumber: { shop: "shop", trackingNumber: "t1" } },
      data: { customerId: "c99" },
    });

    expect(updated).toMatchObject({
      shop: "shop",
      trackingNumber: "t1",
      sessionId: "s1",
      customerId: "c99",
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

    const { prisma } = (await import("../../db")) as { prisma: PrismaClient };

    const shop = "shop2";
    await prisma.rentalOrder.create({
      data: { shop, sessionId: "s1", trackingNumber: "t1" },
    });
    const orders = await prisma.rentalOrder.findMany({ where: { shop } });
    expect(orders).toHaveLength(1);
  });

  it("uses stub when NODE_ENV=production and no DATABASE_URL", async () => {
    process.env.NODE_ENV = "production";
    jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv: () => ({}) }));
    jest.doMock(
      "@prisma/client",
      () => {
        throw new Error("should not load");
      },
      { virtual: true }
    );

    const { prisma } = (await import("../../db")) as { prisma: PrismaClient };

    const shop = "prod-shop";
    expect(await prisma.rentalOrder.findMany({ where: { shop } })).toEqual([]);
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

    const { prisma } = (await import("../../db")) as { prisma: PrismaClient };

    await prisma.rentalOrder.create({
      data: { shop: "s", sessionId: "1", trackingNumber: "t1" },
    });
    const orders = await prisma.rentalOrder.findMany({ where: { shop: "s" } });
    expect(orders).toHaveLength(1);
  });

  it("falls back to stub when createRequire throws", async () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgres://example";
    jest.doMock("@acme/config/env/core", () => ({
      loadCoreEnv: () => ({ DATABASE_URL: "postgres://example" }),
    }));
    const createRequireMock = jest.fn(() => {
      throw new Error("fail");
    });
    jest.doMock("module", () => ({ createRequire: createRequireMock }));

    const { prisma } = (await import("../../db")) as { prisma: PrismaClient };

    await prisma.rentalOrder.create({
      data: { shop: "s", sessionId: "1", trackingNumber: "t1" },
    });
    const orders = await prisma.rentalOrder.findMany({ where: { shop: "s" } });
    expect(orders).toHaveLength(1);
    expect(createRequireMock).toHaveBeenCalled();
  });

  it("passes DATABASE_URL to PrismaClient", async () => {
    process.env.NODE_ENV = "production";
    const databaseUrl = "postgres://from-core-env";
    jest.doMock("@acme/config/env/core", () => ({
      loadCoreEnv: () => ({ DATABASE_URL: databaseUrl }),
    }));
    const PrismaClientMock = jest.fn().mockImplementation(() => ({}));
    jest.doMock("@prisma/client", () => ({ PrismaClient: PrismaClientMock }), {
      virtual: true,
    });

    await import("../../db");

    expect(PrismaClientMock).toHaveBeenCalledWith({
      datasources: { db: { url: databaseUrl } },
    });
  });
});

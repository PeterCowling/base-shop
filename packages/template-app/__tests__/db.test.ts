// packages/template-app/__tests__/db.test.ts
/** @jest-environment node */

import type { PrismaClient } from "@prisma/client";

describe("platform-core db stub", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.unmock("@acme/config/env/core");
    jest.unmock("@prisma/client");
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
  });

  it("uses in-memory stub when NODE_ENV=test", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv: () => ({}) }));
    jest.doMock(
      "@prisma/client",
      () => {
        throw new Error("should not load");
      },
      { virtual: true }
    );

    const { prisma } = (await import("@acme/platform-core/db")) as { prisma: PrismaClient };

    const shop = "stub-shop";
    expect(await prisma.rentalOrder.findMany({ where: { shop } })).toEqual([]);

    await prisma.rentalOrder.create({
      data: { shop, sessionId: "s1", trackingNumber: "t1" },
    });
    await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId: "s1" } },
      data: { trackingNumber: "t2" },
    });
    const orders = await prisma.rentalOrder.findMany({ where: { shop } });
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      shop,
      sessionId: "s1",
      trackingNumber: "t2",
    });
  });

  it("falls back to stub when prisma client fails to load", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    (process.env as Record<string, string | undefined>).DATABASE_URL = "postgres://example";
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

    const { prisma } = (await import("@acme/platform-core/db")) as { prisma: PrismaClient };

    await prisma.rentalOrder.create({
      data: { shop: "shop", sessionId: "1", trackingNumber: "t1" },
    });
    const orders = await prisma.rentalOrder.findMany({ where: { shop: "shop" } });
    expect(orders).toHaveLength(1);
  });

  it("throws when updating a nonexistent order", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
    jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv: () => ({}) }));
    jest.doMock(
      "@prisma/client",
      () => {
        throw new Error("should not load");
      },
      { virtual: true }
    );

    const { prisma } = (await import("@acme/platform-core/db")) as { prisma: PrismaClient };

    await expect(
      prisma.rentalOrder.update({
        where: {
          shop_trackingNumber: { shop: "shop", trackingNumber: "missing" },
        },
        data: { trackingNumber: "t1" },
      })
    ).rejects.toThrow("Order not found");
  });
});


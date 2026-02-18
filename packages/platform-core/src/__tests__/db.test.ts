/** @jest-environment node */

describe("createStubPrisma", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete (process.env as any).NODE_ENV;
  });

  it("creates, updates, and queries rental orders", async () => {
    (process.env as any).NODE_ENV = "test";
    jest.doMock("@acme/config/env/core", () => ({
      loadCoreEnv: () => ({}),
    }));

    const { prisma } = (await import("../db")) as { prisma: any };

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

    await expect(
      prisma.rentalOrder.update({
        where: { shop_sessionId: { shop, sessionId: "missing" } },
        data: { trackingNumber: "t3" },
      })
    ).rejects.toThrow("Order not found");
  });

  it("throws a helpful error when prisma client is unavailable in production", async () => {
    (process.env as any).NODE_ENV = "production";
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

    const { prisma } = (await import("../db")) as { prisma: any };
    expect(() =>
      prisma.rentalOrder.findMany({ where: { shop: "s" } }),
    ).toThrow(/Prisma client unavailable/);
  });

  it("updates rental orders via tracking number and finds missing orders", async () => {
    (process.env as any).NODE_ENV = "test";
    jest.doMock("@acme/config/env/core", () => ({
      loadCoreEnv: () => ({}),
    }));

    const { prisma } = (await import("../db")) as { prisma: any };

    const shop = "stub-shop";
    await prisma.rentalOrder.create({
      data: { shop, sessionId: "s1", trackingNumber: "t1" },
    });

    const updated = await prisma.rentalOrder.update({
      where: { shop_trackingNumber: { shop, trackingNumber: "t1" } },
      data: { sessionId: "s2" },
    });
    expect(updated.sessionId).toBe("s2");

    expect(
      await prisma.rentalOrder.findUnique({
        where: { shop_sessionId: { shop, sessionId: "missing" } },
      }),
    ).toBeNull();
  });
});

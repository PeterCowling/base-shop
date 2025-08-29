/** @jest-environment node */

import type { PrismaClient } from "@prisma/client";

describe("db prisma client selection", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    delete process.env.DATABASE_URL;
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("creates an in-memory stub when in test env", async () => {
    process.env.NODE_ENV = "test";
    const { coreEnv } = await import("@acme/config/env/core");
    coreEnv.DATABASE_URL = undefined;

    const { prisma } = (await import("../db")) as { prisma: PrismaClient };

    const shop = "stub-shop";
    expect(await prisma.rentalOrder.findMany({ where: { shop } })).toEqual([]);

    await prisma.rentalOrder.create({
      data: { shop, sessionId: "s1", trackingNumber: "t1" },
    });

    let orders = await prisma.rentalOrder.findMany({ where: { shop } });
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({ shop, sessionId: "s1", trackingNumber: "t1" });

    await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId: "s1" } },
      data: { trackingNumber: "t2" },
    });

    orders = await prisma.rentalOrder.findMany({ where: { shop } });
    expect(orders[0].trackingNumber).toBe("t2");
  });

  it("loads the real Prisma client when a database URL is provided", async () => {
    process.env.NODE_ENV = "production";
    const { coreEnv } = await import("@acme/config/env/core");
    coreEnv.DATABASE_URL = "postgres://example";

    const prismaInstance = {} as unknown as PrismaClient;
    const PrismaClientMock = jest.fn().mockReturnValue(prismaInstance);
    jest.doMock("@prisma/client", () => ({ PrismaClient: PrismaClientMock }), {
      virtual: true,
    });

    const { prisma } = (await import("../db")) as { prisma: PrismaClient };

    expect(prisma).toBe(prismaInstance);
    expect(PrismaClientMock).toHaveBeenCalledWith({
      datasources: { db: { url: "postgres://example" } },
    });
  });
});

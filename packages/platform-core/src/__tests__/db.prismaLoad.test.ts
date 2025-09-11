/** @jest-environment node */

import type { PrismaClient } from "@prisma/client";

describe("loadPrismaClient", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.NODE_ENV;
  });

  it("returns undefined and falls back to stub when DATABASE_URL is missing", async () => {
    await jest.isolateModulesAsync(async () => {
      process.env.NODE_ENV = "production";
      jest.doMock("@acme/config/env/core", () => ({ loadCoreEnv: () => ({}) }));
      const createRequireMock = jest.fn(() => {
        throw new Error("cannot load");
      });
      jest.doMock("module", () => ({ createRequire: createRequireMock }));

      const { loadPrismaClient, prisma } = (await import("../db")) as {
        loadPrismaClient: () => any;
        prisma: PrismaClient;
      };

      expect(loadPrismaClient()).toBeUndefined();
      expect(createRequireMock).toHaveBeenCalled();

      await prisma.rentalOrder.create({
        data: { shop: "s", sessionId: "1", trackingNumber: "t1" },
      });
      const orders = await prisma.rentalOrder.findMany({ where: { shop: "s" } });
      expect(orders).toEqual([
        { shop: "s", sessionId: "1", trackingNumber: "t1" },
      ]);
    });
  });
});

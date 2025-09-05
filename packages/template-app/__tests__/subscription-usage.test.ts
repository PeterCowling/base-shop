import { jest } from "@jest/globals";

describe("subscriptionUsage", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("calls findUnique with composite key", async () => {
    await jest.isolateModulesAsync(async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      jest.doMock("@platform-core/db", () => ({
        prisma: { subscriptionUsage: { findUnique } },
      }));
      const { getSubscriptionUsage } = await import("@platform-core/subscriptionUsage");
      await getSubscriptionUsage("shop", "cust", "2023-10");
      expect(findUnique).toHaveBeenCalledWith({
        where: {
          shop_customerId_month: {
            shop: "shop",
            customerId: "cust",
            month: "2023-10",
          },
        },
      });
    });
  });

  it("upserts and increments shipments", async () => {
    await jest.isolateModulesAsync(async () => {
      const upsert = jest.fn().mockResolvedValue(undefined);
      jest.doMock("@platform-core/db", () => ({
        prisma: { subscriptionUsage: { upsert } },
      }));
      const { incrementSubscriptionUsage } = await import("@platform-core/subscriptionUsage");
      await incrementSubscriptionUsage("shop", "cust", "2023-10", 2);
      expect(upsert).toHaveBeenCalledWith({
        where: {
          shop_customerId_month: {
            shop: "shop",
            customerId: "cust",
            month: "2023-10",
          },
        },
        create: { shop: "shop", customerId: "cust", month: "2023-10", shipments: 2 },
        update: { shipments: { increment: 2 } },
      });
    });
  });
});

import { jest } from "@jest/globals";

describe("subscriptionUsage", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("calls findUniqueOrThrow with composite key", async () => {
    await jest.isolateModulesAsync(async () => {
      const findUniqueOrThrow = jest.fn().mockResolvedValue({});
      jest.doMock("@acme/platform-core/db", () => ({
        prisma: { subscriptionUsage: { findUniqueOrThrow } },
      }));
      const { getSubscriptionUsage } = await import("@acme/platform-core/subscriptionUsage");
      await getSubscriptionUsage("shop", "cust", "2023-10");
      expect(findUniqueOrThrow).toHaveBeenCalledWith({
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
      jest.doMock("@acme/platform-core/db", () => ({
        prisma: { subscriptionUsage: { upsert } },
      }));
      const { incrementSubscriptionUsage } = await import("@acme/platform-core/subscriptionUsage");
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

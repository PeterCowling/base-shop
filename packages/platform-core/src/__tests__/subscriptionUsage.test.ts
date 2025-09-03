/** @jest-environment node */

jest.mock("../db", () => ({
  prisma: { subscriptionUsage: { findUnique: jest.fn(), upsert: jest.fn() } },
}));

import { prisma } from "../db";
import { getSubscriptionUsage, incrementSubscriptionUsage } from "../subscriptionUsage";

const store: Record<string, any> = {};
const findUniqueMock = prisma.subscriptionUsage.findUnique as jest.Mock;
const upsertMock = prisma.subscriptionUsage.upsert as jest.Mock;

describe("subscriptionUsage", () => {
  const shop = "shop1";
  const customerId = "customer1";
  const month = "2023-10";

  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    findUniqueMock.mockReset();
    upsertMock.mockReset();

    findUniqueMock.mockImplementation(({ where }: any) => {
      const key = JSON.stringify(where.shop_customerId_month);
      return store[key] ?? null;
    });
    upsertMock.mockImplementation(({ where, create, update }: any) => {
      const key = JSON.stringify(where.shop_customerId_month);
      if (store[key]) {
        store[key].shipments += update.shipments.increment;
      } else {
        store[key] = { ...create };
      }
      return store[key];
    });
  });

  it("retrieves existing records", async () => {
    const key = JSON.stringify({ shop, customerId, month });
    store[key] = { id: "1", shop, customerId, month, shipments: 5 };

    const record = await getSubscriptionUsage(shop, customerId, month);

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { shop_customerId_month: { shop, customerId, month } },
    });
    expect(record).toEqual({ id: "1", shop, customerId, month, shipments: 5 });
  });

  it("uses default count and increments with custom values", async () => {
    // no existing record returns null
    expect(await getSubscriptionUsage(shop, customerId, month)).toBeNull();

    // default increment when no count is provided
    await incrementSubscriptionUsage(shop, customerId, month);
    expect(upsertMock).toHaveBeenCalledWith({
      where: { shop_customerId_month: { shop, customerId, month } },
      create: { shop, customerId, month, shipments: 1 },
      update: { shipments: { increment: 1 } },
    });
    expect(await getSubscriptionUsage(shop, customerId, month)).toEqual({
      shop,
      customerId,
      month,
      shipments: 1,
    });

    // custom increment
    await incrementSubscriptionUsage(shop, customerId, month, 2);
    expect(upsertMock).toHaveBeenLastCalledWith({
      where: { shop_customerId_month: { shop, customerId, month } },
      create: { shop, customerId, month, shipments: 2 },
      update: { shipments: { increment: 2 } },
    });
    expect(await getSubscriptionUsage(shop, customerId, month)).toEqual({
      shop,
      customerId,
      month,
      shipments: 3,
    });
  });
});

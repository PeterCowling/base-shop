/** @jest-environment node */

import { prisma } from "../db";
import { getSubscriptionUsage, incrementSubscriptionUsage } from "../subscriptionUsage";

jest.mock("../db", () => ({
  prisma: {
    subscriptionUsage: { findUniqueOrThrow: jest.fn(), upsert: jest.fn() },
  },
}));

const store: Record<string, any> = {};
const findUniqueOrThrowMock =
  prisma.subscriptionUsage.findUniqueOrThrow as jest.Mock;
const upsertMock = prisma.subscriptionUsage.upsert as jest.Mock;

describe("subscriptionUsage", () => {
  const shop = "shop1";
  const customerId = "customer1";
  const month = "2023-10";

  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    findUniqueOrThrowMock.mockReset();
    upsertMock.mockReset();

    findUniqueOrThrowMock.mockImplementation(({ where }: any) => {
      const key = JSON.stringify(where.shop_customerId_month);
      const record = store[key];
      if (!record) {
        throw new Error("Not found");
      }
      return record;
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

    expect(findUniqueOrThrowMock).toHaveBeenCalledWith({
      where: { shop_customerId_month: { shop, customerId, month } },
    });
    expect(record).toEqual({ id: "1", shop, customerId, month, shipments: 5 });
  });

  it("increments by 1 when no count is provided", async () => {
    await expect(
      getSubscriptionUsage(shop, customerId, month),
    ).rejects.toThrow();

    await incrementSubscriptionUsage(shop, customerId, month);

    expect(upsertMock).toHaveBeenCalledWith({
      where: { shop_customerId_month: { shop, customerId, month } },
      create: { shop, customerId, month, shipments: 1 },
      update: { shipments: { increment: 1 } },
    });
    expect(upsertMock).toHaveBeenCalledTimes(1);

    expect(await getSubscriptionUsage(shop, customerId, month)).toEqual({
      shop,
      customerId,
      month,
      shipments: 1,
    });
  });

  it("increments by the provided count", async () => {
    await incrementSubscriptionUsage(shop, customerId, month);
    upsertMock.mockClear();

    await incrementSubscriptionUsage(shop, customerId, month, 2);

    expect(upsertMock).toHaveBeenCalledWith({
      where: { shop_customerId_month: { shop, customerId, month } },
      create: { shop, customerId, month, shipments: 2 },
      update: { shipments: { increment: 2 } },
    });
    expect(upsertMock).toHaveBeenCalledTimes(1);

    expect(await getSubscriptionUsage(shop, customerId, month)).toEqual({
      shop,
      customerId,
      month,
      shipments: 3,
    });
  });
});

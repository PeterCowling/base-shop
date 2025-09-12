/** @jest-environment node */

import { createSubscriptionUsageDelegate } from "../db/stubs";

describe("subscriptionUsage delegate stub", () => {
  const where = { shop: "shop1", customerId: "cust1", month: "2023-10" };

  it("findUnique returns null when record is missing and the existing record when present", async () => {
    const delegate = createSubscriptionUsageDelegate();

    await expect(delegate.findUnique({ where })).resolves.toBeNull();

    await delegate.upsert({ where, create: { ...where, shipments: 1 }, update: { shipments: 2 } });

    await expect(delegate.findUnique({ where })).resolves.toEqual({
      ...where,
      shipments: 1,
    });

    const otherWhere = { ...where, customerId: "cust2" };
    await delegate.upsert({
      where: otherWhere,
      create: { ...otherWhere, shipments: 3 },
      update: { shipments: 4 },
    });

    await expect(delegate.findUnique({ where })).resolves.toEqual({
      ...where,
      shipments: 1,
    });
    await expect(delegate.findUnique({ where: otherWhere })).resolves.toEqual({
      ...otherWhere,
      shipments: 3,
    });
  });

  it("upsert creates new usage and updates existing records", async () => {
    const delegate = createSubscriptionUsageDelegate();

    const created = await delegate.upsert({
      where,
      create: { ...where, shipments: 1, returns: 2, notes: "orig" },
      update: { shipments: 0, returns: 0, notes: "" },
    });
    expect(created).toEqual({ ...where, shipments: 1, returns: 2, notes: "orig" });

    const updated = await delegate.upsert({
      where,
      create: { ...where, shipments: 0, returns: 0, notes: "" },
      update: { shipments: 5, notes: "updated" },
    });
    expect(updated).toEqual({ ...where, shipments: 5, returns: 2, notes: "updated" });
  });
});


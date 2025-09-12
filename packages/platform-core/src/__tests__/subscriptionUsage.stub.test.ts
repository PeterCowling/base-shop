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
  });

  it("upsert creates new usage and updates existing records", async () => {
    const delegate = createSubscriptionUsageDelegate();

    const created = await delegate.upsert({
      where,
      create: { ...where, shipments: 1 },
      update: { shipments: 0 },
    });
    expect(created).toEqual({ ...where, shipments: 1 });

    const updated = await delegate.upsert({
      where,
      create: { ...where, shipments: 0 },
      update: { shipments: 5 },
    });
    expect(updated).toEqual({ ...where, shipments: 5 });
  });
});


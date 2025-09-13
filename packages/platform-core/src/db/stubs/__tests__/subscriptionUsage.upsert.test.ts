/** @jest-environment node */
import { createSubscriptionUsageDelegate } from "../subscriptionUsage";

describe("createSubscriptionUsageDelegate.upsert", () => {
  it("creates a new record then updates it and handles missing lookups", async () => {
    const d = createSubscriptionUsageDelegate();

    // findUnique should return null when no record exists
    expect(await d.findUnique({ where: { id: "u1" } })).toBeNull();

    // creation branch of upsert
    const created = await d.upsert({
      where: { id: "u1" },
      update: { count: 999 },
      create: { id: "u1", count: 1 },
    });
    expect(created).toEqual({ id: "u1", count: 1 });

    // update branch of upsert
    const updated = await d.upsert({
      where: { id: "u1" },
      update: { count: 2 },
      create: { id: "u1", count: 2 },
    });
    expect(updated).toEqual({ id: "u1", count: 2 });

    // verify findUnique after update and for missing record
    expect(await d.findUnique({ where: { id: "u1" } })).toEqual({
      id: "u1",
      count: 2,
    });
    expect(await d.findUnique({ where: { id: "missing" } })).toBeNull();
  });
});

/** @jest-environment node */
import { createSubscriptionUsageDelegate } from "../subscriptionUsage";

describe("subscriptionUsage delegate", () => {
  it("upserts usage records", async () => {
    const d = createSubscriptionUsageDelegate();
    expect(await d.findUnique({ where: { id: "1" } })).toBeNull();
    await d.upsert({
      where: { id: "1" },
      update: {},
      create: { id: "1", count: 1 } as any,
    });
    const updated = await d.upsert({
      where: { id: "1" },
      update: { count: 2 } as any,
      create: { id: "1", count: 2 } as any,
    });
    expect((updated as any).count).toBe(2);
    const found = await d.findUnique({ where: { id: "1" } });
    expect((found as any)?.count).toBe(2);
  });
});


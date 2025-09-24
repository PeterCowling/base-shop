/** @jest-environment node */
import { createCustomerProfileDelegate } from "../customerProfile";

describe("customerProfile delegate", () => {
  it("supports find and upsert operations", async () => {
    const d = createCustomerProfileDelegate();
    await d.upsert({
      where: { customerId: "c1" },
      update: {},
      create: { customerId: "c1", name: "A", email: "a@test.com" },
    });
    await d.upsert({
      where: { customerId: "c2" },
      update: {},
      create: { customerId: "c2", name: "B", email: "a@test.com" },
    });
    expect(
      await d.findUnique({ where: { customerId: "c1" } })
    ).toHaveProperty("name", "A");
    expect(
      await d.findUnique({ where: { customerId: "missing" } })
    ).toBeNull();
    const first = await d.findFirst({
      where: { email: "a@test.com", NOT: { customerId: "c1" } },
    });
    expect(first?.customerId).toBe("c2");
    const updated = await d.upsert({
      where: { customerId: "c1" },
      update: { name: "A2" },
      create: { customerId: "c1", name: "A2", email: "a@test.com" },
    });
    expect(updated.name).toBe("A2");
    const created = await d.upsert({
      where: { customerId: "c3" },
      update: { name: "C" },
      create: { customerId: "c3", name: "C", email: "c@test.com" },
    });
    expect(created.name).toBe("C");
    const none = await d.findFirst({
      where: { email: "c@test.com", NOT: { customerId: "c3" } },
    });
    expect(none).toBeNull();
  });
});


/** @jest-environment node */
import { createCustomerMfaDelegate } from "../customerMfa";

describe("customerMfa delegate", () => {
  it("upsert creates a record when none exists", async () => {
    const d = createCustomerMfaDelegate();
    const created = await d.upsert({
      where: { customerId: "c1" },
      update: {},
      create: { customerId: "c1", secret: "s", enabled: false },
    });
    expect(created).toEqual({
      customerId: "c1",
      secret: "s",
      enabled: false,
    });
  });

  it("upsert updates an existing record", async () => {
    const d = createCustomerMfaDelegate();
    await d.upsert({
      where: { customerId: "c1" },
      update: {},
      create: { customerId: "c1", secret: "s", enabled: false },
    });
    const updated = await d.upsert({
      where: { customerId: "c1" },
      update: { enabled: true },
      create: { customerId: "c1", secret: "x", enabled: false },
    });
    expect(updated).toEqual({
      customerId: "c1",
      secret: "s",
      enabled: true,
    });
  });

  it("findUnique returns a record or null", async () => {
    const d = createCustomerMfaDelegate();
    await d.upsert({
      where: { customerId: "c1" },
      update: {},
      create: { customerId: "c1", secret: "s", enabled: false },
    });
    expect(await d.findUnique({ where: { customerId: "c1" } })).toEqual({
      customerId: "c1",
      secret: "s",
      enabled: false,
    });
    expect(await d.findUnique({ where: { customerId: "missing" } })).toBeNull();
  });

  it("updates records and throws when missing", async () => {
    const d = createCustomerMfaDelegate();
    await d.upsert({
      where: { customerId: "c1" },
      update: {},
      create: { customerId: "c1", secret: "s", enabled: false },
    });
    const afterUpdate = await d.update({
      where: { customerId: "c1" },
      data: { secret: "new" },
    });
    expect(afterUpdate.secret).toBe("new");
    await expect(
      d.update({ where: { customerId: "nope" }, data: { enabled: true } })
    ).rejects.toThrow("CustomerMfa not found");
  });
});


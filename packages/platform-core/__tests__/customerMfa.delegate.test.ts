import { createCustomerMfaDelegate } from "../src/db/stubs";

describe("createCustomerMfaDelegate", () => {
  const where = { customerId: "cust1" };

  it("upsert creates a new record when none exists", async () => {
    const delegate = createCustomerMfaDelegate();
    const record = await delegate.upsert({
      where,
      create: { ...where, secret: "sec1", enabled: false },
      update: { secret: "new", enabled: true },
    });
    expect(record).toEqual({ ...where, secret: "sec1", enabled: false });
  });

  it("upsert merges with an existing record", async () => {
    const delegate = createCustomerMfaDelegate();
    await delegate.upsert({
      where,
      create: { ...where, secret: "sec1", enabled: false },
      update: { secret: "new", enabled: true },
    });
    const merged = await delegate.upsert({
      where,
      create: { ...where, secret: "sec2", enabled: false },
      update: { enabled: true },
    });
    expect(merged).toEqual({ ...where, secret: "sec1", enabled: true });
  });

  it("update throws when customerId is missing", async () => {
    const delegate = createCustomerMfaDelegate();
    await expect(
      delegate.update({ where: { customerId: "missing" }, data: { enabled: true } })
    ).rejects.toThrow("CustomerMfa not found");
  });
});

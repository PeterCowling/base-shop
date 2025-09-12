/** @jest-environment node */

import { createCustomerMfaDelegate } from "../db/stubs";

describe("customerMfa delegate stub", () => {
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

  it("upsert updates an existing record", async () => {
    const delegate = createCustomerMfaDelegate();
    await delegate.upsert({
      where,
      create: { ...where, secret: "sec1", enabled: false },
      update: { secret: "new", enabled: true },
    });
    const updated = await delegate.upsert({
      where,
      create: { ...where, secret: "sec2", enabled: false },
      update: { enabled: true },
    });
    expect(updated).toEqual({ ...where, secret: "sec1", enabled: true });
  });

  it("findUnique returns the record or null for missing IDs", async () => {
    const delegate = createCustomerMfaDelegate();
    await expect(delegate.findUnique({ where })).resolves.toBeNull();
    await delegate.upsert({
      where,
      create: { ...where, secret: "sec1", enabled: false },
      update: { secret: "new", enabled: true },
    });
    await expect(delegate.findUnique({ where })).resolves.toEqual({
      ...where,
      secret: "sec1",
      enabled: false,
    });
  });

  it("update modifies a record and throws on missing customerId", async () => {
    const delegate = createCustomerMfaDelegate();
    await delegate.upsert({
      where,
      create: { ...where, secret: "sec1", enabled: false },
      update: { secret: "new", enabled: true },
    });
    await expect(
      delegate.update({ where, data: { enabled: true } }),
    ).resolves.toEqual({ ...where, secret: "sec1", enabled: true });
    await expect(
      delegate.update({ where: { customerId: "missing" }, data: { enabled: true } }),
    ).rejects.toThrow("CustomerMfa not found");
  });
});


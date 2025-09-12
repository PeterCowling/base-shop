/** @jest-environment node */

import { createTestPrismaStub } from "../db";
import { createCustomerMfaDelegate } from "../db/stubs";

describe("createTestPrismaStub inventoryItem", () => {
  it("throws when deleting a nonexistent inventory item", async () => {
    const prisma = createTestPrismaStub();

    await expect(
      prisma.inventoryItem.delete({
        where: {
          shopId_sku_variantKey: { shopId: "s", sku: "sku", variantKey: "v" },
        },
      }),
    ).rejects.toThrow("InventoryItem not found");
  });

  it("upserts a record when inventory item is missing", async () => {
    const prisma = createTestPrismaStub();
    const where = {
      shopId_sku_variantKey: { shopId: "s", sku: "sku", variantKey: "v" },
    };

    expect(await prisma.inventoryItem.findUnique({ where })).toBeNull();

    const create = { shopId: "s", sku: "sku", variantKey: "v", quantity: 1 };
    const result = await prisma.inventoryItem.upsert({
      where,
      update: { quantity: 2 },
      create,
    });

    expect(result).toMatchObject(create);
  });
});

describe("createCustomerMfaDelegate", () => {
  it("upserts new and existing records", async () => {
    const delegate = createCustomerMfaDelegate();
    const where = { customerId: "c1" };
    const create = { customerId: "c1", secret: "s", enabled: false };

    const created = await delegate.upsert({ where, create, update: { enabled: true } });
    expect(created).toEqual(create);

    const updated = await delegate.upsert({ where, create, update: { enabled: true } });
    expect(updated).toEqual({ ...create, enabled: true });
  });

  it("finds existing and missing records", async () => {
    const delegate = createCustomerMfaDelegate();
    const where = { customerId: "c1" };
    const create = { customerId: "c1", secret: "s", enabled: false };
    await delegate.upsert({ where, create, update: {} });

    expect(await delegate.findUnique({ where })).toEqual(create);
    expect(await delegate.findUnique({ where: { customerId: "missing" } })).toBeNull();
  });

  it("updates existing records and throws when missing", async () => {
    const delegate = createCustomerMfaDelegate();
    const where = { customerId: "c1" };
    const create = { customerId: "c1", secret: "s", enabled: false };
    await delegate.upsert({ where, create, update: {} });

    const result = await delegate.update({ where, data: { enabled: true } });
    expect(result).toMatchObject({ enabled: true });

    await expect(
      delegate.update({ where: { customerId: "missing" }, data: { enabled: true } }),
    ).rejects.toThrow("CustomerMfa not found");
  });
});


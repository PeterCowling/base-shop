/** @jest-environment node */

import { createTestPrismaStub } from "../db";

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

describe("createTestPrismaStub customerProfile", () => {
  it("findUnique locates records by customerId", async () => {
    const prisma = createTestPrismaStub();
    const profile = {
      customerId: "c1",
      name: "Alice",
      email: "a@b.com",
    };

    await prisma.customerProfile.upsert({
      where: { customerId: "c1" },
      update: {},
      create: profile,
    });

    await expect(
      prisma.customerProfile.findUnique({ where: { customerId: "c1" } }),
    ).resolves.toMatchObject(profile);
  });

  it("findFirst honors email and NOT.customerId filters", async () => {
    const prisma = createTestPrismaStub();
    await prisma.customerProfile.upsert({
      where: { customerId: "c1" },
      update: {},
      create: { customerId: "c1", name: "Alice", email: "a@b.com" },
    });
    await prisma.customerProfile.upsert({
      where: { customerId: "c2" },
      update: {},
      create: { customerId: "c2", name: "Bob", email: "a@b.com" },
    });

    const found = await prisma.customerProfile.findFirst({
      where: { email: "a@b.com", NOT: { customerId: "c1" } },
    });

    expect(found?.customerId).toBe("c2");
  });

  it("upsert creates and updates records appropriately", async () => {
    const prisma = createTestPrismaStub();
    const create = { customerId: "c1", name: "Alice", email: "a@b.com" };

    const created = await prisma.customerProfile.upsert({
      where: { customerId: "c1" },
      update: {},
      create,
    });
    expect(created).toMatchObject(create);

    const updated = await prisma.customerProfile.upsert({
      where: { customerId: "c1" },
      update: { name: "Alice2" },
      create,
    });
    expect(updated.name).toBe("Alice2");

    const found = await prisma.customerProfile.findUnique({
      where: { customerId: "c1" },
    });
    expect(found?.name).toBe("Alice2");
  });
});


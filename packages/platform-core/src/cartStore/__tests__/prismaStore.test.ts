// TASK-06: Unit tests for PrismaCartStore
// Mocks Prisma at the db module boundary — no real DB required.

import type { CartState } from "../../cart";
import { PrismaCartStore } from "../prismaStore";

const mockCartCreate = jest.fn();
const mockCartFindUnique = jest.fn();
const mockCartUpsert = jest.fn();
const mockCartDelete = jest.fn();

jest.mock("../../db", () => ({
  prisma: {
    cart: {
      create: (...args: unknown[]) => mockCartCreate(...args),
      findUnique: (...args: unknown[]) => mockCartFindUnique(...args),
      upsert: (...args: unknown[]) => mockCartUpsert(...args),
      delete: (...args: unknown[]) => mockCartDelete(...args),
    },
  },
}));

const TTL = 60 * 60 * 24 * 30; // 30 days

function makeStore() {
  return new PrismaCartStore(TTL);
}

function futureExpiry(): Date {
  return new Date(Date.now() + TTL * 1000);
}

function pastExpiry(): Date {
  return new Date(Date.now() - 1000);
}

function makeCartRow(id: string, items: CartState = {}, overrides: { expiresAt?: Date } = {}) {
  return {
    id,
    items,
    expiresAt: overrides.expiresAt ?? futureExpiry(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PrismaCartStore.createCart", () => {
  it("TC-01: creates a Cart row in DB and returns the generated id", async () => {
    const store = makeStore();
    const fakeId = "cuid-abc-123";
    mockCartCreate.mockResolvedValueOnce(makeCartRow(fakeId, {}));

    const id = await store.createCart();

    expect(mockCartCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ items: {}, expiresAt: expect.any(Date) }),
      })
    );
    expect(id).toBe(fakeId);
  });
});

describe("PrismaCartStore.getCart", () => {
  it("TC-02: returns CartState for a valid non-expired cart", async () => {
    const store = makeStore();
    const items: CartState = { sku1: { sku: { id: "sku1" } as any, qty: 2 } };
    mockCartFindUnique.mockResolvedValueOnce(makeCartRow("cart-1", items));

    const result = await store.getCart("cart-1");

    expect(result).toEqual(items);
  });

  it("TC-03: returns {} for an expired cart and deletes the record", async () => {
    const store = makeStore();
    mockCartFindUnique.mockResolvedValueOnce(makeCartRow("cart-1", { someItem: { qty: 1 } as any }, { expiresAt: pastExpiry() }));
    mockCartDelete.mockResolvedValueOnce(undefined);

    const result = await store.getCart("cart-1");

    expect(result).toEqual({});
    expect(mockCartDelete).toHaveBeenCalledWith({ where: { id: "cart-1" } });
  });

  it("TC-04: returns {} when cart not found (findUnique returns null)", async () => {
    const store = makeStore();
    mockCartFindUnique.mockResolvedValueOnce(null);

    const result = await store.getCart("nonexistent");

    expect(result).toEqual({});
  });
});

describe("PrismaCartStore.incrementQty", () => {
  it("TC-05: adds an item to an existing cart", async () => {
    const store = makeStore();
    const sku = { id: "sku1" } as any;
    const existingItems: CartState = {};
    mockCartFindUnique.mockResolvedValueOnce(makeCartRow("cart-1", existingItems));
    mockCartUpsert.mockResolvedValueOnce(undefined);

    const result = await store.incrementQty("cart-1", sku, 1);

    expect(result["sku1"]).toMatchObject({ qty: 1, sku });
  });

  it("TC-06: creates cart implicitly when no row exists and increments", async () => {
    const store = makeStore();
    const sku = { id: "sku2" } as any;
    // getCart returns {} for non-existent (findUnique returns null)
    mockCartFindUnique.mockResolvedValueOnce(null);
    mockCartUpsert.mockResolvedValueOnce(undefined);

    const result = await store.incrementQty("new-cart", sku, 3);

    expect(result["sku2"]).toMatchObject({ qty: 3 });
    expect(mockCartUpsert).toHaveBeenCalled();
  });

  it("accumulates qty on repeated incrementQty", async () => {
    const store = makeStore();
    const sku = { id: "sku3" } as any;
    const existingItems: CartState = { sku3: { sku, qty: 2 } as any };
    mockCartFindUnique.mockResolvedValueOnce(makeCartRow("cart-1", existingItems));
    mockCartUpsert.mockResolvedValueOnce(undefined);

    const result = await store.incrementQty("cart-1", sku, 3);

    expect(result["sku3"].qty).toBe(5);
  });
});

describe("PrismaCartStore.setQty / removeItem", () => {
  it("TC-07: removeItem removes item from cart", async () => {
    const store = makeStore();
    const sku = { id: "sku4" } as any;
    const existingItems: CartState = { sku4: { sku, qty: 2 } as any };
    mockCartFindUnique.mockResolvedValueOnce(makeCartRow("cart-1", existingItems));
    mockCartUpsert.mockResolvedValueOnce(undefined);

    const result = await store.removeItem("cart-1", "sku4");

    expect(result).toEqual({});
    expect(result).not.toHaveProperty("sku4");
  });

  it("removeItem returns null when item key not in cart", async () => {
    const store = makeStore();
    const existingItems: CartState = {};
    mockCartFindUnique.mockResolvedValueOnce(makeCartRow("cart-1", existingItems));

    const result = await store.removeItem("cart-1", "nonexistent-sku");

    expect(result).toBeNull();
  });

  it("setQty updates qty for existing item", async () => {
    const store = makeStore();
    const sku = { id: "sku5" } as any;
    const existingItems: CartState = { sku5: { sku, qty: 1 } as any };
    mockCartFindUnique.mockResolvedValueOnce(makeCartRow("cart-1", existingItems));
    mockCartUpsert.mockResolvedValueOnce(undefined);

    const result = await store.setQty("cart-1", "sku5", 7);

    expect(result?.["sku5"]?.qty).toBe(7);
  });

  it("setQty with qty=0 removes the item", async () => {
    const store = makeStore();
    const sku = { id: "sku6" } as any;
    const existingItems: CartState = { sku6: { sku, qty: 3 } as any };
    mockCartFindUnique.mockResolvedValueOnce(makeCartRow("cart-1", existingItems));
    mockCartUpsert.mockResolvedValueOnce(undefined);

    const result = await store.setQty("cart-1", "sku6", 0);

    expect(result).toEqual({});
  });

  it("setQty returns null when item does not exist in cart", async () => {
    const store = makeStore();
    mockCartFindUnique.mockResolvedValueOnce(makeCartRow("cart-1", {}));

    const result = await store.setQty("cart-1", "missing-sku", 2);

    expect(result).toBeNull();
  });
});

describe("PrismaCartStore.deleteCart", () => {
  it("TC-08: deletes an existing cart row", async () => {
    const store = makeStore();
    mockCartDelete.mockResolvedValueOnce({ id: "cart-1" });

    await store.deleteCart("cart-1");

    expect(mockCartDelete).toHaveBeenCalledWith({ where: { id: "cart-1" } });
  });

  it("TC-09: no-op when cart not found (swallows P2025)", async () => {
    const store = makeStore();
    // Simulate Prisma P2025 record not found
    const p2025 = Object.assign(new Error("Record not found"), { code: "P2025" });
    mockCartDelete.mockRejectedValueOnce(p2025);

    // Should not throw
    await expect(store.deleteCart("nonexistent")).resolves.toBeUndefined();
  });
});

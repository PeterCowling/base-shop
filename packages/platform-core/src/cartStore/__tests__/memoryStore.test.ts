import { jest } from "@jest/globals";

import { MemoryCartStore } from "../memoryStore";
import type { SKU } from "@acme/types";

describe("MemoryCartStore", () => {
  const sku: SKU = { id: "sku1" } as SKU;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("createCart returns a UUID and initializes empty cart", async () => {
    const store = new MemoryCartStore(60);
    const id = await store.createCart();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(await store.getCart(id)).toEqual({});
  });

  it("getCart returns empty for new cart and purges expired entries", async () => {
    const store = new MemoryCartStore(1);
    const id = await store.createCart();
    expect(await store.getCart(id)).toEqual({});
    jest.setSystemTime(0);
    await store.setCart(id, { [sku.id!]: { sku, qty: 1 } });
    jest.setSystemTime(2000);
    expect(await store.getCart(id)).toEqual({});
    expect(await store.getCart(id)).toEqual({});
  });

  describe("incrementQty", () => {
    it("merges quantities without size and resets expiry", async () => {
      jest.setSystemTime(0);
      const store = new MemoryCartStore(1);
      await store.incrementQty("cart", sku, 1);
      jest.setSystemTime(500);
      await store.incrementQty("cart", sku, 2);
      expect(await store.getCart("cart")).toEqual({
        [sku.id!]: { sku, qty: 3 },
      });
      jest.setSystemTime(1500);
      expect(await store.getCart("cart")).toEqual({
        [sku.id!]: { sku, qty: 3 },
      });
    });

    it("merges quantities with size", async () => {
      const store = new MemoryCartStore(60);
      const size = "L";
      await store.incrementQty("cart", sku, 1, size);
      await store.incrementQty("cart", sku, 2, size);
      expect(await store.getCart("cart")).toEqual({
        [`${sku.id}:${size}`]: { sku, size, qty: 3 },
      });
    });
  });

  describe("setQty", () => {
    it("updates quantity", async () => {
      const store = new MemoryCartStore(60);
      await store.setCart("cart", { [sku.id!]: { sku, qty: 1 } });
      const cart = await store.setQty("cart", sku.id!, 5);
      expect(cart).toEqual({ [sku.id!]: { sku, qty: 5 } });
    });

    it("returns null when cart expired", async () => {
      jest.setSystemTime(0);
      const store = new MemoryCartStore(1);
      await store.setCart("cart", { [sku.id!]: { sku, qty: 1 } });
      jest.setSystemTime(2000);
      expect(await store.setQty("cart", sku.id!, 5)).toBeNull();
    });

    it("removes line when qty is 0", async () => {
      const store = new MemoryCartStore(60);
      await store.setCart("cart", { [sku.id!]: { sku, qty: 3 } });
      const cart = await store.setQty("cart", sku.id!, 0);
      expect(cart).toEqual({});
      expect(await store.getCart("cart")).toEqual({});
    });
  });

  describe("removeItem", () => {
    it("deletes specified line", async () => {
      const store = new MemoryCartStore(60);
      await store.setCart("cart", { [sku.id!]: { sku, qty: 1 } });
      const cart = await store.removeItem("cart", sku.id!);
      expect(cart).toEqual({});
    });

    it("returns null when line missing", async () => {
      const store = new MemoryCartStore(60);
      expect(await store.removeItem("cart", sku.id!)).toBeNull();
    });

    it("returns null and purges expired cart", async () => {
      jest.setSystemTime(0);
      const store = new MemoryCartStore(1);
      await store.setCart("cart", { [sku.id!]: { sku, qty: 1 } });
      jest.setSystemTime(2000);
      expect(await store.removeItem("cart", sku.id!)).toBeNull();
      expect(await store.getCart("cart")).toEqual({});
    });
  });

  it("supports concurrent increments without race conditions", async () => {
    const store = new MemoryCartStore(60);
    await Promise.all(Array.from({ length: 5 }, () => store.incrementQty("c", sku, 1)));
    const cart = await store.getCart("c");
    expect(cart[sku.id!].qty).toBe(5);
  });
});


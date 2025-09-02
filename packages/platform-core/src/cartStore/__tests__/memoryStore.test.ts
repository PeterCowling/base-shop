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

  it("getCart returns empty after expiration", async () => {
    jest.setSystemTime(0);
    const store = new MemoryCartStore(1);
    await store.setCart("cart", { [sku.id!]: { sku, qty: 1 } });
    jest.setSystemTime(2000);
    expect(await store.getCart("cart")).toEqual({});
  });

  it("incrementQty creates cart when missing", async () => {
    const store = new MemoryCartStore(60);
    const cart = await store.incrementQty("cart", sku, 2);
    expect(cart).toEqual({ [sku.id!]: { sku, qty: 2 } });
    expect(await store.getCart("cart")).toEqual({
      [sku.id!]: { sku, qty: 2 },
    });
  });

  describe("setQty", () => {
    it("returns null when cart expired", async () => {
      jest.setSystemTime(0);
      const store = new MemoryCartStore(1);
      await store.setCart("cart", { [sku.id!]: { sku, qty: 1 } });
      jest.setSystemTime(2000);
      expect(await store.setQty("cart", sku.id!, 5)).toBeNull();
    });

    it("returns null when line absent", async () => {
      const store = new MemoryCartStore(60);
      await store.setCart("cart", {});
      expect(await store.setQty("cart", sku.id!, 1)).toBeNull();
    });

    it("deletes line when qty is 0", async () => {
      const store = new MemoryCartStore(60);
      await store.setCart("cart", { [sku.id!]: { sku, qty: 3 } });
      const cart = await store.setQty("cart", sku.id!, 0);
      expect(cart).toEqual({});
      expect(await store.getCart("cart")).toEqual({});
    });
  });

  describe("removeItem", () => {
    it("returns null when cart missing", async () => {
      const store = new MemoryCartStore(60);
      expect(await store.removeItem("missing", sku.id!)).toBeNull();
    });

    it("returns null when line missing", async () => {
      const store = new MemoryCartStore(60);
      await store.setCart("cart", {});
      expect(await store.removeItem("cart", sku.id!)).toBeNull();
    });
  });
});


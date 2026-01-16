import {
  normalizeQuantity,
  flattenInventoryItem,
  expandInventoryItem,
  computeAvailability,
  applyInventoryBatch,
} from "@acme/platform-core/utils/inventory";
import type { InventoryItem } from "@acme/platform-core/types/inventory";
import type { RawInventoryItem } from "@acme/types";

describe("normalizeQuantity", () => {
  it("handles various units and invalid input", () => {
    expect(normalizeQuantity("5")).toBe(5);
    expect(normalizeQuantity(3, "pair")).toBe(6);
    expect(normalizeQuantity(2.5, "dozen")).toBe(30);
    expect(normalizeQuantity("abc")).toBeNaN();
  });
});

describe("flattenInventoryItem", () => {
  it("flattens variant attributes and low stock", () => {
    const item: InventoryItem = {
      sku: "sku1",
      productId: "prod1",
      quantity: 4,
      lowStockThreshold: 2,
      variantAttributes: { color: "red", size: "L" },
    };
    expect(flattenInventoryItem(item)).toEqual({
      sku: "sku1",
      productId: "prod1",
      quantity: 4,
      lowStockThreshold: 2,
      "variant.color": "red",
      "variant.size": "L",
    });
  });
});

describe("expandInventoryItem", () => {
  it("returns input when given a valid InventoryItem", () => {
    const item: InventoryItem = {
      sku: "s1",
      productId: "p1",
      quantity: 2,
      variantAttributes: { color: "blue" },
    };
    expect(expandInventoryItem(item)).toEqual(item);
  });

  it("throws on InventoryItem with negative quantity", () => {
    const item: InventoryItem = {
      sku: "s1",
      productId: "p1",
      quantity: -1,
      variantAttributes: {},
    };
    expect(() => expandInventoryItem(item)).toThrow(
      "quantity must be greater than or equal to 0",
    );
  });

  it("throws on InventoryItem with empty productId", () => {
    const item: InventoryItem = {
      sku: "s1",
      productId: "",
      quantity: 1,
      variantAttributes: {},
    };
    expect(() => expandInventoryItem(item)).toThrow("productId is required");
  });

  it("throws when raw input missing or blank sku", () => {
    const missing: RawInventoryItem = {
      productId: "p1",
      quantity: 1,
    } as any;
    const blank: RawInventoryItem = {
      sku: "   ",
      productId: "p1",
      quantity: 1,
    } as any;
    expect(() => expandInventoryItem(missing)).toThrow("sku is required");
    expect(() => expandInventoryItem(blank)).toThrow("sku is required");
  });

  it("throws when raw input missing or blank productId", () => {
    const missing: RawInventoryItem = {
      sku: "s1",
      quantity: 1,
    } as any;
    const blank: RawInventoryItem = {
      sku: "s1",
      productId: " ",
      quantity: 1,
    } as any;
    expect(() => expandInventoryItem(missing)).toThrow("productId is required");
    expect(() => expandInventoryItem(blank)).toThrow("productId is required");
  });

  it("throws when quantity is negative or non-finite", () => {
    const negative: RawInventoryItem = {
      sku: "s1",
      productId: "p1",
      quantity: -1,
    } as any;
    const nonFinite: RawInventoryItem = {
      sku: "s1",
      productId: "p1",
      quantity: "abc",
    } as any;
    expect(() => expandInventoryItem(negative)).toThrow(
      "quantity must be greater than or equal to 0",
    );
    expect(() => expandInventoryItem(nonFinite)).toThrow(
      "quantity must be greater than or equal to 0",
    );
  });

  it("normalizes unit and variant fields", () => {
    const raw: RawInventoryItem = {
      sku: "s1",
      productId: "p1",
      quantity: "3",
      lowStockThreshold: "1",
      unit: "pair",
      "variant.color": "red",
    } as any;
    expect(expandInventoryItem(raw)).toEqual({
      sku: "s1",
      productId: "p1",
      quantity: 6,
      lowStockThreshold: 2,
      variantAttributes: { color: "red" },
    });
  });
});

describe("computeAvailability", () => {
  it("computes availability without backorder", () => {
    const res = computeAvailability(10, 3, 4);
    expect(res).toEqual({ reserved: 3, available: 7, canFulfill: true });
  });

  it("disallows fulfillment when backorder disabled", () => {
    const res = computeAvailability(2, 0, 5, false);
    expect(res).toEqual({ reserved: 0, available: 2, canFulfill: false });
  });

  it("allows fulfillment when backorder enabled", () => {
    const res = computeAvailability(2, 0, 5, true);
    expect(res).toEqual({ reserved: 0, available: 2, canFulfill: true });
  });
});

describe("applyInventoryBatch", () => {
  it("applies deltas and reports low stock", () => {
    const items: InventoryItem[] = [
      {
        sku: "a",
        productId: "p1",
        quantity: 5,
        lowStockThreshold: 2,
        variantAttributes: {},
      },
      {
        sku: "b",
        productId: "p2",
        quantity: 3,
        lowStockThreshold: 2,
        variantAttributes: {},
      },
    ];

    const updates = [
      { sku: "a", delta: -4 },
      { sku: "a", delta: 1 },
      { sku: "b", delta: -5 },
    ];

    const { updated, lowStock } = applyInventoryBatch(items, updates);
    expect(updated.find((i) => i.sku === "a")?.quantity).toBe(2);
    expect(updated.find((i) => i.sku === "b")?.quantity).toBe(0);
    expect(lowStock.map((i) => i.sku).sort()).toEqual(["a", "b"]);
  });
});

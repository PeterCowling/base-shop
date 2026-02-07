import type { InventoryItem } from "../../types/inventory";
import {
  applyInventoryBatch,
  computeAvailability,
  expandInventoryItem,
  flattenInventoryItem,
  normalizeQuantity,
  type RawInventoryItem,
} from "../inventory";

describe("normalizeQuantity", () => {
  it("handles pair units", () => {
    expect(normalizeQuantity(3, "pair")).toBe(6);
  });

  it("handles dozen units", () => {
    expect(normalizeQuantity(2, "dozen")).toBe(24);
  });

  it("returns NaN for invalid values", () => {
    expect(Number.isNaN(normalizeQuantity("foo"))).toBe(true);
  });
});

describe("flattenInventoryItem", () => {
  it("includes lowStockThreshold when provided", () => {
    const item: InventoryItem = {
      sku: "sku1",
      productId: "prod1",
      quantity: 5,
      variantAttributes: { color: "red" },
      lowStockThreshold: 2,
    };

    expect(flattenInventoryItem(item)).toEqual({
      sku: "sku1",
      productId: "prod1",
      quantity: 5,
      "variant.color": "red",
      lowStockThreshold: 2,
    });
  });

  it("omits lowStockThreshold when undefined", () => {
    const item: InventoryItem = {
      sku: "sku2",
      productId: "prod2",
      quantity: 3,
      variantAttributes: { size: "M" },
    };

    const flat = flattenInventoryItem(item);
    expect(flat).toEqual({
      sku: "sku2",
      productId: "prod2",
      quantity: 3,
      "variant.size": "M",
    });
    expect(flat).not.toHaveProperty("lowStockThreshold");
  });
});

describe("expandInventoryItem", () => {
  it("returns input when given a complete InventoryItem", () => {
    const item: InventoryItem = {
      sku: "sku3",
      productId: "prod3",
      quantity: 4,
      variantAttributes: { color: "blue" },
      lowStockThreshold: 1,
    };

    expect(expandInventoryItem(item)).toEqual(item);
  });

  it("converts variant.* keys to variantAttributes", () => {
    const raw: RawInventoryItem = {
      sku: "sku4",
      productId: "prod4",
      quantity: "7",
      "variant.size": "L",
      "variant.color": "green",
    };

    expect(expandInventoryItem(raw)).toEqual({
      sku: "sku4",
      productId: "prod4",
      quantity: 7,
      variantAttributes: { size: "L", color: "green" },
    });
  });

  it("handles raw objects with variantAttributes", () => {
    const raw: RawInventoryItem = {
      sku: "sku5",
      productId: "prod5",
      quantity: "2",
      variantAttributes: { color: "black", size: "S" },
    };

    expect(expandInventoryItem(raw)).toEqual({
      sku: "sku5",
      productId: "prod5",
      quantity: 2,
      variantAttributes: { color: "black", size: "S" },
    });
  });

  it("throws when quantity is non-numeric", () => {
    const raw: RawInventoryItem = {
      sku: "sku6",
      productId: "prod6",
      quantity: "not-a-number",
      variantAttributes: { color: "white" },
    };

    expect(() => expandInventoryItem(raw)).toThrow();
  });

  it("throws when quantity is negative", () => {
    const raw: RawInventoryItem = {
      sku: "sku7",
      productId: "prod7",
      quantity: "-1",
      variantAttributes: { color: "white" },
    };

    expect(() => expandInventoryItem(raw)).toThrow();
  });

  it("throws when sku is missing", () => {
    const raw: RawInventoryItem = {
      productId: "prod8",
      quantity: "1",
      variantAttributes: { color: "white" },
    } as any;

    expect(() => expandInventoryItem(raw)).toThrow();
  });

  it("throws when productId is missing", () => {
    const raw: RawInventoryItem = {
      sku: "sku8",
      quantity: "1",
      variantAttributes: { color: "white" },
    } as any;

    expect(() => expandInventoryItem(raw)).toThrow();
  });

  it("throws when quantity is missing", () => {
    const raw: RawInventoryItem = {
      sku: "sku9",
      productId: "prod9",
      variantAttributes: { color: "white" },
    } as any;

    expect(() => expandInventoryItem(raw)).toThrow();
  });

  it("throws when lowStockThreshold is invalid", () => {
    const raw: RawInventoryItem = {
      sku: "sku10",
      productId: "prod10",
      quantity: "1",
      lowStockThreshold: "-2",
      variantAttributes: { color: "white" },
    };

    expect(() => expandInventoryItem(raw)).toThrow();
  });
});

describe("computeAvailability", () => {
  it("accounts for reserved and requested quantities", () => {
    expect(computeAvailability(10, 2, 5)).toEqual({
      reserved: 2,
      available: 8,
      canFulfill: true,
    });

    expect(computeAvailability(5, 2, 4)).toEqual({
      reserved: 2,
      available: 3,
      canFulfill: false,
    });
  });

  it("allows backorders when enabled", () => {
    expect(computeAvailability(5, 2, 4, true)).toEqual({
      reserved: 2,
      available: 3,
      canFulfill: true,
    });
  });
});

describe("applyInventoryBatch", () => {
  it("updates quantities and detects low stock", () => {
    const items: InventoryItem[] = [
      {
        sku: "a",
        productId: "prodA",
        quantity: 5,
        lowStockThreshold: 2,
        variantAttributes: {},
      },
      {
        sku: "b",
        productId: "prodB",
        quantity: 1,
        variantAttributes: {},
      },
    ];

    const { updated, lowStock } = applyInventoryBatch(items, [
      { sku: "a", delta: -4 },
      { sku: "b", delta: 3 },
    ]);

    const itemA = updated.find((i) => i.sku === "a")!;
    const itemB = updated.find((i) => i.sku === "b")!;
    expect(itemA.quantity).toBe(1);
    expect(itemB.quantity).toBe(4);
    expect(lowStock).toEqual([itemA]);
  });
});


// packages/platform-core/src/utils/inventory.test.ts
import {
  applyInventoryBatch,
  computeAvailability,
  expandInventoryItem,
  flattenInventoryItem,
} from "../../inventory";
import type { InventoryItem } from "../../types/inventory";

describe("flattenInventoryItem", () => {
  it("flattens items with full variant attributes", () => {
    const item: InventoryItem = {
      sku: "sku1",
      productId: "prod1",
      quantity: 10,
      variantAttributes: { size: "M", color: "blue" },
      lowStockThreshold: 2,
    };

    expect(flattenInventoryItem(item)).toEqual({
      sku: "sku1",
      productId: "prod1",
      "variant.size": "M",
      "variant.color": "blue",
      quantity: 10,
      lowStockThreshold: 2,
    });
  });

  it("flattens items with partial variant attributes", () => {
    const item: InventoryItem = {
      sku: "sku2",
      productId: "prod2",
      quantity: 5,
      variantAttributes: { size: "L" },
    };

    expect(flattenInventoryItem(item)).toEqual({
      sku: "sku2",
      productId: "prod2",
      "variant.size": "L",
      quantity: 5,
    });
  });

  it("flattens items with missing variant attributes", () => {
    const item: InventoryItem = {
      sku: "sku3",
      productId: "prod3",
      quantity: 1,
      variantAttributes: {},
    };

    expect(flattenInventoryItem(item)).toEqual({
      sku: "sku3",
      productId: "prod3",
      quantity: 1,
    });
  });

  it("omits lowStockThreshold when undefined", () => {
    const item: InventoryItem = {
      sku: "sku4",
      productId: "prod4",
      quantity: 7,
      variantAttributes: {},
      lowStockThreshold: undefined,
    };

    expect(flattenInventoryItem(item)).toEqual({
      sku: "sku4",
      productId: "prod4",
      quantity: 7,
    });
  });
});

describe("expandInventoryItem", () => {
  it("expands flattened items and coerces strings to numbers", () => {
    const raw = {
      sku: "sku1",
      productId: 1001,
      quantity: "5",
      "variant.size": "M",
      "variant.color": "blue",
      lowStockThreshold: "2",
    };

    expect(expandInventoryItem(raw)).toEqual({
      sku: "sku1",
      productId: "1001",
      quantity: 5,
      variantAttributes: { size: "M", color: "blue" },
      lowStockThreshold: 2,
    });
  });

  it("throws when productId is missing", () => {
    const raw = {
      sku: "sku2",
      quantity: 3,
      variantAttributes: { size: "L", color: "", material: undefined },
    };

    expect(() => expandInventoryItem(raw)).toThrow();
  });

  it("expands items with missing variant attributes", () => {
    const raw = { sku: "sku3", productId: "prod3", quantity: 1 };

    expect(expandInventoryItem(raw)).toEqual({
      sku: "sku3",
      productId: "prod3",
      quantity: 1,
      variantAttributes: {},
    });
  });

  it("is idempotent when given a valid InventoryItem", () => {
    const item: InventoryItem = {
      sku: "sku6",
      productId: "prod6",
      quantity: 4,
      variantAttributes: { color: "red" },
      lowStockThreshold: 1,
    };

    expect(expandInventoryItem(item)).toEqual(item);
  });

  it("omits lowStockThreshold when provided as an empty string", () => {
    const raw = {
      sku: "sku7",
      productId: "prod7",
      quantity: 3,
      "variant.size": "S",
      lowStockThreshold: "",
    };

    expect(expandInventoryItem(raw)).toEqual({
      sku: "sku7",
      productId: "prod7",
      quantity: 3,
      variantAttributes: { size: "S" },
    });
  });

  it("throws on invalid numeric values", () => {
    expect(() =>
      expandInventoryItem({
        sku: "sku4",
        productId: "prod4",
        quantity: "-1",
        variantAttributes: {},
      })
    ).toThrow();

    expect(() =>
      expandInventoryItem({
        sku: "sku5",
        productId: "prod5",
        quantity: "5",
        variantAttributes: {},
        lowStockThreshold: "bad",
      })
    ).toThrow();
  });

  it("allows zero quantity", () => {
    const item = expandInventoryItem({
      sku: "sku8",
      productId: "prod8",
      quantity: 0,
      variantAttributes: {},
    });
    expect(item.quantity).toBe(0);
  });

  it("rejects missing sku or productId", () => {
    expect(() =>
      expandInventoryItem({
        productId: "prod9",
        quantity: 1,
        variantAttributes: {},
      }),
    ).toThrow();

    expect(() =>
      expandInventoryItem({
        sku: "sku9",
        quantity: 1,
        variantAttributes: {},
      }),
    ).toThrow();
  });

  it("rounds fractional quantities and converts units", () => {
    const item = expandInventoryItem({
      sku: "sku10",
      productId: "prod10",
      quantity: "1.5",
      unit: "dozen",
      variantAttributes: {},
    });
    expect(item.quantity).toBe(18);
  });
});

describe("stock calculations", () => {
  it("computes reserved vs available stock", () => {
    expect(computeAvailability(10, 4, 2)).toEqual({
      reserved: 4,
      available: 6,
      canFulfill: true,
    });
  });

  it("handles backorder scenarios", () => {
    expect(computeAvailability(5, 5, 1, false).canFulfill).toBe(false);
    expect(computeAvailability(5, 5, 1, true).canFulfill).toBe(true);
  });
});

describe("batch updates and low-stock warnings", () => {
  it("applies updates and identifies low stock", () => {
    const items: InventoryItem[] = [
      {
        sku: "a",
        productId: "a",
        quantity: 5,
        variantAttributes: {},
        lowStockThreshold: 2,
      },
      {
        sku: "b",
        productId: "b",
        quantity: 1,
        variantAttributes: {},
        lowStockThreshold: 1,
      },
    ];

    const { updated, lowStock } = applyInventoryBatch(items, [
      { sku: "a", delta: -4 },
      { sku: "b", delta: -1 },
    ]);

    expect(updated.find((i) => i.sku === "a")?.quantity).toBe(1);
    expect(updated.find((i) => i.sku === "b")?.quantity).toBe(0);
    expect(lowStock.map((i) => i.sku).sort()).toEqual(["a", "b"]);
  });
});


// packages/platform-core/src/utils/inventory.test.ts
import { flattenInventoryItem, expandInventoryItem } from "./inventory";
import type { InventoryItem } from "@acme/types";

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

  it("expands items with partial variant attributes and defaults productId", () => {
    const raw = {
      sku: "sku2",
      quantity: 3,
      variantAttributes: { size: "L", color: "", material: undefined },
    };

    expect(expandInventoryItem(raw)).toEqual({
      sku: "sku2",
      productId: "sku2",
      quantity: 3,
      variantAttributes: { size: "L" },
    });
  });

  it("expands items with missing variant attributes", () => {
    const raw = { sku: "sku3", quantity: 1 };

    expect(expandInventoryItem(raw)).toEqual({
      sku: "sku3",
      productId: "sku3",
      quantity: 1,
      variantAttributes: {},
    });
  });

  it("throws on invalid numeric values", () => {
    expect(() =>
      expandInventoryItem({
        sku: "sku4",
        quantity: "-1",
        variantAttributes: {},
      })
    ).toThrow();

    expect(() =>
      expandInventoryItem({
        sku: "sku5",
        quantity: "5",
        variantAttributes: {},
        lowStockThreshold: "bad",
      })
    ).toThrow();
  });
});


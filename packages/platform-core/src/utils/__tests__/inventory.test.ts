import {
  flattenInventoryItem,
  expandInventoryItem,
  type RawInventoryItem,
} from "../inventory";
import type { InventoryItem } from "@acme/types";

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
});


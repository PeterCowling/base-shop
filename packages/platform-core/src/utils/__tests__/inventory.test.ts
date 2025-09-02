import {
  flattenInventoryItem,
  expandInventoryItem,
  type RawInventoryItem,
} from "../inventory";
import type { InventoryItem } from "@acme/types";

describe("flattenInventoryItem", () => {
  it("flattens variant attributes and includes optional threshold", () => {
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
  it("handles variant.* keys and defaults missing productId", () => {
    const raw: RawInventoryItem = {
      sku: "sku3",
      "variant.color": "blue",
      quantity: "7",
    };

    expect(expandInventoryItem(raw)).toEqual({
      sku: "sku3",
      productId: "sku3",
      quantity: 7,
      variantAttributes: { color: "blue" },
    });
  });

  it("throws for malformed input", () => {
    const raw: RawInventoryItem = {
      sku: "sku4",
      "variant.color": "red",
      quantity: "not-a-number",
    };

    expect(() => expandInventoryItem(raw)).toThrow();
  });
});


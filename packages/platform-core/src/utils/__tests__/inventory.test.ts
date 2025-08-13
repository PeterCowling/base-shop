import { flattenInventoryItem, expandInventoryItem } from "../inventory";
import { InventoryItem } from "@acme/types";

describe("inventory utils", () => {
  const item: InventoryItem = {
    sku: "sku1",
    productId: "prod1",
    quantity: 5,
    variantAttributes: { color: "red", size: "M" },
    lowStockThreshold: 2,
  };

  it("flattens and expands an inventory item", () => {
    const flat = flattenInventoryItem(item);
    const expanded = expandInventoryItem(flat);
    expect(expanded).toEqual(item);
  });

  it("expands and flattens round trip", () => {
    const flat = {
      sku: "sku1",
      productId: "prod1",
      "variant.color": "red",
      quantity: "5",
      lowStockThreshold: "2",
    } as Record<string, unknown>;
    const expanded = expandInventoryItem(flat);
    const flattened = flattenInventoryItem(expanded);
    expect(flattened).toEqual({
      sku: "sku1",
      productId: "prod1",
      "variant.color": "red",
      quantity: 5,
      lowStockThreshold: 2,
    });
  });
});

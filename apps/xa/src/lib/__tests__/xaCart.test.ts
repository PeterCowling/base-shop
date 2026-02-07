import { describe, expect, it } from "@jest/globals";

import type { XaProduct } from "../demoData";
import {
  cartLineId,
  cartReservedQtyForSku,
  cartReservedQtyForSkuExcluding,
  type XaCartState,
} from "../xaCart";

const makeProduct = (id: string): XaProduct => ({
  id,
  slug: `slug-${id}`,
  title: `Product ${id}`,
  price: 100,
  deposit: 0,
  stock: 10,
  forSale: true,
  forRental: false,
  media: [{ url: "https://example.com/img.jpg", type: "image" }],
  sizes: ["M"],
  description: "desc",
  brand: "acme",
  collection: "core",
  createdAt: "2024-01-01T00:00:00Z",
  popularity: 1,
  taxonomy: {
    department: "women",
    category: "clothing",
    subcategory: "tops",
    color: ["black"],
    material: ["cotton"],
  },
});

describe("xaCart", () => {
  it("builds cart line ids with optional sizes", () => {
    expect(cartLineId("sku-1")).toBe("sku-1");
    expect(cartLineId("sku-1", "M")).toBe("sku-1:M");
  });

  it("sums reserved quantities per SKU", () => {
    const cart: XaCartState = {
      "sku-1:M": { sku: makeProduct("sku-1"), qty: 2, size: "M" },
      "sku-1:L": { sku: makeProduct("sku-1"), qty: 1, size: "L" },
      "sku-2": { sku: makeProduct("sku-2"), qty: 3 },
    };

    expect(cartReservedQtyForSku(cart, "sku-1")).toBe(3);
    expect(cartReservedQtyForSku(cart, "sku-2")).toBe(3);
  });

  it("excludes a line id when calculating reserved qty", () => {
    const cart: XaCartState = {
      "sku-1:M": { sku: makeProduct("sku-1"), qty: 2, size: "M" },
      "sku-1:L": { sku: makeProduct("sku-1"), qty: 1, size: "L" },
    };

    expect(cartReservedQtyForSkuExcluding(cart, "sku-1", "sku-1:M")).toBe(1);
  });
});

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import type { XaProduct } from "../demoData";
import {
  getAvailableStock,
  getSoldQty,
  readSoldMap,
  recordSale,
} from "../inventoryStore";
import type { XaCartState } from "../xaCart";

const SOLD_KEY = "XA_INVENTORY_SOLD_V1";

const makeProduct = (id: string, stock = 5): XaProduct => ({
  id,
  slug: `slug-${id}`,
  title: `Product ${id}`,
  price: 100,
  deposit: 0,
  stock,
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

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("inventoryStore", () => {
  it("sanitizes stored sold maps", () => {
    window.localStorage.setItem(
      SOLD_KEY,
      JSON.stringify({ "sku-1": "2", "sku-2": -1, "sku-3": "nope" }),
    );
    expect(readSoldMap()).toEqual({ "sku-1": 2 });
  });

  it("records sales and reads sold quantities", () => {
    recordSale("sku-1", 2.4);
    recordSale("sku-1", 1);
    recordSale("sku-2", -3);
    expect(getSoldQty("sku-1")).toBe(3);
    expect(getSoldQty("sku-2")).toBe(0);
  });

  it("computes available stock with sold and reserved amounts", () => {
    recordSale("sku-1", 2);
    const cart: XaCartState = {
      "sku-1:M": { sku: makeProduct("sku-1"), qty: 1, size: "M" },
    };

    const available = getAvailableStock(makeProduct("sku-1", 5), cart);
    expect(available).toBe(2);
  });
});

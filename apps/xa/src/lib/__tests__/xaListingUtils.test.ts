import { describe, expect, it } from "@jest/globals";

import type { XaProduct } from "../demoData";
import { ALL_FILTER_KEYS } from "../xaFilters";
import {
  cloneFilterValues,
  createEmptyFilterValues,
  getFilterParam,
  sortProducts,
  toNumber,
} from "../xaListingUtils";

const makeProduct = (overrides: Partial<XaProduct>): XaProduct => ({
  id: "01ARZ3NDEKTSV4RRFFQ69G5FA0",
  slug: "product",
  title: "Product",
  price: 100,
  deposit: 0,
  stock: 3,
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
  ...overrides,
});

describe("xaListingUtils", () => {
  it("parses numeric filters safely", () => {
    expect(toNumber(null)).toBeNull();
    expect(toNumber("")).toBeNull();
    expect(toNumber("nope")).toBeNull();
    expect(toNumber("12")).toBe(12);
    expect(toNumber("12.5")).toBe(12.5);
  });

  it("sorts products by different strategies", () => {
    const products = [
      makeProduct({
        id: "a",
        price: 300,
        createdAt: "2024-01-02T00:00:00Z",
        popularity: 5,
        compareAtPrice: 500,
      }),
      makeProduct({
        id: "b",
        price: 200,
        createdAt: "2024-01-03T00:00:00Z",
        popularity: 1,
        compareAtPrice: 200,
      }),
      makeProduct({
        id: "c",
        price: 150,
        createdAt: "2023-12-30T00:00:00Z",
        popularity: 10,
        compareAtPrice: 300,
      }),
    ];

    expect(sortProducts(products, "price-asc").map((p) => p.id)).toEqual([
      "c",
      "b",
      "a",
    ]);
    expect(sortProducts(products, "price-desc").map((p) => p.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(sortProducts(products, "newest").map((p) => p.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
    expect(sortProducts(products, "biggest-discount").map((p) => p.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
    expect(sortProducts(products, "best-sellers").map((p) => p.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("manages filter value sets safely", () => {
    const empty = createEmptyFilterValues();
    for (const key of ALL_FILTER_KEYS) {
      expect(empty[key]).toBeInstanceOf(Set);
      expect(empty[key].size).toBe(0);
    }

    empty.designer.add("acme");
    const cloned = cloneFilterValues(empty);
    expect(cloned.designer.has("acme")).toBe(true);
    expect(cloned.designer).not.toBe(empty.designer);
  });

  it("formats filter params", () => {
    expect(getFilterParam("designer")).toBe("f[designer]");
  });
});

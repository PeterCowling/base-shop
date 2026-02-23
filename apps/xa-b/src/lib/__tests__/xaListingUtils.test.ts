import { describe, expect, it } from "@jest/globals";

import {
  cloneFilterValues,
  createEmptyFilterValues,
  getFilterParam,
  sortProducts,
  toNumber,
} from "../xaListingUtils";

function product(overrides: Record<string, unknown>) {
  return {
    price: 100,
    compareAtPrice: null,
    popularity: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as any;
}

describe("xaListingUtils", () => {
  it("parses numeric strings safely", () => {
    expect(toNumber("12.4")).toBe(12.4);
    expect(toNumber("abc")).toBeNull();
    expect(toNumber(null)).toBeNull();
  });

  it("sorts products by price and discount criteria", () => {
    const products = [
      product({ id: "a", price: 90, compareAtPrice: 100, popularity: 8 }),
      product({ id: "b", price: 60, compareAtPrice: 120, popularity: 5 }),
      product({ id: "c", price: 120, compareAtPrice: 120, popularity: 10 }),
    ];

    expect(sortProducts(products, "price-asc").map((item) => item.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
    expect(sortProducts(products, "price-desc").map((item) => item.id)).toEqual([
      "c",
      "a",
      "b",
    ]);
    expect(sortProducts(products, "biggest-discount").map((item) => item.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("creates and clones independent filter value maps", () => {
    const base = createEmptyFilterValues();
    base.color.add("black");
    const cloned = cloneFilterValues(base);

    cloned.color.add("ivory");

    expect(base.color.has("black")).toBe(true);
    expect(base.color.has("ivory")).toBe(false);
    expect(cloned.color.has("ivory")).toBe(true);
  });

  it("formats filter keys as query params", () => {
    expect(getFilterParam("designer")).toBe("f[designer]");
    expect(getFilterParam("jewelry-style")).toBe("f[jewelry-style]");
  });
});

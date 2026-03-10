import { describe, expect, it } from "@jest/globals";

import {
  cloneFilterValues,
  createEmptyFilterValues,
  getFilterParam,
  isNewIn,
  sortProducts,
  toNumber,
} from "../xaListingUtils";

function product(overrides: Record<string, unknown>) {
  return {
    price: 100,
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

  it("sorts products by price", () => {
    const products = [
      product({ id: "a", price: 90, popularity: 8 }),
      product({ id: "b", price: 60, popularity: 5 }),
      product({ id: "c", price: 120, popularity: 10 }),
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

  describe("isNewIn", () => {
    const ref = new Date("2026-03-04T12:00:00.000Z");

    it("returns true for product created within 30 days", () => {
      expect(isNewIn(product({ createdAt: "2026-02-20T00:00:00.000Z" }), ref)).toBe(true);
    });

    it("returns false for product created more than 30 days ago", () => {
      expect(isNewIn(product({ createdAt: "2026-01-01T00:00:00.000Z" }), ref)).toBe(false);
    });

    it("returns true for product created exactly 30 days ago (inclusive)", () => {
      expect(isNewIn(product({ createdAt: "2026-02-02T12:00:00.000Z" }), ref)).toBe(true);
    });

    it("returns false for product with missing createdAt", () => {
      expect(isNewIn(product({ createdAt: "" }), ref)).toBe(false);
      expect(isNewIn(product({ createdAt: undefined }), ref)).toBe(false);
    });

    it("returns false for product with invalid createdAt", () => {
      expect(isNewIn(product({ createdAt: "not-a-date" }), ref)).toBe(false);
    });

    it("returns false for product created in the future", () => {
      expect(isNewIn(product({ createdAt: "2026-04-01T00:00:00.000Z" }), ref)).toBe(false);
    });
  });
});

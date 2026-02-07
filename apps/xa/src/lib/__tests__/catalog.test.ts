import { describe, expect, it } from "@jest/globals";

import {
  estimateCompareAt,
  getAllProducts,
  getFeaturedProducts,
  getProductByHandle,
  getSearchSuggestions,
  productHref,
} from "../catalog";

describe("catalog helpers", () => {
  it("returns featured and all products", () => {
    const featured = getFeaturedProducts();
    const all = getAllProducts();
    expect(featured.length).toBeGreaterThan(0);
    expect(all.length).toBeGreaterThanOrEqual(featured.length);
  });

  it("finds products by handle and builds hrefs", () => {
    const product = getProductByHandle("green-sneaker");
    expect(product?.id).toBe("green-sneaker");
    expect(productHref({ slug: "green-sneaker" })).toBe("/products/green-sneaker");
  });

  it("derives search suggestions", () => {
    const suggestions = getSearchSuggestions();
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it("estimates compare-at prices", () => {
    expect(estimateCompareAt(undefined)).toBeNull();
    expect(estimateCompareAt(Number.NaN)).toBeNull();
    expect(estimateCompareAt(100)).toBe(130);
  });
});

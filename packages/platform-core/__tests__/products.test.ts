// packages/platform-core/__tests__/products.test.ts

import { getProductBySlug, PRODUCTS } from "../src/products/index";

describe("getProductBySlug", () => {
  it("returns the matching product", () => {
    const slug = PRODUCTS[0].slug;
    expect(getProductBySlug(slug)).toEqual(PRODUCTS[0]);
  });
});

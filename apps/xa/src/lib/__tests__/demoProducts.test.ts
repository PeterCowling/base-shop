import { describe, expect, it } from "@jest/globals";

import { XA_PRODUCTS } from "../demoProducts";

describe("demo products", () => {
  it("includes demo products with media", () => {
    expect(XA_PRODUCTS.length).toBeGreaterThan(0);
    for (const product of XA_PRODUCTS) {
      expect(product.media.length).toBeGreaterThan(0);
      expect(product.media[0]?.altText).toBeTruthy();
    }
  });
});

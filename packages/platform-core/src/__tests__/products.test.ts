/** @jest-environment node */

import { getProductBySlug, getProductById } from "../products";
import { PRODUCTS } from "../products/index";

describe("getProductBySlug", () => {
  it("returns null for an unknown slug", () => {
    expect(getProductBySlug("non-existent")).toBeNull();
  });
});

describe("getProductById", () => {
  it("resolves with the matching product via async path", async () => {
    const product = PRODUCTS[0];
    await expect(getProductById("shop", product.id)).resolves.toEqual(product);
  });
});

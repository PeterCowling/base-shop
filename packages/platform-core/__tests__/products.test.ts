// packages/platform-core/__tests__/products.test.ts

import { getProductBySlug, getProductById, PRODUCTS, getProducts } from "../src/products";
import { PRODUCTS as BASE_PRODUCTS } from "../src/products/index";

describe("getProductBySlug", () => {
  it("returns the matching SKU", () => {
    const slug = PRODUCTS[0].slug;
    expect(getProductBySlug(slug)).toEqual(PRODUCTS[0]);
  });

  it("returns null when no match is found", () => {
    expect(getProductBySlug("missing")).toBeNull();
  });
});

describe("getProductById overloads", () => {
  const id = PRODUCTS[0].id;

  it("returns the SKU synchronously", () => {
    expect(getProductById(id)).toEqual(PRODUCTS[0]);
  });

  it("returns the same SKU via the Promise branch", async () => {
    await expect(getProductById("shop", id)).resolves.toEqual(PRODUCTS[0]);
  });
});

describe("getProducts", () => {
  it("returns a fresh copy of PRODUCTS", async () => {
    const first = await getProducts();
    const second = await getProducts();
    expect(first).toEqual(BASE_PRODUCTS);
    expect(first).not.toBe(BASE_PRODUCTS);
    expect(first).not.toBe(second);
  });
});

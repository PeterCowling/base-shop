// packages/platform-core/__tests__/products.test.ts

import {
  getProductBySlug,
  getProductById,
  PRODUCTS,
  getProducts,
  searchProducts,
} from "../src/products";
import { PRODUCTS as BASE_PRODUCTS } from "../src/products/index";

describe("getProductBySlug", () => {
  it("returns the matching product", () => {
    const slug = PRODUCTS[0].slug;
    expect(getProductBySlug(slug)).toEqual(PRODUCTS[0]);
  });
});

describe("getProductById", () => {
  const inStock = PRODUCTS.find((p) => p.stock > 0)!;
  const outOfStock = PRODUCTS.find((p) => p.stock === 0)!;

  it("returns the item when in stock", () => {
    expect(getProductById(inStock.id)).toEqual(inStock);
  });

  it("returns null when stock is 0", () => {
    expect(getProductById(outOfStock.id)).toBeNull();
  });

  it("returns the item when in stock via async lookup", async () => {
    await expect(getProductById("shop", inStock.id)).resolves.toEqual(inStock);
  });

  it("returns null when stock is 0 via async lookup", async () => {
    await expect(getProductById("shop", outOfStock.id)).resolves.toBeNull();
  });
});

describe("getProducts", () => {
  it("returns a copy of base.PRODUCTS", async () => {
    const result = await getProducts();
    expect(result).toEqual(BASE_PRODUCTS);
    expect(result).not.toBe(BASE_PRODUCTS);
  });
});

describe("searchProducts", () => {
  it("returns an empty array", async () => {
    await expect(searchProducts("anything")).resolves.toEqual([]);
  });
});

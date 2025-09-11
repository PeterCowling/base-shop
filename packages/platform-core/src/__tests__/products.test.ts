/** @jest-environment node */

import { getProductBySlug, getProductById, getProducts, searchProducts } from "../products";
import { PRODUCTS } from "../products/index";

describe("getProductBySlug", () => {
  it("returns null for an unknown slug", () => {
    expect(getProductBySlug("non-existent")).toBeNull();
  });

  it("returns the product for a known slug", () => {
    const product = PRODUCTS[0];
    expect(getProductBySlug(product.slug)).toEqual(product);
  });
});

describe("getProductById", () => {
  it("resolves with the matching product via async path", async () => {
    const product = PRODUCTS[0];
    await expect(getProductById("shop", product.id)).resolves.toEqual(product);
  });

  it("returns the product synchronously when available", () => {
    const product = PRODUCTS[0];
    expect(getProductById(product.id)).toEqual(product);
  });

  it("returns null for out-of-stock products", () => {
    const outOfStock = PRODUCTS.find((p) => p.stock === 0)!;
    expect(getProductById(outOfStock.id)).toBeNull();
  });

  it("returns null for unknown product ids", () => {
    expect(getProductById("missing-id")).toBeNull();
  });

  it("resolves null for unknown ids via async path", async () => {
    await expect(getProductById("shop", "missing-id")).resolves.toBeNull();
  });

  it("handles invalid input gracefully", () => {
    expect(getProductById(undefined as unknown as string)).toBeNull();
  });

  it("resolves null for undefined ids via async path", async () => {
    await expect(getProductById("shop", undefined as unknown as string)).resolves.toBeNull();
  });
});

describe("getProducts", () => {
  it("returns a copy of all products", async () => {
    const list = await getProducts();
    expect(list).toEqual(PRODUCTS);
    expect(list).not.toBe(PRODUCTS);
  });

  it("returns default order when sort key is invalid", async () => {
    const baseline = await getProducts();
    const result = await getProducts({ sort: "not-a-real-key" });
    expect(result).toEqual(baseline);
  });

  it("ignores filters whether empty or populated", async () => {
    const empty = await getProducts({ filters: {} });
    const filtered = await getProducts({ filters: { category: "test" } });
    expect(empty).toEqual(PRODUCTS);
    expect(filtered).toEqual(PRODUCTS);
  });

  it("ignores boundary page/limit values and returns full dataset", async () => {
    const cases = [
      { page: 0, limit: 0 },
      { page: -1, limit: -5 },
      { page: 999, limit: 999 },
    ];
    for (const opts of cases) {
      const list = await getProducts(opts);
      expect(list).toEqual(PRODUCTS);
    }
  });
});

describe("searchProducts", () => {
  it("returns an empty array when query yields no results", async () => {
    await expect(searchProducts("no-match")).resolves.toEqual([]);
  });
});

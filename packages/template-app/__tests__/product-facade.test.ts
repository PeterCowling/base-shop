// packages/template-app/__tests__/product-facade.test.ts
import { jest } from "@jest/globals";
import {
  getProductBySlug,
  getProductById,
  getProducts,
  searchProducts,
} from "@platform-core/products";
import * as base from "@platform-core/products/index";
import * as repo from "@platform-core/repositories/products.server";

jest.mock("@platform-core/repositories/products.server", () => ({
  getProductById: jest.fn(),
  readRepo: jest.fn(),
}));

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getProductBySlug", () => {
  it("calls through to base and returns null when missing", () => {
    const spy = jest.spyOn(base, "getProductBySlug");
    expect(getProductBySlug("missing"))
      .toBeNull();
    expect(spy).toHaveBeenCalledWith("missing");
  });

  it("returns the product from the base lookup", () => {
    const product = base.PRODUCTS[0];
    const spy = jest.spyOn(base, "getProductBySlug");
    expect(getProductBySlug(product.slug)).toEqual(product);
    expect(spy).toHaveBeenCalledWith(product.slug);
  });
});

describe("getProductById", () => {
  const inStock = base.PRODUCTS.find((p) => p.stock > 0)!;
  const outOfStock = base.PRODUCTS.find((p) => p.stock === 0)!;

  it("returns the item synchronously when in stock", () => {
    const spy = jest.spyOn(base, "getProductById");
    expect(getProductById(inStock.id)).toEqual(inStock);
    expect(spy).toHaveBeenCalledWith(inStock.id);
  });

  it("returns null synchronously when out of stock", () => {
    expect(getProductById(outOfStock.id)).toBeNull();
  });

  it("uses server repository in async path", async () => {
    const repoMock = repo as jest.Mocked<typeof repo>;
    repoMock.getProductById.mockResolvedValueOnce(inStock);
    await expect(getProductById("shop", inStock.id)).resolves.toEqual(inStock);
    expect(repoMock.getProductById).toHaveBeenCalledWith("shop", inStock.id);
  });

  it("resolves null via server repository for unknown ids", async () => {
    const repoMock = repo as jest.Mocked<typeof repo>;
    repoMock.getProductById.mockResolvedValueOnce(null);
    await expect(getProductById("shop", "missing")).resolves.toBeNull();
    expect(repoMock.getProductById).toHaveBeenCalledWith("shop", "missing");
  });
});

describe("getProducts", () => {
  it("returns a new array equal to base.PRODUCTS", async () => {
    const list = await getProducts();
    expect(list).toEqual(base.PRODUCTS);
    expect(list).not.toBe(base.PRODUCTS);
  });
});

describe("searchProducts", () => {
  it("returns an empty array", async () => {
    await expect(searchProducts("anything")).resolves.toEqual([]);
  });
});

/** @jest-environment node */

import {
  getProductBySlug,
  getProductById,
  getProducts,
  searchProducts,
} from "../products";
import { PRODUCTS } from "../products/index";
import * as repo from "../repositories/products.server";

jest.mock("../repositories/products.server", () => ({
  getProductById: jest.fn(),
  readRepo: jest.fn(),
}));

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
  const repoMock = repo as jest.Mocked<typeof repo>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resolves with the matching product via async path", async () => {
    const product = PRODUCTS[0];
    repoMock.getProductById.mockResolvedValueOnce(product);
    await expect(getProductById("shop", product.id)).resolves.toEqual(product);
    expect(repoMock.getProductById).toHaveBeenCalledWith("shop", product.id);
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
    repoMock.getProductById.mockResolvedValueOnce(null);
    await expect(getProductById("shop", "missing-id")).resolves.toBeNull();
    expect(repoMock.getProductById).toHaveBeenCalledWith("shop", "missing-id");
  });

  it("handles invalid input gracefully", () => {
    expect(getProductById(undefined as unknown as string)).toBeNull();
  });
});

describe("getProducts", () => {
  it("returns a copy of all products", async () => {
    const list = await getProducts();
    expect(list).toEqual(PRODUCTS);
    expect(list).not.toBe(PRODUCTS);
  });

  it("delegates to repository when shop is provided", async () => {
    const repoMock = repo as jest.Mocked<typeof repo>;
    repoMock.readRepo.mockResolvedValueOnce(PRODUCTS);
    const list = await getProducts("shop");
    expect(list).toEqual(PRODUCTS);
    expect(repoMock.readRepo).toHaveBeenCalledWith("shop");
  });
});

describe("searchProducts", () => {
  it("filters products from repository", async () => {
    const repoMock = repo as jest.Mocked<typeof repo>;
    repoMock.readRepo.mockResolvedValueOnce(PRODUCTS);
    const product = PRODUCTS[0];
    const results = await searchProducts("shop", product.slug);
    expect(results).toEqual([product]);
    expect(repoMock.readRepo).toHaveBeenCalledWith("shop");
  });
});

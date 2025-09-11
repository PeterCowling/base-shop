// packages/platform-core/__tests__/products.test.ts

import {
  getProductBySlug,
  getProductById,
  PRODUCTS,
  getProducts,
  searchProducts,
} from "../src/products";
import { PRODUCTS as BASE_PRODUCTS } from "../src/products/index";
import * as repo from "../src/repositories/products.server";

jest.mock("../src/repositories/products.server", () => ({
  getProductById: jest.fn(),
  readRepo: jest.fn(),
}));

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
  const repoMock = repo as jest.Mocked<typeof repo>;

  it("returns the SKU synchronously", () => {
    expect(getProductById(id)).toEqual(PRODUCTS[0]);
  });

  it("returns the same SKU via the Promise branch", async () => {
    repoMock.getProductById.mockResolvedValueOnce(PRODUCTS[0]);
    await expect(getProductById("shop", id)).resolves.toEqual(PRODUCTS[0]);
    expect(repoMock.getProductById).toHaveBeenCalledWith("shop", id);
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

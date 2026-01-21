import { jest } from '@jest/globals';

import { getProductById, getProductBySlug } from "../src/products";
import * as base from "../src/products/index";

// Use globalThis to avoid Jest mock hoisting issues
declare global {
  var __productsFacadeTestMockProduct: any;
}
globalThis.__productsFacadeTestMockProduct = { id: "prod-1", slug: "prod-1", stock: 1 };

const mockProduct = globalThis.__productsFacadeTestMockProduct;

jest.mock("../src/products/index", () => ({
  get PRODUCTS() {
    return [globalThis.__productsFacadeTestMockProduct];
  },
  getProductById: jest.fn((id: string) =>
    id === globalThis.__productsFacadeTestMockProduct?.id ? globalThis.__productsFacadeTestMockProduct : undefined,
  ),
  getProductBySlug: jest.fn((slug: string) =>
    slug === globalThis.__productsFacadeTestMockProduct?.slug ? globalThis.__productsFacadeTestMockProduct : undefined,
  ),
}));

const serverMocks = {
  getProductById: jest.fn(async (_shop: string, id: string) =>
    id === mockProduct.id ? mockProduct : null,
  ),
  readRepo: jest.fn(),
};

jest.mock("../src/repositories/products.server", () => serverMocks);

describe("getProductById overloads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns product synchronously", () => {
    const product = getProductById("prod-1");
    expect(product).toEqual(mockProduct);
    expect(base.getProductById).toHaveBeenCalledWith("prod-1");
    expect(serverMocks.getProductById).not.toHaveBeenCalled();
  });

  it("returns product asynchronously", async () => {
    await expect(getProductById("cover-me-pretty", "prod-1")).resolves.toEqual(
      mockProduct,
    );
    expect(serverMocks.getProductById).toHaveBeenCalledWith(
      "cover-me-pretty",
      "prod-1",
    );
    expect(base.getProductById).not.toHaveBeenCalled();
  });

  it("returns null when product missing synchronously", () => {
    const product = getProductById("no-exist");
    expect(product).toBeNull();
    expect(base.getProductById).toHaveBeenCalledWith("no-exist");
  });

  it("returns null when product missing asynchronously", async () => {
    await expect(getProductById("cover-me-pretty", "no-exist")).resolves.toBeNull();
    expect(serverMocks.getProductById).toHaveBeenCalledWith(
      "cover-me-pretty",
      "no-exist",
    );
    expect(base.getProductById).toHaveBeenCalledWith("no-exist");
  });

  it("delegates slug lookup to base.getProductBySlug", () => {
    const product = getProductBySlug("prod-1");
    expect(product).toEqual(mockProduct);
    expect(base.getProductBySlug).toHaveBeenCalledWith("prod-1");
  });
});

const mockProduct = { id: "prod-1", slug: "prod-1", stock: 1 } as any;

jest.mock("../src/products/index", () => ({
  PRODUCTS: [mockProduct],
  getProductById: jest.fn((id: string) => (id === mockProduct.id ? mockProduct : undefined)),
  getProductBySlug: jest.fn((slug: string) => (slug === mockProduct.slug ? mockProduct : undefined)),
}));

jest.mock("../src/repositories/products.server", () => ({
  getProductById: jest.fn(),
  readRepo: jest.fn(),
}));

import { getProductById, getProductBySlug } from "../src/products";
import * as base from "../src/products/index";
import * as repo from "../src/repositories/products.server";

describe("getProductById overloads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns product synchronously", () => {
    const product = getProductById("prod-1");
    expect(product).toEqual(mockProduct);
    expect(base.getProductById).toHaveBeenCalledWith("prod-1");
  });

  it("returns product asynchronously", async () => {
    const repoMock = repo as jest.Mocked<typeof repo>;
    repoMock.getProductById.mockResolvedValueOnce(mockProduct);
    await expect(getProductById("shop-abc", "prod-1")).resolves.toEqual(mockProduct);
    expect(repoMock.getProductById).toHaveBeenCalledWith("shop-abc", "prod-1");
  });

  it("returns null when product missing synchronously", () => {
    const product = getProductById("no-exist");
    expect(product).toBeNull();
    expect(base.getProductById).toHaveBeenCalledWith("no-exist");
  });

  it("returns null when product missing asynchronously", async () => {
    const repoMock = repo as jest.Mocked<typeof repo>;
    repoMock.getProductById.mockResolvedValueOnce(null);
    await expect(getProductById("shop-abc", "no-exist")).resolves.toBeNull();
    expect(repoMock.getProductById).toHaveBeenCalledWith("shop-abc", "no-exist");
  });

  it("delegates slug lookup to base.getProductBySlug", () => {
    const product = getProductBySlug("prod-1");
    expect(product).toEqual(mockProduct);
    expect(base.getProductBySlug).toHaveBeenCalledWith("prod-1");
  });
});


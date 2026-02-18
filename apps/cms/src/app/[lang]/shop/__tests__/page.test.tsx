import type { SKU } from "@acme/types";

const expectedSkus: SKU[] = [
  {
    id: "01H000000000000000000001",
    slug: "mock-sku-1",
    title: "Mock SKU 1",
    price: 1000,
    deposit: 0,
    stock: 5,
    forSale: true,
    forRental: false,
    media: [],
    sizes: ["M"],
    description: "First mock SKU",
  },
  {
    id: "01H000000000000000000002",
    slug: "mock-sku-2",
    title: "Mock SKU 2",
    price: 2000,
    deposit: 0,
    stock: 8,
    forSale: true,
    forRental: false,
    media: [],
    sizes: ["L"],
    description: "Second mock SKU",
  },
];

jest.mock("@acme/platform-core/products", () => ({
  PRODUCTS: [
    {
      id: "01H000000000000000000001",
      slug: "mock-sku-1",
      title: "Mock SKU 1",
      price: 1000,
      deposit: 0,
      stock: 5,
      forSale: true,
      forRental: false,
      media: [],
      sizes: ["M"],
      description: "First mock SKU",
    },
    {
      id: "01H000000000000000000002",
      slug: "mock-sku-2",
      title: "Mock SKU 2",
      price: 2000,
      deposit: 0,
      stock: 8,
      forSale: true,
      forRental: false,
      media: [],
      sizes: ["L"],
      description: "Second mock SKU",
    },
  ] satisfies SKU[],
}));

jest.mock("../ShopClient.client", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

describe("ShopIndexPage", () => {
  const { default: ShopIndexPage, metadata } = require("../page");
  const mockShopClient = require("../ShopClient.client").default as jest.Mock;

  beforeEach(() => {
    mockShopClient.mockClear();
  });

  it("exports the expected metadata title", () => {
    expect(metadata.title).toBe("Shop · Base-Shop");
  });

  it("passes the SKU list to the client component without extra props", () => {
    const element = ShopIndexPage();
    const child = element.props.children;

    expect(typeof element.type).toBe("symbol");
    expect(child.type).toBe(mockShopClient);
    expect(child.props.skus).toEqual(expectedSkus);
    expect(child.props).toEqual({ skus: expectedSkus });
  });
});

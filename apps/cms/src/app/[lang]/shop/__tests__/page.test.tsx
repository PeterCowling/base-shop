import type { SKU } from "@acme/types";

const mockSkus: SKU[] = [
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

const mockShopClient = jest.fn(() => null);

jest.mock("@platform-core/lib/products", () => ({
  PRODUCTS: mockSkus,
}));

jest.mock("../ShopClient.client", () => ({
  __esModule: true,
  default: mockShopClient,
}));

import { metadata, default as ShopIndexPage } from "../page";

describe("ShopIndexPage", () => {
  beforeEach(() => {
    mockShopClient.mockClear();
  });

  it("exports the expected metadata title", () => {
    expect(metadata.title).toBe("Shop · Base-Shop");
  });

  it("passes the SKU list to the client component without extra props", () => {
    const element = ShopIndexPage();

    expect(element.type).toBe(mockShopClient);
    expect(element.props.skus).toBe(mockSkus);
    expect(element.props).toEqual({ skus: mockSkus });
  });
});

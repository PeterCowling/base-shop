import { render, screen } from "@testing-library/react";

import type { SKU } from "@acme/types";

import { StickyCheckoutBar } from "./StickyCheckoutBar.client";

jest.mock("@acme/platform-core/components/shop/AddToCartButton.client", () => ({
  __esModule: true,
  default: ({ sku, disabled }: { sku: SKU; disabled?: boolean }) => (
    <button type="button" disabled={disabled} data-testid="add-to-cart" data-sku-id={sku.id}>
      Add to cart
    </button>
  ),
}));

const MOCK_SKU: SKU = {
  id: "01J0TESTSKU00000000000000",
  slug: "test-product",
  title: "Test Product",
  price: 8900,
  deposit: 0,
  stock: 10,
  forSale: true,
  forRental: false,
  media: [],
  sizes: [],
  description: "Test product description",
};

describe("StickyCheckoutBar", () => {
  beforeEach(() => {
    globalThis.IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
      takeRecords: jest.fn(() => []),
      root: null,
      rootMargin: "",
      thresholds: [],
    })) as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders checkout sentinel element", () => {
    render(<StickyCheckoutBar priceLabel="$89.00" sku={MOCK_SKU} />);

    expect(screen.getByTestId("checkout-sentinel")).toBeInTheDocument();
  });

  it("renders trust line when trustLine prop is provided", () => {
    render(<StickyCheckoutBar priceLabel="$89.00" sku={MOCK_SKU} trustLine="30-day exchange" />);

    expect(screen.getByText("30-day exchange")).toBeInTheDocument();
  });

  it("does not render trust line when trustLine is not provided", () => {
    render(<StickyCheckoutBar priceLabel="$89.00" sku={MOCK_SKU} />);

    expect(screen.queryByText("30-day exchange")).not.toBeInTheDocument();
  });
});

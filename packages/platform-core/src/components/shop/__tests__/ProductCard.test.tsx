import { render, screen } from "@testing-library/react";
import { ProductCard, Price } from "../ProductCard";
import React from "react";

// Mock next/image to render a standard img element
jest.mock("next/image", () => (props: any) => <img {...props} />);

// Mock AddToCartButton to avoid context dependencies
jest.mock("../AddToCartButton.client", () => ({
  __esModule: true,
  default: () => <button data-testid="add-to-cart" />,
}));

// Mock formatPrice and useCurrency with spies
const formatPriceMock = jest.fn((amount: number, currency: string) => `${amount} ${currency}`);
const useCurrencyMock = jest.fn(() => ["USD"] as const);

jest.mock("@acme/shared-utils", () => ({
  formatPrice: (amount: number, currency: string) => formatPriceMock(amount, currency),
}));

jest.mock("../../../contexts/CurrencyContext", () => ({
  useCurrency: () => useCurrencyMock(),
}));

const baseSku = {
  id: "1",
  slug: "sku",
  title: "Test SKU",
  price: 100,
  deposit: 0,
  stock: 0,
  media: [] as any[],
  sizes: [],
  description: "",
  forSale: true,
  forRental: false,
};

describe("ProductCard media", () => {
  it("renders an Image for image media", () => {
    const sku = { ...baseSku, media: [{ type: "image", url: "/img.jpg" }] };
    render(<ProductCard sku={sku} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(document.querySelector("video")).toBeNull();
  });

  it("renders a video element for video media", () => {
    const sku = { ...baseSku, media: [{ type: "video", url: "/vid.mp4" }] };
    const { container } = render(<ProductCard sku={sku} />);
    expect(container.querySelector("video")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });
});

describe("Price", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCurrencyMock.mockReturnValue(["USD"] as const);
  });

  it("uses context currency when none is provided", () => {
    render(<Price amount={50} />);
    expect(formatPriceMock).toHaveBeenCalledWith(50, "USD");
  });

  it("overrides context currency with prop", () => {
    render(<Price amount={75} currency="EUR" />);
    expect(formatPriceMock).toHaveBeenCalledWith(75, "EUR");
  });
});


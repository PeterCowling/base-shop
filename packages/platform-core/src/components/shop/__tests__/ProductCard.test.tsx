import { render, screen } from "@testing-library/react";
import { ProductCard, Price } from "../ProductCard";
import React from "react";
import "../../../../../../test/resetNextMocks";

// Mock AddToCartButton to avoid context dependencies
jest.mock("../AddToCartButton.client", () => ({
  __esModule: true,
  default: () => <button data-cy="add-to-cart" />,
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
  it("renders no media elements when sku.media is empty", () => {
    render(<ProductCard sku={baseSku} />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(document.querySelector("video")).toBeNull();
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

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

describe("ProductCard price", () => {
  beforeEach(() => {
    formatPriceMock.mockClear();
  });

  it("omits price when sku.price is undefined", () => {
    const sku = { ...baseSku, price: undefined as any };
    const { container } = render(<ProductCard sku={sku} />);
    expect(container.querySelector(".font-semibold.text-gray-900")).toBeNull();
    expect(formatPriceMock).not.toHaveBeenCalled();
  });

  it("omits price when sku.price is null", () => {
    const sku = { ...baseSku, price: null as any };
    const { container } = render(<ProductCard sku={sku} />);
    expect(container.querySelector(".font-semibold.text-gray-900")).toBeNull();
    expect(formatPriceMock).not.toHaveBeenCalled();
  });
});

describe("ProductCard badges", () => {
  it("shows sale badge when sku.badges.sale is true", () => {
    const sku = { ...baseSku, badges: { sale: true } };
    render(<ProductCard sku={sku} />);
    expect(screen.getByTestId("badge-sale")).toBeInTheDocument();
    expect(screen.queryByTestId("badge-new")).toBeNull();
  });

  it("shows new badge when sku.badges.new is true", () => {
    const sku = { ...baseSku, badges: { new: true } };
    render(<ProductCard sku={sku} />);
    expect(screen.getByTestId("badge-new")).toBeInTheDocument();
    expect(screen.queryByTestId("badge-sale")).toBeNull();
  });

  it("renders no badges when flags are false", () => {
    const sku = { ...baseSku, badges: { sale: false, new: false } };
    render(<ProductCard sku={sku} />);
    expect(screen.queryByTestId("badge-sale")).toBeNull();
    expect(screen.queryByTestId("badge-new")).toBeNull();
  });
});

describe("ProductCard memoization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCurrencyMock.mockReturnValue(["USD"] as const);
  });

  it("renders only once when props do not change", () => {
    const { rerender } = render(<ProductCard sku={baseSku} />);
    expect(formatPriceMock).toHaveBeenCalledTimes(1);
    rerender(<ProductCard sku={baseSku} />);
    expect(formatPriceMock).toHaveBeenCalledTimes(1);
  });
});

describe("Price", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCurrencyMock.mockReturnValue(["USD"] as const);
  });

  it("uses context currency when no prop is supplied", () => {
    render(<Price amount={50} />);
    expect(formatPriceMock).toHaveBeenCalledWith(50, "USD");
  });

  it("overrides context currency with prop", () => {
    render(<Price amount={75} currency="EUR" />);
    expect(formatPriceMock).toHaveBeenCalledWith(75, "EUR");
  });

  it("falls back to EUR when context returns undefined", () => {
    useCurrencyMock.mockReturnValue([undefined] as any);
    render(<Price amount={25} />);
    expect(formatPriceMock).toHaveBeenCalledWith(25, "EUR");
  });
});


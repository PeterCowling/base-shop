import React from "react";
import { render, screen } from "@testing-library/react";

import type { SKU } from "@acme/types";

import { ProductCard } from "../src/components/shop/ProductCard";

// Use globalThis to avoid Jest mock hoisting issues
declare global {
  var __productCardInnerTestAddToCartMock: jest.Mock | undefined;
}
globalThis.__productCardInnerTestAddToCartMock = jest.fn(() => <div data-cy="add" />);

const addToCartMock = globalThis.__productCardInnerTestAddToCartMock!;

jest.mock("../src/components/shop/AddToCartButton.client", () => ({
  __esModule: true,
  get default() {
    return globalThis.__productCardInnerTestAddToCartMock;
  },
}));

jest.mock("../src/contexts/CurrencyContext", () =>
  require("../../../test/__mocks__/currencyContextMock.tsx"),
);

describe("ProductCard media and rendering", () => {
  function baseSku(): SKU {
    return {
      id: "base",
      slug: "base",
      title: "Base title",
      price: 10,
      media: [],
      sizes: [],
    } as unknown as SKU;
  }

  it("renders image media", () => {
    const url = "https://example.com/test.jpg";
    const sku = { ...baseSku(), media: [{ type: "image", url }] } as SKU;
    const { container } = render(<ProductCard sku={sku} />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute("src")).toContain(encodeURIComponent(url));
  });

  it("renders video for non-image media", () => {
    const url = "https://example.com/test.mp4";
    const sku = { ...baseSku(), media: [{ type: "video", url }] } as SKU;
    const { container } = render(<ProductCard sku={sku} />);
    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", url);
  });

  it("renders no media when absent", () => {
    const sku = baseSku();
    const { container } = render(<ProductCard sku={sku} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("video")).toBeNull();
  });

  it("renders the product title", () => {
    const sku = { ...baseSku(), title: "Fancy Shoe" } as SKU;
    render(<ProductCard sku={sku} />);
    expect(
      screen.getByRole("heading", { level: 3, name: "Fancy Shoe" }),
    ).toBeInTheDocument();
  });

  it("memoizes inner component", () => {
    const sku = baseSku();
    const { rerender } = render(<ProductCard sku={sku} />);
    const initialCalls = addToCartMock.mock.calls.length;
    rerender(<ProductCard sku={sku} />);
    expect(addToCartMock).toHaveBeenCalledTimes(initialCalls);
    const sku2 = { ...sku, id: "other" } as SKU;
    rerender(<ProductCard sku={sku2} />);
    expect(addToCartMock).toHaveBeenCalledTimes(initialCalls + 1);
  });
});


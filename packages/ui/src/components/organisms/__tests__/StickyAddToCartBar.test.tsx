import "@testing-library/jest-dom";
import "../../../../../../test/resetNextMocks";

import { fireEvent, render, screen } from "@testing-library/react";

import type { SKU } from "@acme/types";

import { StickyAddToCartBar } from "../StickyAddToCartBar";

jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));

describe("StickyAddToCartBar", () => {
  const product: SKU = {
    id: "1",
    slug: "test-product",
    title: "Test Product",
    price: 9.99,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "/img.jpg", type: "image" }],
    sizes: [],
    description: "",
  };

  it("renders product info and handles add to cart", () => {
    const handleAdd = jest.fn();
    render(<StickyAddToCartBar product={product} onAddToCart={handleAdd} />);

    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText(/\$9\.99/)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /add to cart/i });
    fireEvent.click(button);
    expect(handleAdd).toHaveBeenCalledWith(product);
  });

  it("does not render add button without handler", () => {
    render(<StickyAddToCartBar product={product} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(/\$9\.99/)).toBeInTheDocument();
  });

  it("hides price when not provided", () => {
    const noPrice = { ...product, price: undefined as unknown as number };
    render(<StickyAddToCartBar product={noPrice} />);
    expect(screen.queryByText(/\$9\.99/)).not.toBeInTheDocument();
  });
});


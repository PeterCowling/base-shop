import "@testing-library/jest-dom";

import { configure, render, screen } from "@testing-library/react";

import { PRODUCTS } from "@acme/platform-core/products/index";

import ProductBundle, { getRuntimeProps } from "../ProductBundle";

configure({ testIdAttribute: "data-testid" });

jest.mock("../../../atoms/Price", () => ({
  Price: ({ amount, className }: { amount: number; className?: string }) => (
    <span data-testid="price" className={className}>
      {amount}
    </span>
  ),
}));

jest.mock("@acme/platform-core/products/index", () => ({
  PRODUCTS: [
    { id: "1", title: "A", price: 10 },
    { id: "2", title: "B", price: 15 },
    { id: "3", title: "C", price: 20 },
  ],
}));

describe("ProductBundle", () => {
  it("returns null when skus is missing or empty", () => {
    const { container, rerender } = render(<ProductBundle />);

    expect(container.firstChild).toBeNull();

    rerender(<ProductBundle skus={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("calculates price without discount and multiplies by quantity", () => {
    const skus = [
      { id: "1", title: "A", price: 10 },
      { id: "2", title: "B", price: 15 },
    ];
    render(<ProductBundle skus={skus} quantity={2} />);
    const prices = screen
      .getAllByTestId("price")
      .map((el) => Number(el.textContent));
    expect(prices).toEqual([10, 15, 50]);
  });

  it("applies discount to subtotal", () => {
    const skus = [
      { id: "1", title: "A", price: 10 },
      { id: "2", title: "B", price: 15 },
    ];
    render(<ProductBundle skus={skus} quantity={2} discount={20} />);
    const prices = screen
      .getAllByTestId("price")
      .map((el) => Number(el.textContent));
    expect(prices).toEqual([10, 15, 50, 40]);
  });

  it("renders discount badge when discount prop is provided", () => {
    const skus = [
      { id: "1", title: "A", price: 10 },
      { id: "2", title: "B", price: 15 },
    ];
    render(<ProductBundle skus={skus} discount={20} />);

    const prices = screen.getAllByTestId("price");
    expect(prices).toHaveLength(4);
    expect(prices[2]).toHaveClass("line-through");
  });

  it("getRuntimeProps returns first two products", () => {
    expect(getRuntimeProps()).toEqual({ skus: PRODUCTS.slice(0, 2) });
  });
});


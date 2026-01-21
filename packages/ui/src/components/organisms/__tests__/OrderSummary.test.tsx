import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { formatPrice } from "@acme/lib/format";

import OrderSummary from "../OrderSummary";

jest.mock("@acme/ui/hooks/useCart", () => ({
  useCart: () => [{}, jest.fn()],
}));

jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["EUR", jest.fn()],
}));

type TestCartLine = {
  sku: {
    id: string;
    slug: string;
    title: string;
    price: number;
    deposit: number;
    stock: number;
    forSale: boolean;
    forRental: boolean;
    media: unknown[];
    sizes: unknown[];
    description: string;
  };
  qty: number;
};

describe("OrderSummary", () => {
  const format = (amount: number) => formatPrice(amount, "EUR");

  it("renders subtotal and deposit without tax or discount by default", () => {
    const cart: Record<string, TestCartLine> = {
      sku1: {
        sku: {
          id: "sku1",
          slug: "item1",
          title: "Item1",
          price: 10,
          deposit: 2,
          stock: 5,
          forSale: true,
          forRental: false,
          media: [],
          sizes: [],
          description: "",
        },
        qty: 1,
      },
      sku2: {
        sku: {
          id: "sku2",
          slug: "item2",
          title: "Item2",
          price: 5,
          deposit: 1,
          stock: 5,
          forSale: true,
          forRental: false,
          media: [],
          sizes: [],
          description: "",
        },
        qty: 2,
      },
    };

    render(<OrderSummary cart={cart as Parameters<typeof OrderSummary>[0]["cart"]} />);

    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText(format(20))).toBeInTheDocument();
    expect(screen.getByText("Deposit")).toBeInTheDocument();
    expect(screen.getByText(format(4))).toBeInTheDocument();
    expect(screen.queryByText("Tax")).not.toBeInTheDocument();
    expect(screen.queryByText("Discount")).not.toBeInTheDocument();
  });

  it("renders tax and discount rows when provided", () => {
    const totals = { subtotal: 20, deposit: 4, tax: 3, discount: 1, total: 26 };
    render(<OrderSummary cart={{}} totals={totals} />);

    expect(screen.getByText("Tax")).toBeInTheDocument();
    expect(screen.getByText(format(3))).toBeInTheDocument();
    expect(screen.getByText("Discount")).toBeInTheDocument();
    expect(screen.getByText(format(-1))).toBeInTheDocument();
  });
});

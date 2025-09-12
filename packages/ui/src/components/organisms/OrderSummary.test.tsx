import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import OrderSummary from "./OrderSummary";
import { formatPrice } from "@acme/shared-utils";
import type { CartLine } from "@acme/types";

jest.mock("@ui/hooks/useCart", () => ({
  useCart: () => [{}, jest.fn()],
}));

jest.mock("@platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["EUR", jest.fn()],
}));

describe("OrderSummary", () => {
  const format = (amount: number) => formatPrice(amount, "EUR");

  it("renders provided subtotal, tax, and total", () => {
    const cart: Record<string, CartLine> = {
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

    const totals = {
      subtotal: 20,
      deposit: 4,
      tax: 3,
      total: 27,
    };

    render(<OrderSummary cart={cart} totals={totals} />);

    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText(format(totals.subtotal))).toBeInTheDocument();
    expect(screen.getByText("Tax")).toBeInTheDocument();
    expect(screen.getByText(format(totals.tax))).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText(format(totals.total))).toBeInTheDocument();
  });
});


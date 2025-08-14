import { render, screen } from "@testing-library/react";
import OrderSummary from "../OrderSummary";
import { formatPrice } from "@acme/shared-utils";

jest.mock("@ui/hooks/useCart", () => ({
  useCart: () => [{}, jest.fn()],
}));

jest.mock("@platform-core/src/contexts/CurrencyContext", () => ({
  useCurrency: () => ["EUR", jest.fn()],
}));

describe("OrderSummary", () => {
  const format = (amount: number) => formatPrice(amount, "EUR");

  it("renders subtotal and deposit without tax or discount by default", () => {
    const cart = {
      "sku1": {
        sku: { id: "sku1", title: "Item1", price: 10, deposit: 2 },
        qty: 1,
      },
      "sku2": {
        sku: { id: "sku2", title: "Item2", price: 5, deposit: 1 },
        qty: 2,
      },
    };

    render(<OrderSummary cart={cart} />);

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

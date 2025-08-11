import { CartProvider } from "@/contexts/CartContext";
import { render, screen } from "@testing-library/react";
import type { CartState } from "@/lib/cartCookie";
import OrderSummary from "../src/components/organisms/OrderSummary";

const mockCart: CartState = {
  "a:M": {
    sku: {
      id: "a",
      slug: "a",
      title: "Product A",
      price: 10,
      deposit: 2,
      forSale: true,
      forRental: false,
      image: "/a.jpg",
      sizes: [],
      description: "A",
    },
    qty: 2,
    size: "M",
  },
  b: {
    sku: {
      id: "b",
      slug: "b",
      title: "Product B",
      price: 20,
      deposit: 3,
      forSale: true,
      forRental: false,
      image: "/b.jpg",
      sizes: [],
      description: "B",
    },
    qty: 1,
  },
};

describe("OrderSummary", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders quantities, totals and formatted prices", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cart: mockCart }) });

    render(
      <CartProvider>
        <OrderSummary />
      </CartProvider>
    );

    // item rows
    expect(await screen.findByText("Product A")).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
    expect(screen.getByText("Product B")).toBeInTheDocument();
    expect(screen.getByText("2", { selector: "td" })).toBeInTheDocument();
    expect(screen.getByText("1", { selector: "td" })).toBeInTheDocument();

    const fmt = (n: number) =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "EUR",
      }).format(n);

    // per-item totals
    expect(screen.getAllByText(fmt(20)).length).toBe(2);

    const deposit = 2 * 2 + 3 * 1;
    const subtotal = 10 * 2 + 20 * 1;
    const total = deposit + subtotal;

    expect(screen.getByText("Deposit")).toBeInTheDocument();
    expect(screen.getByText(fmt(deposit))).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText(fmt(total))).toBeInTheDocument();
  });
});

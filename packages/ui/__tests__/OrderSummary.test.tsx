import { render, screen } from "@testing-library/react";
import type { CartState } from "@/lib/cartCookie";
import OrderSummary from "../src/components/organisms/OrderSummary";
import { useCart } from "@acme/ui/hooks/useCart";
import { formatPrice } from "@acme/shared-utils";

jest.mock("@acme/ui/hooks/useCart", () => ({
  useCart: jest.fn(),
}));

jest.mock("../src/components/atoms/Price", () => ({
  Price: ({ amount }: { amount: number }) => (
    <span>{formatPrice(amount, "EUR")}</span>
  ),
}));

const mockCart: CartState = {
  "a:S": {
    sku: {
      id: "a",
      slug: "a",
      title: "Product A",
      price: 10,
      deposit: 2,
      forSale: true,
      forRental: false,
      media: [{ url: "/a.jpg", type: "image" }],
      sizes: ["S"],
      description: "A",
    },
    qty: 2,
    size: "S",
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
      media: [{ url: "/b.jpg", type: "image" }],
      sizes: [],
      description: "B",
    },
    qty: 1,
  },
};

describe("OrderSummary", () => {
  const mockUseCart = useCart as jest.Mock;

  it("renders quantities, totals and formatted prices", async () => {
    mockUseCart.mockReturnValue([mockCart, jest.fn()]);

    render(<OrderSummary />);

    // item rows (include size label)
    expect(await screen.findByText("Product A")).toBeInTheDocument();
    expect(screen.getByText("(S)")).toBeInTheDocument();
    expect(screen.getByText("Product B")).toBeInTheDocument();
    expect(screen.getByText("2", { selector: "td" })).toBeInTheDocument();
    expect(screen.getByText("1", { selector: "td" })).toBeInTheDocument();

    const fmt = (n: number) => formatPrice(n, "EUR");

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

  it("uses provided totals when given", async () => {
    mockUseCart.mockReturnValue([{}, jest.fn()]);

    render(<OrderSummary cart={mockCart} totals={{ subtotal: 30, deposit: 7, total: 37 }} />);

    const fmt = (n: number) =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "EUR",
      }).format(n);

    expect(await screen.findByText("Deposit")).toBeInTheDocument();
    expect(screen.getByText(fmt(7))).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText(fmt(37))).toBeInTheDocument();
  });
});

import "@testing-library/jest-dom";
import "../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { CartState } from "@acme/platform-core/cart";

import { CartTemplate } from "../src/components/templates/CartTemplate";

jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));

const cart: CartState = {
  "1": {
    sku: {
      id: "1",
      slug: "product-1",
      title: "Product 1",
      price: 1000,
      deposit: 200,
      stock: 0,
      forSale: true,
      forRental: false,
      media: [{ url: "/img1.jpg", type: "image" }],
      sizes: [],
      description: "",
    },
    qty: 2,
    size: "M",
  },
  "2": {
    sku: {
      id: "2",
      slug: "product-2",
      title: "Product 2",
      price: 500,
      deposit: 0,
      stock: 0,
      forSale: true,
      forRental: false,
      media: [{ url: "/vid1.mp4", type: "video" }],
      sizes: [],
      description: "",
    },
    qty: 1,
  },
};

describe("CartTemplate", () => {
  it("renders empty cart message", () => {
    render(<CartTemplate cart={{}} />);
    expect(screen.getByText("Your cart is empty.")).toBeInTheDocument();
  });

  it("calculates totals for cart lines", () => {
    render(<CartTemplate cart={cart} />);
    expect(screen.getByText("$400.00")).toBeInTheDocument();
    expect(screen.getByText("$2,900.00")).toBeInTheDocument();
  });

  it("fires callbacks on quantity change and removal", async () => {
    const onQtyChange = jest.fn();
    const onRemove = jest.fn();
    render(
      <CartTemplate cart={cart} onQtyChange={onQtyChange} onRemove={onRemove} />
    );

    const incButtons = screen.getAllByRole("button", { name: "+" });
    await userEvent.click(incButtons[0]);
    expect(onQtyChange).toHaveBeenCalledWith("1", 3);

    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    await userEvent.click(removeButtons[1]);
    expect(onRemove).toHaveBeenCalledWith("2");
  });
});


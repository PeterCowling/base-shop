import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { CartTemplate } from "../CartTemplate";
import type { CartState } from "@acme/platform-core/cart";
import "../../../../../../test/resetNextMocks";

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

  it("calculates totals and deposits for mixed SKUs", () => {
    render(<CartTemplate cart={cart} />);
    const depositRow = screen.getByText("Deposit").closest("tr");
    const totalRow = screen.getByText("Total").closest("tr");
    expect(depositRow).toBeTruthy();
    expect(totalRow).toBeTruthy();
    expect(screen.getByText("$400.00")).toBeInTheDocument();
    expect(screen.getByText("$2,900.00")).toBeInTheDocument();
  });

  it("renders media types and handles quantity and removal", async () => {
    const onQtyChange = jest.fn();
    const onRemove = jest.fn();
    const { container } = render(
      <CartTemplate cart={cart} onQtyChange={onQtyChange} onRemove={onRemove} />
    );

    const img = container.querySelector("img");
    const video = container.querySelector("video");
    expect(
      decodeURIComponent(img!.getAttribute("src") || "")
    ).toContain("/img1.jpg");
    expect(video).toHaveAttribute("src", "/vid1.mp4");

    const incButtons = screen.getAllByRole("button", { name: "+" });
    await userEvent.click(incButtons[0]);
    expect(onQtyChange).toHaveBeenCalledWith("1", 3);

    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    await userEvent.click(removeButtons[1]);
    expect(onRemove).toHaveBeenCalledWith("2");
  });
});

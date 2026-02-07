import "@testing-library/jest-dom";
import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { CartState } from "@acme/platform-core/cart";

import { CartTemplate } from "../CartTemplate";

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

const cartWithoutMedia: CartState = {
  "1": {
    sku: {
      id: "3",
      slug: "product-3",
      title: "Product 3",
      price: 1500,
      deposit: 0,
      stock: 0,
      forSale: true,
      forRental: false,
      sizes: [],
      description: "",
    },
    qty: 1,
  },
};

const noDepositCart: CartState = {
  "1": {
    sku: {
      id: "4",
      slug: "product-4",
      title: "Product 4",
      price: 1000,
      deposit: 0,
      stock: 0,
      forSale: true,
      forRental: false,
      media: [{ url: "/img4.jpg", type: "image" }],
      sizes: [],
      description: "",
    },
    qty: 1,
  },
  "2": {
    sku: {
      id: "5",
      slug: "product-5",
      title: "Product 5",
      price: 2000,
      deposit: 0,
      stock: 0,
      forSale: true,
      forRental: false,
      media: [{ url: "/img5.jpg", type: "image" }],
      sizes: [],
      description: "",
    },
    qty: 2,
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

    const img = container.querySelector("input[type=\"image\"]");
    const video = container.querySelector("video");
    expect(video).toHaveAttribute("src", "/vid1.mp4");
    expect(
      decodeURIComponent(img?.getAttribute("src") || "")
    ).toContain("/img1.jpg");

    const incButtons = screen.getAllByRole("button", { name: "+" });
    await userEvent.click(incButtons[0]);
    expect(onQtyChange).toHaveBeenCalledWith("1", 3);

    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    await userEvent.click(removeButtons[1]);
    expect(onRemove).toHaveBeenCalledWith("2");
  });

  it("does not render media when none provided", () => {
    const { container } = render(<CartTemplate cart={cartWithoutMedia} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("video")).toBeNull();
  });

  it("renders size badge when size is provided", () => {
    render(<CartTemplate cart={cart} />);
    expect(screen.getByText("(M)")).toBeInTheDocument();
  });

  it("does not render quantity buttons or remove column without callbacks", () => {
    render(<CartTemplate cart={cart} />);
    expect(screen.queryByRole("button", { name: "+" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "-" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
  });

  it("shows $0.00 deposit when all SKUs have zero deposits", () => {
    render(<CartTemplate cart={noDepositCart} />);
    const depositRow = screen.getByText("Deposit").closest("tr");
    expect(depositRow).toBeTruthy();
    expect(depositRow).toHaveTextContent("$0.00");
  });
});

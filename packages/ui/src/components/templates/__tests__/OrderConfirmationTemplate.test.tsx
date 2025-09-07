import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OrderConfirmationTemplate } from "../OrderConfirmationTemplate";

jest.mock("../../atoms/Price", () => ({
  Price: ({ amount }: any) => <div data-cy="price">{amount}</div>,
}));

const cart = {
  a: {
    sku: {
      id: "a",
      slug: "a",
      title: "Item A",
      price: 100,
      deposit: 10,
      stock: 0,
      forSale: true,
      forRental: false,
      media: [],
      sizes: [],
      description: "",
    },
    qty: 2,
  },
  b: {
    sku: {
      id: "b",
      slug: "b",
      title: "Item B",
      price: 50,
      deposit: 0,
      stock: 0,
      forSale: true,
      forRental: false,
      media: [],
      sizes: [],
      description: "",
    },
    qty: 1,
  },
};

describe("OrderConfirmationTemplate", () => {
  it("renders order summary with totals", () => {
    render(<OrderConfirmationTemplate orderId="123" cart={cart} />);

    expect(screen.getByText("Order Confirmation")).toBeInTheDocument();
    expect(screen.getByText(/123/)).toBeInTheDocument();
    expect(screen.getByText("Item A")).toBeInTheDocument();
    expect(screen.getByText("Item B")).toBeInTheDocument();
    expect(screen.getAllByTestId("price")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ textContent: "200" }),
        expect.objectContaining({ textContent: "50" }),
        expect.objectContaining({ textContent: "20" }),
        expect.objectContaining({ textContent: "270" }),
      ])
    );
  });
});

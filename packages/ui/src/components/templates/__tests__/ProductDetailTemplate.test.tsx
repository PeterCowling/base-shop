import "@testing-library/jest-dom";
import "../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { SKU } from "@acme/types";

import { ProductDetailTemplate } from "../ProductDetailTemplate";

jest.mock("../../atoms/Price", () => ({
  Price: ({ amount }: any) => <div data-cy="price">{amount}</div>,
}));

jest.mock("../../atoms/ProductBadge", () => ({
  ProductBadge: ({ label, variant }: any) => (
    <div data-cy="badge">{label}-{variant}</div>
  ),
}));

describe("ProductDetailTemplate", () => {
  const product: SKU & { badges?: { label: string; variant?: "default" | "sale" | "new" }[] } = {
    id: "1",
    slug: "prod-1",
    title: "Product 1",
    price: 100,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "/img.jpg", type: "image" }],
    sizes: [],
    description: "A product",
    badges: [{ label: "Sale", variant: "sale" }],
  };

  it("renders product details and handles add to cart", async () => {
    const onAdd = jest.fn();
    render(<ProductDetailTemplate product={product} onAddToCart={onAdd} />);

    expect(screen.getByText("Product 1")).toBeInTheDocument();
    expect(screen.getByTestId("price")).toHaveTextContent("100");
    expect(screen.getByTestId("badge")).toHaveTextContent("Sale-sale");

    await userEvent.click(
      screen.getByRole("button", { name: /add to cart/i })
    );
    expect(onAdd).toHaveBeenCalledWith(product);
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { ProductCard } from "../ProductCard";
import type { SKU } from "@acme/types";
import "@testing-library/jest-dom";
import "../../../../../../test/resetNextMocks";

jest.mock("@platform-core/src/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));

describe("ProductCard", () => {
  const product: SKU = {
    id: "1",
    slug: "test-product",
    title: "Test Product",
    price: 9.99,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "/img.jpg", type: "image" }],
    sizes: [],
    description: "",
  };

  it("renders product info and handles add to cart", () => {
    const handleAdd = jest.fn();
    render(<ProductCard product={product} onAddToCart={handleAdd} />);

    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText(/\$9\.99/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(handleAdd).toHaveBeenCalledWith(product);
  });
});

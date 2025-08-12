import { fireEvent, render, screen } from "@testing-library/react";
import { ProductCard, type Product } from "../ProductCard";
import "../../../../../../test/resetNextMocks";

jest.mock("@platform-core/src/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));

describe("ProductCard", () => {
  const product: Product = {
    id: "1",
    title: "Test Product",
    media: [{ url: "/img.jpg", type: "image" }],
    price: 9.99,
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

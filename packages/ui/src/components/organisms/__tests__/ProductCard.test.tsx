import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "../ProductCard";
import type { SKU } from "@acme/types";
import "@testing-library/jest-dom";
import "../../../../../../test/resetNextMocks";

const dispatch = jest.fn();
jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));
jest.mock("@acme/platform-core/contexts/CartContext", () => ({
  useCart: () => [{}, dispatch],
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

  it("renders product info and dispatches add action", async () => {
    const user = userEvent.setup();
    render(<ProductCard product={product} />);

    expect(screen.getByAltText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("$9.99")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(dispatch).toHaveBeenCalledWith({ type: "add", sku: product });
  });
});

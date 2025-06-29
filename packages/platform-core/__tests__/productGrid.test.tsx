import { render, screen } from "@testing-library/react";
import { ProductGrid } from "../components/shop/ProductGrid";
import { CartProvider } from "../contexts/CartContext";
import { PRODUCTS } from "../products";

describe("ProductGrid", () => {
  it("renders all products", () => {
    render(
      <CartProvider>
        <ProductGrid skus={[PRODUCTS[0], PRODUCTS[1]]} />
      </CartProvider>
    );
    expect(screen.getAllByRole("article").length).toBe(2);
  });
});

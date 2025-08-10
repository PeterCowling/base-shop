import { render, screen } from "@testing-library/react";
import { ProductGrid } from "../src/components/shop/ProductGrid";
import { CartProvider } from "../src/contexts/CartContext";
import { PRODUCTS } from "../src/products";

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

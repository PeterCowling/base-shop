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

  it("honors explicit column count", () => {
    render(
      <CartProvider>
        <ProductGrid skus={[PRODUCTS[0], PRODUCTS[1]]} columns={2} data-testid="grid" />
      </CartProvider>
    );
    const grid = screen.getByTestId("grid");
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" });
  });
});

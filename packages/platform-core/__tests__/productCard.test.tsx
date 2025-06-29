import { render, screen } from "@testing-library/react";
import { ProductCard } from "../components/shop/ProductCard";
import { CartProvider } from "../contexts/CartContext";
import { PRODUCTS } from "../products";

describe("ProductCard", () => {
  it("renders image with sizes attribute", () => {
    render(
      <CartProvider>
        <ProductCard sku={PRODUCTS[0]} />
      </CartProvider>
    );
    const img = screen.getByAltText(PRODUCTS[0].title);
    expect(img).toHaveAttribute("sizes", "(min-width: 640px) 25vw, 50vw");
  });
});

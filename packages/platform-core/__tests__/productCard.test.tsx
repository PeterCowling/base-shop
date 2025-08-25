import { render, screen } from "@testing-library/react";
import { ProductCard } from "../src/components/shop/ProductCard";
import { CartProvider } from "../src/contexts/CartContext";
import { CurrencyProvider } from "../src/contexts/CurrencyContext";
import { PRODUCTS } from "../src/products/index";

describe("ProductCard", () => {
  it("renders image with sizes attribute", () => {
    render(
      <CurrencyProvider>
        <CartProvider>
          <ProductCard sku={PRODUCTS[0]} />
        </CartProvider>
      </CurrencyProvider>
    );
    const img = screen.getByAltText(PRODUCTS[0].title);
    expect(img).toHaveAttribute("sizes", "(min-width: 640px) 25vw, 50vw");
  });
});

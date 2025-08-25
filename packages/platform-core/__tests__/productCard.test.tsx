import { render, screen } from "@testing-library/react";
import { ProductCard } from "../src/components/shop/ProductCard";
import { CartProvider } from "../src/contexts/CartContext";
import { CurrencyProvider } from "../src/contexts/CurrencyContext";
import { PRODUCTS } from "../src/products/index";

describe("ProductCard", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders image with sizes attribute", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ cart: {} }) });

    render(
      <CurrencyProvider>
        <CartProvider>
          <ProductCard sku={PRODUCTS[0]} />
        </CartProvider>
      </CurrencyProvider>
    );

    const img = await screen.findByAltText(PRODUCTS[0].title);
    expect(img).toHaveAttribute("sizes", "(min-width: 640px) 25vw, 50vw");
  });
});

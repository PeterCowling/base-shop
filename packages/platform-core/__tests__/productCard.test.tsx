import React from "react";
import { render, screen } from "@testing-library/react";
import { ProductCard, Price } from "../src/components/shop/ProductCard";
import { CartProvider } from "../src/contexts/CartContext";
import { CurrencyProvider } from "../src/contexts/CurrencyContext";
import type { SKU } from "@acme/types";
import { PRODUCTS } from "../src/products/index";

describe("ProductCard", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ cart: {} }) });
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function renderCard(sku: SKU) {
    return render(
      <CurrencyProvider>
        <CartProvider>
          <ProductCard sku={sku} />
        </CartProvider>
      </CurrencyProvider>
    );
  }

  it("skips media when SKU has none", () => {
    const sku = {
      id: "n1",
      slug: "no-media",
      title: "No media",
      price: 10,
      media: [],
      sizes: [],
    } as unknown as SKU;

    const { container } = renderCard(sku);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("video")).toBeNull();
  });

  it("renders first media item as image", async () => {
    const sku = {
      id: "i1",
      slug: "image-media",
      title: "Image media",
      price: 10,
      media: [{ type: "image", url: "/test.jpg" }],
      sizes: [],
    } as unknown as SKU;

    renderCard(sku);
    const img = await screen.findByAltText("Image media");
    expect(img).toBeInTheDocument();
  });

  it("renders first media item as video", () => {
    const sku = {
      id: "v1",
      slug: "video-media",
      title: "Video media",
      price: 10,
      media: [{ type: "video", url: "/test.mp4" }],
      sizes: [],
    } as unknown as SKU;

    const { container } = renderCard(sku);
    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "/test.mp4");
  });

  it("links to product detail page", () => {
    const sku = PRODUCTS[0];
    renderCard(sku);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `../product/${sku.slug}`);
  });

  it("includes AddToCartButton", () => {
    const sku = PRODUCTS[0];
    renderCard(sku);
    expect(
      screen.getByRole("button", { name: /add to cart/i })
    ).toBeInTheDocument();
  });
});

describe("Price", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uses provided currency prop instead of context", () => {
    window.localStorage.setItem("PREFERRED_CURRENCY", "USD");

    render(
      <CurrencyProvider>
        <Price amount={10} currency="GBP" />
      </CurrencyProvider>
    );

    expect(screen.getByText("£10.00")).toBeInTheDocument();
  });

  it("falls back to currency from context when prop missing", () => {
    window.localStorage.setItem("PREFERRED_CURRENCY", "USD");

    render(
      <CurrencyProvider>
        <Price amount={10} />
      </CurrencyProvider>
    );

    expect(screen.getByText("$10.00")).toBeInTheDocument();
  });
});

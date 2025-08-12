import React from "react";
import { render, waitFor, act } from "@testing-library/react";
import { RecommendationCarousel } from "../src/components/organisms/RecommendationCarousel";
import type { Product } from "../src/components/organisms/ProductCard";

jest.mock("../src/components/organisms/ProductCard", () => ({
  ProductCard: ({ product }: { product: Product }) => (
    <div data-testid={`product-${product.id}`} />
  ),
}));

const products: Product[] = Array.from({ length: 3 }).map((_, i) => ({
  id: String(i + 1),
  title: `Product ${i + 1}`,
  image: "",
  price: (i + 1) * 10,
}));

describe("RecommendationCarousel", () => {
  beforeEach(() => {
    // @ts-expect-error mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => products,
    });
  });

  it("clamps item count between min and max based on screen width", async () => {
    Object.defineProperty(window, "innerWidth", { value: 5000, configurable: true });
    const { container } = render(
      <RecommendationCarousel endpoint="/api" minItems={1} maxItems={3} />
    );
    await waitFor(() =>
      expect(container.querySelectorAll(".snap-start").length).toBe(products.length)
    );
    const slide = container.querySelector(".snap-start") as HTMLElement;
    const maxWidth = `0 0 ${100 / 3}%`;
    expect(slide.style.flex).toBe(maxWidth);

    Object.defineProperty(window, "innerWidth", { value: 100, configurable: true });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    await waitFor(() => expect(slide.style.flex).toBe("0 0 100%"));

    const calledUrl = (fetch as jest.Mock).mock.calls[0][0] as URL;
    expect(calledUrl.searchParams.get("minItems")).toBe("1");
    expect(calledUrl.searchParams.get("maxItems")).toBe("3");
  });

  it("uses explicit item counts when provided", async () => {
    Object.defineProperty(window, "innerWidth", { value: 1200, configurable: true });
    let seen = 0;
    render(
      <RecommendationCarousel
        endpoint="/api"
        desktopItems={3}
        tabletItems={2}
        mobileItems={1}
        getSlideWidth={(n) => {
          seen = n;
          return `${100 / n}%`;
        }}
      />
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(seen).toBe(3);

    Object.defineProperty(window, "innerWidth", { value: 800, configurable: true });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(seen).toBe(2);

    Object.defineProperty(window, "innerWidth", { value: 500, configurable: true });
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(seen).toBe(1);
  });
});

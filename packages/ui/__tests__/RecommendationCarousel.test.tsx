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
  images: [{ url: "", type: "image" }],
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
});

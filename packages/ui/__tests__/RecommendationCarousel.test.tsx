import React from "react";
import { act, fireEvent,render, waitFor } from "@testing-library/react";

import type { SKU } from "@acme/types";

import { RecommendationCarousel } from "../src/components/organisms/RecommendationCarousel";

jest.mock("../src/components/organisms/ProductCard", () => ({
  ProductCard: ({ product }: { product: SKU }) => (
    <div data-testid={`product-${product.id}`} />
  ),
}));

const products: SKU[] = Array.from({ length: 3 }).map((_, i) => ({
  id: String(i + 1),
  slug: `product-${i + 1}`,
  title: `Product ${i + 1}`,
  price: (i + 1) * 10,
  deposit: 0,
  stock: 0,
  forSale: true,
  forRental: false,
  media: [{ url: "", type: "image" }],
  sizes: [],
  description: "",
}));

describe("RecommendationCarousel", () => {
  beforeEach(() => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => products,
      }) as unknown as typeof fetch;
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

  it("renders nothing when fetch fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    } as unknown as Response);
    const { container } = render(<RecommendationCarousel endpoint="/api" />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it("returns null when API provides no products", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as unknown as Response);
    const { container } = render(<RecommendationCarousel endpoint="/api" />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it("pauses autoplay on hover and resumes afterward", async () => {
    jest.useFakeTimers();
    const { container } = render(<RecommendationCarousel endpoint="/api" />);
    await waitFor(() => expect(container.querySelector(".flex")).toBeTruthy());
    const scroller = container.querySelector(".flex") as HTMLDivElement;
    const scrollSpy = jest.fn();
    Object.defineProperty(scroller, "scrollTo", { value: scrollSpy });

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(scrollSpy).toHaveBeenCalledTimes(1);

    const outer = container.firstChild as HTMLElement;
    act(() => {
      fireEvent.mouseEnter(outer);
    });
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(scrollSpy).toHaveBeenCalledTimes(1);

    act(() => {
      fireEvent.mouseLeave(outer);
    });
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(scrollSpy).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
});

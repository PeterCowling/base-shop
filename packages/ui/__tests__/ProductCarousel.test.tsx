import React from "react";
import { render, act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCarousel } from "../src/components/organisms/ProductCarousel";
import type { Product } from "../src/components/organisms/ProductCard";

jest.mock("../src/components/organisms/ProductCard", () => ({
  ProductCard: ({ product }: { product: Product }) => (
    <div data-testid={`product-${product.id}`} />
  ),
}));

const products: Product[] = Array.from({ length: 5 }).map((_, i) => ({
  id: String(i + 1),
  title: `Product ${i + 1}`,
  media: [{ url: "", type: "image" }],
  price: (i + 1) * 10,
}));

let resizeCb: ResizeObserverCallback;

beforeEach(() => {
  // @ts-expect-error jsdom lacks ResizeObserver
  global.ResizeObserver = class {
    constructor(cb: ResizeObserverCallback) {
      resizeCb = cb;
    }
    observe() {}
    disconnect() {}
  };
});

describe("ProductCarousel", () => {
  it("uses minItems when container is narrow", () => {
    const { container } = render(
      <ProductCarousel products={products} minItems={2} maxItems={5} />
    );
    const root = container.firstChild as HTMLElement;
    Object.defineProperty(root, "clientWidth", {
      value: 100,
      configurable: true,
    });
    act(() => resizeCb([]));
    const slide = container.querySelector(".snap-start") as HTMLElement;
    expect(slide.style.flex).toBe("0 0 50%");
  });

  it("clamps to maxItems on wide containers", () => {
    const { container } = render(
      <ProductCarousel products={products} minItems={1} maxItems={3} />
    );
    const root = container.firstChild as HTMLElement;
    Object.defineProperty(root, "clientWidth", {
      value: 2000,
      configurable: true,
    });
    act(() => resizeCb([]));
    const slide = container.querySelector(".snap-start") as HTMLElement;
    const expected = `0 0 ${100 / 3}%`;
    expect(slide.style.flex).toBe(expected);
  });

  it("navigates with arrows and loops", async () => {
    const user = userEvent.setup();
    const { container } = render(<ProductCarousel products={products} />);
    const scroller = container.querySelector(".flex") as HTMLElement;
    Object.defineProperty(scroller, "clientWidth", {
      value: 100,
      configurable: true,
    });
    const scrollTo = jest.fn();
    // @ts-expect-error jsdom
    scroller.scrollTo = scrollTo;

    const next = screen.getByRole("button", { name: /next/i });
    const prev = screen.getByRole("button", { name: /previous/i });

    await user.click(next);
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 100, behavior: "smooth" });

    for (let i = 1; i < products.length; i++) {
      await user.click(next);
    }
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 0, behavior: "smooth" });

    await user.click(prev);
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 400, behavior: "smooth" });
  });

  it("renders null when products array is empty", () => {
    const { container } = render(<ProductCarousel products={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

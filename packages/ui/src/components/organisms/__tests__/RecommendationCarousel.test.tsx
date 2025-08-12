import { render, waitFor } from "@testing-library/react";
import { RecommendationCarousel } from "../RecommendationCarousel";
import type { Product } from "../ProductCard";

jest.mock("../ProductCard", () => ({
  ProductCard: ({ product }: { product: Product }) => (
    <div data-testid={`product-${product.id}`} />
  ),
}));

const products: Product[] = [
  { id: "1", title: "A", images: [{ url: "", type: "image" }], price: 1 },
  { id: "2", title: "B", images: [{ url: "", type: "image" }], price: 2 },
];

describe("RecommendationCarousel responsive counts", () => {
  beforeEach(() => {
    // @ts-expect-error mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => products,
    });
  });

  function setWidth(width: number) {
    Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
  }

  it("uses desktopItems for wide viewports", async () => {
    setWidth(1200);
    const { container } = render(
      <RecommendationCarousel
        endpoint="/api"
        desktopItems={4}
        tabletItems={2}
        mobileItems={1}
      />
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await waitFor(() =>
      expect(container.querySelector(".snap-start")).toBeTruthy()
    );
    const slide = container.querySelector(".snap-start") as HTMLElement;
    expect(slide.style.flex).toBe("0 0 25%");
  });
});

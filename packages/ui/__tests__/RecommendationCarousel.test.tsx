import { act, render, waitFor } from "@testing-library/react";
import { RecommendationCarousel } from "../src/components/organisms/RecommendationCarousel";

jest.mock("../src/components/organisms/ProductCard", () => ({
  ProductCard: ({ product }: any) => <div data-testid={product.id} />,
}));

type Product = { id: string; title: string; image: string; price: number };

describe("RecommendationCarousel responsive display", () => {
  const products: Product[] = Array.from({ length: 3 }).map((_, i) => ({
    id: String(i),
    title: `P${i}`,
    image: "",
    price: i,
  }));

  const originalFetch = global.fetch;
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => products,
    }) as any;
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  function setWidth(w: number) {
    // @ts-ignore
    window.innerWidth = w;
    window.dispatchEvent(new Event("resize"));
  }

  it("clamps items per slide between min and max", async () => {
    setWidth(400);
    const { container } = render(
      <RecommendationCarousel
        endpoint="/api"
        minItemsPerSlide={1}
        maxItemsPerSlide={4}
      />
    );
    await waitFor(() =>
      expect(container.querySelectorAll(".snap-start").length).toBe(products.length)
    );
    const slide = container.querySelector(".snap-start") as HTMLElement;
    expect(slide).toHaveStyle({ flex: "0 0 100%" });

    act(() => setWidth(1600));
    expect(slide).toHaveStyle({ flex: "0 0 25%" });
  });
});

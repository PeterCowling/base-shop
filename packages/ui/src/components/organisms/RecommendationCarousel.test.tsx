import { render, screen, waitFor } from "@testing-library/react";
import { RecommendationCarousel } from "./RecommendationCarousel";
import type { SKU } from "@acme/types";

jest.mock("./ProductCard", () => ({
  ProductCard: ({ product }: { product: SKU }) => (
    <a href={`/products/${product.slug}`} data-cy={`product-${product.id}`}>
      {product.title}
    </a>
  ),
}));

const products: SKU[] = [
  {
    id: "1",
    slug: "a",
    title: "A",
    price: 1,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "", type: "image" }],
    sizes: [],
    description: "",
  },
  {
    id: "2",
    slug: "b",
    title: "B",
    price: 2,
    deposit: 0,
    stock: 0,
    forSale: true,
    forRental: false,
    media: [{ url: "", type: "image" }],
    sizes: [],
    description: "",
  },
];

describe("RecommendationCarousel", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => products,
    }) as unknown as typeof fetch;
  });

  it("renders fetched items and provides navigation links", async () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1200,
      configurable: true,
    });

    render(<RecommendationCarousel endpoint="/api/recs" desktopItems={2} />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const calledUrl = new URL((fetch as jest.Mock).mock.calls[0][0]);
    expect(calledUrl.searchParams.get("minItems")).toBe("1");
    expect(calledUrl.searchParams.get("maxItems")).toBe("4");

    const first = await screen.findByTestId("product-1");
    const second = screen.getByTestId("product-2");

    expect(first).toHaveAttribute("href", "/products/a");
    expect(second).toHaveAttribute("href", "/products/b");

    const slides = [first.parentElement!, second.parentElement!];
    slides.forEach((slide) => {
      expect(slide).toHaveClass("snap-start");
      expect(slide).toHaveStyle("flex: 0 0 50%");
    });

    const scrollContainer = slides[0].parentElement!;
    expect(scrollContainer).toHaveClass("snap-x");
    expect(scrollContainer).toHaveClass("overflow-x-auto");
  });
});

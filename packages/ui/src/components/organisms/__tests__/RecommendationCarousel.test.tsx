/* i18n-exempt file -- tests use literal product titles and labels */
import { render, waitFor } from "@testing-library/react";
import { RecommendationCarousel } from "../RecommendationCarousel";
import type { SKU } from "@acme/types";

jest.mock("../ProductCard", () => ({
  ProductCard: ({ product }: { product: SKU }) => (
    <div data-cy={`product-${product.id}`} />
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

describe("RecommendationCarousel responsive counts", () => {
  beforeEach(() => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => products,
      }) as unknown as typeof fetch;
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

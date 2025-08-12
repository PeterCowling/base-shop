import { render, waitFor, act } from "@testing-library/react";
import { RecommendationCarousel, type Product } from "../RecommendationCarousel";
import "../../../../../../test/resetNextMocks";

jest.mock("@platform-core/src/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));

const products: Product[] = [
  { id: "1", title: "A", image: "/a.jpg", price: 1 },
  { id: "2", title: "B", image: "/b.jpg", price: 2 },
];

describe("RecommendationCarousel viewport counts", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => products,
    }) as any;
  });

  afterEach(() => {
    (global.fetch as jest.Mock).mockRestore();
  });

  it("uses desktopItems for wide viewports", async () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1200,
      configurable: true,
    });
    const { container } = render(
      <RecommendationCarousel
        endpoint="/api"
        desktopItems={4}
        tabletItems={2}
        mobileItems={1}
      />
    );
    await act(async () => {});
    await waitFor(() => expect(container.querySelector(".snap-start")).toBeTruthy());
    const slide = container.querySelector(".snap-start") as HTMLElement;
    expect(slide.style.flex).toBe("0 0 25%");
  });

  it("uses mobileItems for narrow viewports", async () => {
    Object.defineProperty(window, "innerWidth", {
      value: 400,
      configurable: true,
    });
    const { container } = render(
      <RecommendationCarousel
        endpoint="/api"
        desktopItems={4}
        tabletItems={2}
        mobileItems={1}
      />
    );
    await act(async () => {});
    await waitFor(() => expect(container.querySelector(".snap-start")).toBeTruthy());
    const slide = container.querySelector(".snap-start") as HTMLElement;
    expect(slide.style.flex).toBe("0 0 100%");
  });
});


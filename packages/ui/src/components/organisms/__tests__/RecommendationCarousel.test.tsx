/* i18n-exempt file -- tests use literal product titles and labels */
import { act,fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { SKU } from "@acme/types";

import { RecommendationCarousel } from "../RecommendationCarousel";

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

  afterEach(() => {
    jest.useRealTimers();
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

  it("supports manual navigation via controls and keyboard", async () => {
    jest.useFakeTimers();
    Object.defineProperty(window, "innerWidth", {
      value: 1280,
      configurable: true,
    });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const { container } = render(
      <RecommendationCarousel
        products={[...products, { ...products[0], id: "3" }]}
        showArrows
        showDots
        loop={false}
        minItems={1}
        maxItems={1}
      />
    );

    await waitFor(() =>
      expect(container.querySelector(".snap-x")).toBeTruthy()
    );
    const scroller = container.querySelector(".snap-x") as HTMLDivElement;
    Object.defineProperty(scroller, "clientWidth", {
      value: 200,
      configurable: true,
    });
    const scrollTo = jest.fn();
    scroller.scrollTo = scrollTo;

    const prev = screen.getByRole("button", { name: /previous/i });
    const next = screen.getByRole("button", { name: /next/i });
    expect(prev).toBeDisabled();
    expect(next).toBeEnabled();

    await user.click(next);
    await waitFor(() => expect(scrollTo).toHaveBeenLastCalledWith({
      behavior: "smooth",
      left: 200,
    }));

    expect(prev).toBeEnabled();

    const dots = screen.getAllByRole("button", { name: /go to page/i });
    await waitFor(() => expect(dots[1].className).toContain("bg-primary"));

    await user.click(prev);
    await waitFor(() => expect(scrollTo).toHaveBeenLastCalledWith({
      behavior: "smooth",
      left: 0,
    }));

    const region = screen.getByRole("region", { name: /recommended products/i });
    region.focus();
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(scrollTo).toHaveBeenLastCalledWith({
      behavior: "smooth",
      left: 200,
    }));

    await user.click(dots[0]);
    await waitFor(() => expect(scrollTo).toHaveBeenLastCalledWith({
      behavior: "smooth",
      left: 0,
    }));

    jest.useRealTimers();
  });

  it("supports swipe gestures to change pages", async () => {
    jest.useFakeTimers();
    const { container } = render(
      <RecommendationCarousel
        products={[...products, { ...products[0], id: "3" }]}
        showArrows
        showDots
        loop={false}
        minItems={1}
        maxItems={1}
      />
    );

    await waitFor(() =>
      expect(container.querySelector(".snap-x")).toBeTruthy()
    );
    const scroller = container.querySelector(".snap-x") as HTMLDivElement;
    Object.defineProperty(scroller, "clientWidth", {
      value: 200,
      configurable: true,
    });
    const scrollTo = jest.fn();
    scroller.scrollTo = scrollTo;

    fireEvent.touchStart(scroller, {
      touches: [{ clientX: 200, clientY: 0 }],
    } as unknown as TouchEvent);
    fireEvent.touchMove(scroller, {
      touches: [{ clientX: 80, clientY: 0 }],
    } as unknown as TouchEvent);
    fireEvent.touchEnd(scroller);

    await waitFor(() => expect(scrollTo).toHaveBeenLastCalledWith({
      behavior: "smooth",
      left: 200,
    }));

    fireEvent.touchStart(scroller, {
      touches: [{ clientX: 200, clientY: 0 }],
    } as unknown as TouchEvent);
    fireEvent.touchMove(scroller, {
      touches: [{ clientX: 180, clientY: 0 }],
    } as unknown as TouchEvent);
    fireEvent.touchEnd(scroller);

    await waitFor(() => expect(scrollTo).toHaveBeenLastCalledWith({
      behavior: "smooth",
      left: 200,
    }));
  });

  it("autoplays through pages and stops when looping is disabled", async () => {
    jest.useFakeTimers();
    const { container } = render(
      <RecommendationCarousel
        products={[...products]}
        showDots
        loop={false}
        minItems={1}
        maxItems={1}
      />
    );

    const scroller = await waitFor(() => {
      const node = container.querySelector(".snap-x") as HTMLDivElement | null;
      expect(node).toBeTruthy();
      return node!;
    });
    Object.defineProperty(scroller, "clientWidth", {
      value: 200,
      configurable: true,
    });
    const scrollTo = jest.fn();
    scroller.scrollTo = scrollTo;

    await waitFor(() => expect(jest.getTimerCount()).toBeGreaterThan(0));
    jest.advanceTimersByTime(3000);
    await waitFor(() => expect(scrollTo).toHaveBeenCalledTimes(1));
    expect(scrollTo).toHaveBeenLastCalledWith({ behavior: "smooth", left: 200 });

    jest.advanceTimersByTime(3000);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("syncs the active page with scroll position", async () => {
    const { container } = render(
      <RecommendationCarousel
        products={[...products, { ...products[0], id: "3" }]}
        showDots
        minItems={1}
        maxItems={1}
      />
    );

    const scroller = await waitFor(() => {
      const node = container.querySelector(".snap-x") as HTMLDivElement | null;
      expect(node).toBeTruthy();
      return node!;
    });
    Object.defineProperty(scroller, "clientWidth", {
      value: 200,
      configurable: true,
    });
    const dots = screen.getAllByRole("button", { name: /go to page/i });

    Object.defineProperty(scroller, "scrollLeft", {
      value: 200,
      configurable: true,
    });
    await act(async () => {
      scroller.dispatchEvent(new Event("scroll"));
    });

    await waitFor(() => expect(dots[1].className).toContain("bg-primary"));
  });

  it("renders an error state when fetching recommendations fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = jest.fn().mockRejectedValue(new Error("nope"));
    const ErrorState = () => <div role="status">failed</div>;

    render(
      <RecommendationCarousel
        endpoint="/api"
        ErrorState={ErrorState}
      />
    );

    expect(await screen.findByRole("status")).toHaveTextContent("failed");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

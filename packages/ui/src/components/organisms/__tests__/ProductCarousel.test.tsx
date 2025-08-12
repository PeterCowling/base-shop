import { render } from "@testing-library/react";
import { ProductCarousel, type Product } from "../ProductCarousel";
import "../../../../../../test/resetNextMocks";

function mockResize(width: number) {
  (global as any).ResizeObserver = class {
    cb: ResizeObserverCallback;
    constructor(cb: ResizeObserverCallback) {
      this.cb = cb;
    }
    observe(el: Element) {
      Object.defineProperty(el, "clientWidth", { value: width, configurable: true });
      this.cb([{ target: el } as ResizeObserverEntry], this);
    }
    disconnect() {}
    unobserve() {}
  } as any;
}

const products: Product[] = [
  { id: "1", title: "A", image: "/a.jpg", price: 1 },
  { id: "2", title: "B", image: "/b.jpg", price: 2 },
];

describe("ProductCarousel viewport counts", () => {
  it("uses desktopItems for wide containers", () => {
    mockResize(1200);
    const { container } = render(
      <ProductCarousel
        products={products}
        desktopItems={4}
        tabletItems={2}
        mobileItems={1}
      />
    );
    const slide = container.querySelector(".snap-start") as HTMLElement;
    expect(slide.style.flex).toBe("0 0 25%");
  });

  it("uses mobileItems for narrow containers", () => {
    mockResize(400);
    const { container } = render(
      <ProductCarousel
        products={products}
        desktopItems={4}
        tabletItems={2}
        mobileItems={1}
      />
    );
    const slide = container.querySelector(".snap-start") as HTMLElement;
    expect(slide.style.flex).toBe("0 0 100%");
  });
});

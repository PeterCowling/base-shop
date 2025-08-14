import { render } from "@testing-library/react";
import { ProductGrid, type Product } from "../ProductGrid";
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
  {
    id: "1",
    title: "A",
    media: [{ type: "image", url: "/a.jpg" }],
    price: 1,
  },
  {
    id: "2",
    title: "B",
    media: [{ type: "image", url: "/b.jpg" }],
    price: 2,
  },
];

describe("ProductGrid viewport counts", () => {
  it("uses desktopItems for wide containers", () => {
    mockResize(1200);
    const { container } = render(
      <ProductGrid
        products={products}
        desktopItems={4}
        tabletItems={2}
        mobileItems={1}
        showPrice={false}
      />
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe(
      "repeat(4, minmax(0, 1fr))"
    );
  });

  it("uses mobileItems for narrow containers", () => {
    mockResize(400);
    const { container } = render(
      <ProductGrid
        products={products}
        desktopItems={4}
        tabletItems={2}
        mobileItems={1}
        showPrice={false}
      />
    );
    const grid = container.firstChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe(
      "repeat(1, minmax(0, 1fr))"
    );
  });
});

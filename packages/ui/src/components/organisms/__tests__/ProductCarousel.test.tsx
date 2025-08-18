import { render } from "@testing-library/react";
import { ProductCarousel, type Product } from "../ProductCarousel";
import { CurrencyProvider } from "@acme/platform-core/contexts/CurrencyContext";
import "../../../../../../test/resetNextMocks";

jest.mock(
  "@platform-core/contexts/CurrencyContext",
  () => require("../../../../../../test/__mocks__/currencyContextMock")
);

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

describe("ProductCarousel viewport counts", () => {
  it("uses desktopItems for wide containers", () => {
    mockResize(1200);
    const { container } = render(
      <CurrencyProvider>
        <ProductCarousel
          products={products}
          desktopItems={4}
          tabletItems={2}
          mobileItems={1}
        />
      </CurrencyProvider>
    );
    const slide = container.querySelector(".snap-start") as HTMLElement;
    expect(slide.style.flex).toBe("0 0 25%");
  });

  it("uses mobileItems for narrow containers", () => {
    mockResize(400);
    const { container } = render(
      <CurrencyProvider>
        <ProductCarousel
          products={products}
          desktopItems={4}
          tabletItems={2}
          mobileItems={1}
        />
      </CurrencyProvider>
    );
    const slide = container.querySelector(".snap-start") as HTMLElement;
    expect(slide.style.flex).toBe("0 0 100%");
  });
});

/* i18n-exempt file -- tests use literal titles and UI labels */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCarousel, type Product } from "../ProductCarousel";
import { CurrencyProvider } from "@acme/platform-core/contexts/CurrencyContext";
import "../../../../../../test/resetNextMocks";

// Avoid TDZ issues with jest.mock hoisting by requiring inside the factory
jest.mock(
  "@acme/platform-core/contexts/CurrencyContext",
  () => require("~test/__mocks__/currencyContextMock.tsx")
);

jest.mock("@acme/platform-core/contexts/CartContext", () => ({
  useCart: () => [{}, jest.fn()],
}));

jest.mock("../../atoms/shadcn", () => require("~test/__mocks__/shadcnDialogStub.tsx"));


function mockResize(width: number) {
  class MockResizeObserver implements ResizeObserver {
    private cb: ResizeObserverCallback;
    constructor(cb: ResizeObserverCallback) {
      this.cb = cb;
    }
    observe(el: Element): void {
      Object.defineProperty(el, "clientWidth", {
        value: width,
        configurable: true,
      });
      this.cb([{ target: el } as ResizeObserverEntry], this);
    }
    disconnect(): void {}
    unobserve(): void {}
  }
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
    (MockResizeObserver as unknown as typeof ResizeObserver);
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

  it("uses tabletItems for medium containers", () => {
    mockResize(800);
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
    expect(slide.style.flex).toBe("0 0 50%");
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

describe("ProductCarousel slide width", () => {
  it("allows custom getSlideWidth", () => {
    mockResize(1200);
    const custom = jest.fn().mockReturnValue("80px");
    const { container } = render(
      <CurrencyProvider>
        <ProductCarousel
          products={products}
          desktopItems={4}
          tabletItems={2}
          mobileItems={1}
          getSlideWidth={custom}
        />
      </CurrencyProvider>
    );
    expect(custom).toHaveBeenCalledWith(4);
    const slide = container.querySelector(".snap-start") as HTMLElement;
    expect(slide.style.flex).toBe("0 0 80px");
  });
});

describe("ProductCarousel quick view", () => {
  it("opens and closes quick view", async () => {
    mockResize(1200);
    const user = userEvent.setup();
    render(
      <CurrencyProvider>
        <ProductCarousel products={products} enableQuickView />
      </CurrencyProvider>
    );
    expect(screen.queryByTestId("quick-view")).toBeNull();
    const btn = screen.getByRole("button", { name: /quick view a/i });
    await user.click(btn);
    expect(screen.getByTestId("quick-view")).toHaveTextContent("A");
    await user.click(screen.getByTestId("close-quick-view"));
    expect(screen.queryByTestId("quick-view")).toBeNull();
  });
});

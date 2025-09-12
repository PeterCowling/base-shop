import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCarousel, type Product } from "./ProductCarousel";
import { CurrencyProvider } from "@acme/platform-core/contexts/CurrencyContext";
import "../../../../../test/resetNextMocks";

jest.mock(
  "@platform-core/contexts/CurrencyContext",
  () => require("../../../../../test/__mocks__/currencyContextMock")
);

jest.mock("@platform-core/contexts/CartContext", () => ({
  useCart: () => [{}, jest.fn()],
}));

jest.mock(
  "../atoms/shadcn",
  () => require("../../../../../test/__mocks__/shadcnDialogStub.tsx")
);

const products: Product[] = [
  { id: "1", title: "A", media: [{ type: "image", url: "/a.jpg" }], price: 1 },
  { id: "2", title: "B", media: [{ type: "image", url: "/b.jpg" }], price: 2 },
  { id: "3", title: "C", media: [{ type: "image", url: "/c.jpg" }], price: 3 },
];

let resizeCb: ResizeObserverCallback;

beforeEach(() => {
  // @ts-expect-error jsdom lacks ResizeObserver
  global.ResizeObserver = class {
    constructor(cb: ResizeObserverCallback) {
      resizeCb = cb;
    }
    observe() {}
    disconnect() {}
    unobserve() {}
  };
});

describe("ProductCarousel interactions", () => {
  it("handles arrow clicks and responsive item counts", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CurrencyProvider>
        <ProductCarousel
          products={products}
          desktopItems={4}
          tabletItems={2}
          mobileItems={1}
          enableQuickView
        />
      </CurrencyProvider>
    );
    const root = container.firstChild as HTMLElement;

    Object.defineProperty(root, "clientWidth", { value: 1200, configurable: true });
    act(() => resizeCb([]));
    let slide = container.querySelector(".snap-start") as HTMLElement;
    expect(slide.style.flex).toBe("0 0 25%");

    await user.click(screen.getByRole("button", { name: /quick view a/i }));
    expect(screen.getByTestId("quick-view")).toHaveTextContent("A");
    await user.click(screen.getByTestId("close-quick-view"));
    expect(screen.queryByTestId("quick-view")).toBeNull();

    Object.defineProperty(root, "clientWidth", { value: 800, configurable: true });
    act(() => resizeCb([]));
    slide = container.querySelector(".snap-start") as HTMLElement;
    expect(slide.style.flex).toBe("0 0 50%");

    Object.defineProperty(root, "clientWidth", { value: 400, configurable: true });
    act(() => resizeCb([]));
    slide = container.querySelector(".snap-start") as HTMLElement;
    expect(slide.style.flex).toBe("0 0 100%");
  });
});


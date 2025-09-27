/* i18n-exempt file -- tests use literal product titles and labels */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ProductGrid, type Product } from "../ProductGrid";
import "../../../../../../test/resetNextMocks";

jest.mock("@acme/platform-core/contexts/CartContext", () => ({
  useCart: () => [{}, jest.fn()],
}));

function mockResize(initialWidth: number) {
  let cb!: ResizeObserverCallback;
  let element: Element | undefined;

  const observerStub: ResizeObserver = {
    observe: () => {},
    unobserve: () => {},
    disconnect: () => {},
  } as unknown as ResizeObserver;

  class MockResizeObserver implements ResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      cb = callback;
    }
    observe(el: Element): void {
      element = el;
      Object.defineProperty(el, "clientWidth", {
        value: initialWidth,
        configurable: true,
      });
      cb([{ target: el } as ResizeObserverEntry], observerStub);
    }
    disconnect(): void {}
    unobserve(): void {}
  }

  (globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
    (MockResizeObserver as unknown as typeof ResizeObserver);

  return (width: number) => {
    if (!element) return;
    Object.defineProperty(element, "clientWidth", {
      value: width,
      configurable: true,
    });
    cb([{ target: element } as ResizeObserverEntry], observerStub);
  };
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

describe("ProductGrid responsive columns", () => {
  it("clamps column count between minItems and maxItems", () => {
    const resize = mockResize(100);
    const { container } = render(
      <ProductGrid products={products} minItems={2} maxItems={3} showPrice={false} />
    );
    let grid = container.firstChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe(
      "repeat(2, minmax(0, 1fr))"
    );

    act(() => resize(2000));
    grid = container.firstChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe(
      "repeat(3, minmax(0, 1fr))"
    );
  });

  it("keeps fixed columns when the columns prop is set", () => {
    const resize = mockResize(300);
    const { container } = render(
      <ProductGrid products={products} columns={3} showPrice={false} />
    );
    let grid = container.firstChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe(
      "repeat(3, minmax(0, 1fr))"
    );

    act(() => resize(2000));
    grid = container.firstChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe(
      "repeat(3, minmax(0, 1fr))"
    );
  });

  it("uses device breakpoints when provided", () => {
    const resize = mockResize(1200);
    const { container } = render(
      <ProductGrid
        products={products}
        desktopItems={4}
        tabletItems={2}
        mobileItems={1}
        showPrice={false}
      />
    );
    let grid = container.firstChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe(
      "repeat(4, minmax(0, 1fr))"
    );

    act(() => resize(800));
    grid = container.firstChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe(
      "repeat(2, minmax(0, 1fr))"
    );

    act(() => resize(400));
    grid = container.firstChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe(
      "repeat(1, minmax(0, 1fr))"
    );
  });
});

jest.mock("../../overlays/ProductQuickView", () => ({
  ProductQuickView: ({
    product,
    onAddToCart,
  }: {
    product: Product;
    onAddToCart: (p: Product) => void;
  }) => (
    <div data-cy={`quickview-${product.id}`}>
      <button
        data-cy="add-to-cart"
        onClick={() => onAddToCart(product)}
      />
    </div>
  ),
}));

describe("ProductGrid quick view", () => {
  it("renders ProductQuickView and handles add to cart", async () => {
    mockResize(1200);
    const handleAdd = jest.fn();
    render(
      <ProductGrid
        products={products}
        enableQuickView
        showPrice={false}
        onAddToCart={handleAdd}
      />
    );

    const btn = screen.getByLabelText("Quick view A");
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    const modal = await screen.findByTestId("quickview-1");
    expect(modal).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("add-to-cart"));
    expect(handleAdd).toHaveBeenCalledWith(products[0]);
  });
});

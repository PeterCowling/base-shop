import { render, screen, act } from "@testing-library/react";
import { ProductGrid } from "../src/components/shop/ProductGrid";
import { CartProvider } from "../src/contexts/CartContext";
import { PRODUCTS } from "../src/products/index";

let resizeCb: ResizeObserverCallback;

beforeEach(() => {
  // @ts-expect-error ResizeObserver not in jsdom
  global.ResizeObserver = class {
    constructor(cb: ResizeObserverCallback) {
      resizeCb = cb;
    }
    observe() {}
    disconnect() {}
  };
});

describe("ProductGrid", () => {
  it("renders all products", () => {
    render(
      <CartProvider>
        <ProductGrid skus={[PRODUCTS[0], PRODUCTS[1]]} />
      </CartProvider>
    );
    expect(screen.getAllByRole("article").length).toBe(2);
  });

  it("honors explicit column count", () => {
    render(
      <CartProvider>
        <ProductGrid skus={[PRODUCTS[0], PRODUCTS[1]]} columns={2} data-testid="grid" />
      </CartProvider>
    );
    const grid = screen.getByTestId("grid");
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" });
  });

  it("respects min/max when resized", () => {
    render(
      <CartProvider>
        <ProductGrid
          skus={[PRODUCTS[0], PRODUCTS[1], PRODUCTS[2]]}
          minItems={1}
          maxItems={3}
          data-testid="grid"
        />
      </CartProvider>
    );
    const grid = screen.getByTestId("grid") as HTMLElement;
    Object.defineProperty(grid, "clientWidth", { value: 2000, configurable: true });
    act(() => resizeCb([] as any));
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" });
    Object.defineProperty(grid, "clientWidth", { value: 100, configurable: true });
    act(() => resizeCb([] as any));
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(1, minmax(0, 1fr))" });
  });
});

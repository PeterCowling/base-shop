import { render, screen, act } from "@testing-library/react";
import { ProductGrid } from "../src/components/organisms/ProductGrid";

jest.mock("../src/components/organisms/ProductCard", () => ({
  ProductCard: ({ product }: any) => <article>{product.title}</article>,
}));

const products = [
  {
    id: "1",
    title: "A",
    media: [{ url: "/placeholder.svg", type: "image" }],
    price: 10,
  },
  {
    id: "2",
    title: "B",
    media: [{ url: "/placeholder.svg", type: "image" }],
    price: 20,
  },
];

describe("ProductGrid", () => {
  it("renders products with given column count", () => {
    render(<ProductGrid products={products} columns={2} data-cy="grid" />);
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByTestId("grid")).toHaveStyle({
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    });
  });

  it("clamps column count between min and max", () => {
    let resizeCb: ResizeObserverCallback = () => {};
    // @ts-expect-error jsdom missing ResizeObserver
    global.ResizeObserver = class {
      constructor(cb: ResizeObserverCallback) {
        resizeCb = cb;
      }
      observe() {}
      disconnect() {}
    };

    render(
      <ProductGrid
        products={products}
        minItems={2}
        maxItems={4}
        data-cy="grid"
      />
    );
    const grid = screen.getByTestId("grid") as HTMLElement;

    Object.defineProperty(grid, "clientWidth", { value: 100, configurable: true });
    act(() => resizeCb([]));
    expect(grid.style.gridTemplateColumns).toBe(
      "repeat(2, minmax(0, 1fr))"
    );

    Object.defineProperty(grid, "clientWidth", {
      value: 2000,
      configurable: true,
    });
    act(() => resizeCb([]));
    expect(grid.style.gridTemplateColumns).toBe(
      "repeat(4, minmax(0, 1fr))"
    );
  });

  it("uses device breakpoints when provided", () => {
    let resizeCb: ResizeObserverCallback = () => {};
    // @ts-expect-error jsdom missing ResizeObserver
    global.ResizeObserver = class {
      constructor(cb: ResizeObserverCallback) {
        resizeCb = cb;
      }
      observe(el: Element) {
        Object.defineProperty(el, "clientWidth", {
          value: 1200,
          configurable: true,
        });
      }
      disconnect() {}
    };

    render(
      <ProductGrid
        products={products}
        desktopItems={4}
        tabletItems={2}
        mobileItems={1}
        data-cy="grid"
      />
    );
    const grid = screen.getByTestId("grid") as HTMLElement;

    act(() => resizeCb([]));
    expect(grid.style.gridTemplateColumns).toBe(
      "repeat(4, minmax(0, 1fr))"
    );

    Object.defineProperty(grid, "clientWidth", {
      value: 800,
      configurable: true,
    });
    act(() => resizeCb([]));
    expect(grid.style.gridTemplateColumns).toBe(
      "repeat(2, minmax(0, 1fr))"
    );

    Object.defineProperty(grid, "clientWidth", {
      value: 400,
      configurable: true,
    });
    act(() => resizeCb([]));
    expect(grid.style.gridTemplateColumns).toBe(
      "repeat(1, minmax(0, 1fr))"
    );
  });
});


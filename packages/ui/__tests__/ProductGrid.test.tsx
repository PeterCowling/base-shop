import { render, screen, act } from "@testing-library/react";
import { ProductGrid } from "../src/components/organisms/ProductGrid";

jest.mock("../src/components/organisms/ProductCard", () => ({
  ProductCard: ({ product }: any) => <article>{product.title}</article>,
}));

const products = [
  { id: "1", title: "A", image: "/placeholder.svg", price: 10 },
  { id: "2", title: "B", image: "/placeholder.svg", price: 20 },
];

describe("ProductGrid", () => {
  it("renders products with given column count", () => {
    render(<ProductGrid products={products} columns={2} data-testid="grid" />);
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
        data-testid="grid"
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
});


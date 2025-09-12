import * as React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductGrid } from "./ProductGrid";

// stub out dialog component from shadcn
jest.mock("../atoms/shadcn", () =>
  require("../../../../../test/__mocks__/shadcnDialogStub.tsx")
);

// simplify ProductCard rendering for isolation
jest.mock("./ProductCard", () => ({
  ProductCard: ({ product }: any) => <article>{product.title}</article>,
}));

const products = [
  { id: "1", title: "A", media: [], price: 10 },
  { id: "2", title: "B", media: [], price: 20 },
  { id: "3", title: "C", media: [], price: 30 },
  { id: "4", title: "D", media: [], price: 40 },
];

function mockResize(initial: number) {
  let cb: ResizeObserverCallback = () => {};
  (global as any).ResizeObserver = class {
    constructor(callback: ResizeObserverCallback) {
      cb = callback;
    }
    observe(el: Element) {
      Object.defineProperty(el, "clientWidth", { value: initial, configurable: true });
    }
    disconnect() {}
  } as any;
  return (width: number, el: HTMLElement) => {
    Object.defineProperty(el, "clientWidth", { value: width, configurable: true });
    cb([{ target: el } as ResizeObserverEntry], {} as any);
  };
}

describe("ProductGrid filtering and pagination", () => {
  it("filters products based on external state", async () => {
    function Wrapper() {
      const [filter, setFilter] = React.useState("");
      const filtered = products.filter((p) => p.title.includes(filter));
      return (
        <>
          <ProductGrid products={filtered} columns={2} data-cy="grid" />
          <button onClick={() => setFilter("A")}>filter</button>
        </>
      );
    }
    render(<Wrapper />);
    expect(screen.getAllByRole("article")).toHaveLength(4);
    await userEvent.click(screen.getByRole("button", { name: "filter" }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("paginates products by updating props", async () => {
    function Pager() {
      const [page, setPage] = React.useState(0);
      const pageSize = 2;
      const paged = products.slice(page * pageSize, (page + 1) * pageSize);
      return (
        <>
          <ProductGrid products={paged} columns={2} />
          <button onClick={() => setPage((p) => p + 1)}>next</button>
        </>
      );
    }
    render(<Pager />);
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByText("A")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "next" }));
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByText("C")).toBeInTheDocument();
  });
});

describe("ProductGrid layout responsiveness", () => {
  it("updates column count on resize", () => {
    const resize = mockResize(1200);
    render(
      <ProductGrid products={products} minItems={1} maxItems={4} data-cy="grid" />
    );
    const grid = screen.getByTestId("grid") as HTMLElement;
    act(() => resize(100, grid));
    expect(grid.style.gridTemplateColumns).toBe(
      "repeat(1, minmax(0, 1fr))"
    );
    act(() => resize(2000, grid));
    expect(grid.style.gridTemplateColumns).toBe(
      "repeat(4, minmax(0, 1fr))"
    );
  });
});


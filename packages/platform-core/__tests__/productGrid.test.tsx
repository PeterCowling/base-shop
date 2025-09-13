import React from "react";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import { ProductGrid } from "../src/components/shop/ProductGrid";
import { CartProvider } from "../src/contexts/CartContext";
import { CurrencyProvider } from "../src/contexts/CurrencyContext";
import { PRODUCTS } from "../src/products/index";

let resizeCb: ResizeObserverCallback = () => {};
let disconnectMock: jest.Mock;
const originalFetch = global.fetch;

beforeEach(() => {
  // @ts-expect-error ResizeObserver not in jsdom
  global.ResizeObserver = class {
    constructor(cb: ResizeObserverCallback) {
      resizeCb = cb;
      disconnectMock = jest.fn();
    }
    observe() {}
    disconnect() {
      disconnectMock();
    }
  };
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ cart: {} }) });
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("ProductGrid", () => {
  it("renders one ProductCard per SKU", async () => {
    await act(async () => {
      render(
        <CurrencyProvider>
          <CartProvider>
            <ProductGrid skus={[PRODUCTS[0], PRODUCTS[1]]} columns={2} />
          </CartProvider>
        </CurrencyProvider>
      );
    });
    await act(async () => {});
    expect(screen.getAllByRole("article").length).toBe(2);
  });

  it("sorts SKUs alphabetically", async () => {
    const skus = [
      { ...PRODUCTS[2], id: "c", slug: "c", title: "C item" },
      { ...PRODUCTS[0], id: "a", slug: "a", title: "A item" },
      { ...PRODUCTS[1], id: "b", slug: "b", title: "B item" },
    ];
    await act(async () => {
      render(
        <CurrencyProvider>
          <CartProvider>
            <ProductGrid skus={skus} columns={3} />
          </CartProvider>
        </CurrencyProvider>
      );
    });
    await act(async () => {});
    const titles = screen
      .getAllByRole("heading")
      .map((h) => h.textContent);
    expect(titles).toEqual(["A item", "B item", "C item"]);
  });

  it("uses provided columns when defined", async () => {
    (global as any).ResizeObserver = undefined;
    await act(async () => {
      render(
        <CurrencyProvider>
          <CartProvider>
            <ProductGrid
              skus={[PRODUCTS[0], PRODUCTS[1], PRODUCTS[2]]}
              columns={3}
              data-cy="grid"
            />
          </CartProvider>
        </CurrencyProvider>
      );
    });
    await act(async () => {});
    const grid = screen.getByTestId("grid") as HTMLElement;
    expect(grid).toHaveStyle({
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    });
  });

  it("overrides responsive columns when explicit count provided", async () => {
    await act(async () => {
      render(
        <CurrencyProvider>
          <CartProvider>
            <ProductGrid
              skus={[PRODUCTS[0], PRODUCTS[1], PRODUCTS[2]]}
              columns={4}
              desktopItems={3}
              tabletItems={2}
              mobileItems={1}
              data-cy="grid"
            />
          </CartProvider>
        </CurrencyProvider>
      );
    });
    await act(async () => {});
    const grid = screen.getByTestId("grid") as HTMLElement;
    Object.defineProperty(grid, "clientWidth", { value: 500, configurable: true });
    act(() => resizeCb([] as any));
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" });
    Object.defineProperty(grid, "clientWidth", { value: 1200, configurable: true });
    act(() => resizeCb([] as any));
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" });
  });

  it("applies viewport counts at breakpoints", async () => {
    await act(async () => {
      render(
        <CurrencyProvider>
          <CartProvider>
            <ProductGrid
              skus={[PRODUCTS[0], PRODUCTS[1], PRODUCTS[2]]}
              desktopItems={3}
              tabletItems={2}
              mobileItems={1}
              data-cy="grid"
            />
          </CartProvider>
        </CurrencyProvider>
      );
    });
    await act(async () => {});
    const grid = screen.getByTestId("grid") as HTMLElement;
    Object.defineProperty(grid, "clientWidth", { value: 1200, configurable: true });
    act(() => resizeCb([] as any));
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" });
    Object.defineProperty(grid, "clientWidth", { value: 800, configurable: true });
    act(() => resizeCb([] as any));
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" });
    Object.defineProperty(grid, "clientWidth", { value: 500, configurable: true });
    act(() => resizeCb([] as any));
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(1, minmax(0, 1fr))" });
  });

  it("clamps to min/max when ideal count is out of bounds", async () => {
    await act(async () => {
      render(
        <CurrencyProvider>
          <CartProvider>
            <ProductGrid
              skus={[PRODUCTS[0], PRODUCTS[1], PRODUCTS[2]]}
              minItems={2}
              maxItems={4}
              data-cy="grid"
            />
          </CartProvider>
        </CurrencyProvider>
      );
    });
    await act(async () => {});
    const grid = screen.getByTestId("grid") as HTMLElement;
    Object.defineProperty(grid, "clientWidth", { value: 2000, configurable: true });
    act(() => resizeCb([] as any));
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" });
    Object.defineProperty(grid, "clientWidth", { value: 300, configurable: true });
    act(() => resizeCb([] as any));
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" });
  });

  it("auto-calculates column count from container width", async () => {
    await act(async () => {
      render(
        <CurrencyProvider>
          <CartProvider>
            <ProductGrid
              skus={[PRODUCTS[0], PRODUCTS[1], PRODUCTS[2]]}
              minItems={1}
              maxItems={5}
              data-cy="grid"
            />
          </CartProvider>
        </CurrencyProvider>
      );
    });
    await act(async () => {});
    const grid = screen.getByTestId("grid") as HTMLElement;
    Object.defineProperty(grid, "clientWidth", { value: 800, configurable: true });
    act(() => resizeCb([] as any));
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" });
    Object.defineProperty(grid, "clientWidth", { value: 100, configurable: true });
    act(() => resizeCb([] as any));
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(1, minmax(0, 1fr))" });
  });

  it("disconnects ResizeObserver on unmount", async () => {
    let unmount: () => void;
    await act(async () => {
      const rendered = render(
        <CurrencyProvider>
          <CartProvider>
            <ProductGrid skus={[PRODUCTS[0]]} data-cy="grid" />
          </CartProvider>
        </CurrencyProvider>
      );
      unmount = rendered.unmount;
    });
    await act(async () => {});
    unmount!();
    expect(disconnectMock).toHaveBeenCalled();
  });

  it("shows placeholders when no products provided", async () => {
    await act(async () => {
      render(
        <CurrencyProvider>
          <CartProvider>
            <ProductGrid skus={[]} columns={3} />
          </CartProvider>
        </CurrencyProvider>
      );
    });
    await act(async () => {});
    const placeholders = screen.getAllByTestId("placeholder");
    expect(placeholders).toHaveLength(3);
  });

  it("renders items and triggers card interactions", async () => {
    const sku = { ...PRODUCTS[0], sizes: [] };
    await act(async () => {
      render(
        <CurrencyProvider>
          <CartProvider>
            <ProductGrid skus={[sku]} columns={1} />
          </CartProvider>
        </CurrencyProvider>
      );
    });
    await act(async () => {});
    expect(screen.queryByTestId("placeholder")).toBeNull();
    const link = screen.getByRole("link", { name: sku.title });
    expect(link).toHaveAttribute("href", expect.stringContaining(sku.slug));
    const button = screen.getByRole("button", { name: /add to cart/i });
    await act(async () => {
      fireEvent.click(button);
    });
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/cart",
        expect.objectContaining({ method: "POST" })
      )
    );
  });
});

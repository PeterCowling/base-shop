import { render, screen, waitFor, act } from "@testing-library/react";
import { ProductGrid } from "../ProductGrid";

// Mock ProductCard to simplify rendering
jest.mock("../ProductCard", () => ({
  ProductCard: ({ sku }) => <div data-cy="sku">{sku.title}</div>,
}));

const makeSku = (id: string, title: string) => ({
  id,
  slug: title.toLowerCase(),
  title,
  price: 100,
  deposit: 0,
  stock: 0,
  media: [],
  sizes: [],
  description: "",
  forSale: true,
  forRental: false,
});

const skus = [
  makeSku("1", "Banana"),
  makeSku("2", "Apple"),
  makeSku("3", "Cherry"),
];

function mockResizeObserver(initialWidth: number) {
  let cb: ResizeObserverCallback;
  let element: Element;
  const observe = jest.fn((el: Element) => {
    element = el;
    Object.defineProperty(el, "clientWidth", {
      value: initialWidth,
      configurable: true,
    });
    cb([{ target: el } as ResizeObserverEntry], {} as any);
  });
  const disconnect = jest.fn();
  const roMock = jest.fn((callback: ResizeObserverCallback) => {
    cb = callback;
    return { observe, disconnect, unobserve: jest.fn() };
  });
  (global as any).ResizeObserver = roMock;
  return {
    resize: (width: number) => {
      Object.defineProperty(element, "clientWidth", {
        value: width,
        configurable: true,
      });
      cb([{ target: element } as ResizeObserverEntry], {} as any);
    },
    disconnect,
    roMock,
  };
}

afterEach(() => {
  (global as any).ResizeObserver = undefined;
});

describe("ProductGrid", () => {
  it("sorts products alphabetically", () => {
    render(<ProductGrid skus={skus} columns={3} />);
    const titles = screen.getAllByTestId("sku").map((el) => el.textContent);
    expect(titles).toEqual(["Apple", "Banana", "Cherry"]);
  });

  it("applies breakpoint column counts", async () => {
    const { resize } = mockResizeObserver(1200);
    const { container } = render(
      <ProductGrid
        skus={skus}
        desktopItems={4}
        tabletItems={2}
        mobileItems={1}
      />
    );
    let grid = container.firstChild as HTMLElement;
    await waitFor(() =>
      expect(grid.style.gridTemplateColumns).toBe(
        "repeat(4, minmax(0, 1fr))"
      )
    );
    await act(() => {
      resize(800);
    });
    await waitFor(() =>
      expect(grid.style.gridTemplateColumns).toBe(
        "repeat(2, minmax(0, 1fr))"
      )
    );
    await act(() => {
      resize(500);
    });
    await waitFor(() =>
      expect(grid.style.gridTemplateColumns).toBe(
        "repeat(1, minmax(0, 1fr))"
      )
    );
  });

  it("calculates columns based on width and clamps to min/max", async () => {
    const { resize } = mockResizeObserver(500);
    const { container } = render(
      <ProductGrid skus={skus} minItems={1} maxItems={5} />
    );
    let grid = container.firstChild as HTMLElement;
    await waitFor(() =>
      expect(grid.style.gridTemplateColumns).toBe(
        "repeat(2, minmax(0, 1fr))"
      )
    );
    await act(() => {
      resize(100);
    });
    await waitFor(() =>
      expect(grid.style.gridTemplateColumns).toBe(
        "repeat(1, minmax(0, 1fr))"
      )
    );
    await act(() => {
      resize(2000);
    });
    await waitFor(() =>
      expect(grid.style.gridTemplateColumns).toBe(
        "repeat(5, minmax(0, 1fr))"
      )
    );
  });

  it("uses explicit columns without ResizeObserver", () => {
    const ro = jest.fn(() => ({ observe: jest.fn(), disconnect: jest.fn() }));
    (global as any).ResizeObserver = ro;
    const { container } = render(<ProductGrid skus={skus} columns={3} />);
    const grid = container.firstChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe(
      "repeat(3, minmax(0, 1fr))"
    );
    expect(ro).not.toHaveBeenCalled();
  });

  it("disconnects ResizeObserver on unmount", async () => {
    const { roMock, disconnect } = mockResizeObserver(500);
    const { unmount } = render(<ProductGrid skus={skus} />);
    await waitFor(() => expect(roMock).toHaveBeenCalled());
    await act(() => {
      unmount();
    });
    expect(disconnect).toHaveBeenCalled();
  });
});


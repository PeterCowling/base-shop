import React from "react";
import { render, act } from "@testing-library/react";
import CollectionList from "../src/components/cms/blocks/CollectionList";
import type { CollectionListProps } from "../src/components/cms/blocks/CollectionList";
import type { Category } from "../src/components/organisms/CategoryCard";

jest.mock("../src/components/organisms/CategoryCard", () => ({
  CategoryCard: ({ category }: { category: Category }) => (
    <div data-testid={`category-${category.id}`} />
  ),
}));

const collections: Category[] = Array.from({ length: 5 }).map((_, i) => ({
  id: String(i + 1),
  title: `Collection ${i + 1}`,
  image: "",
}));

let resizeCb: ResizeObserverCallback;

beforeEach(() => {
  // @ts-expect-error jsdom lacks ResizeObserver
  global.ResizeObserver = class {
    constructor(cb: ResizeObserverCallback) {
      resizeCb = cb;
    }
    observe() {}
    disconnect() {}
  };
});

function setup(props?: Partial<CollectionListProps>) {
  const { container } = render(
    <CollectionList collections={collections} {...props} />
  );
  const root = container.firstChild as HTMLElement;
  let width = 0;
  Object.defineProperty(root, "clientWidth", {
    get: () => width,
    configurable: true,
  });
  const setWidth = (w: number) => {
    width = w;
    act(() => resizeCb([]));
  };
  return { root, setWidth };
}

describe("CollectionList", () => {
  it("uses desktop, tablet and mobile overrides", () => {
    const { root, setWidth } = setup({
      desktopItems: 4,
      tabletItems: 3,
      mobileItems: 2,
    });

    setWidth(1200);
    expect(root.style.gridTemplateColumns).toBe(
      "repeat(4, minmax(0, 1fr))"
    );

    setWidth(800);
    expect(root.style.gridTemplateColumns).toBe(
      "repeat(3, minmax(0, 1fr))"
    );

    setWidth(500);
    expect(root.style.gridTemplateColumns).toBe(
      "repeat(2, minmax(0, 1fr))"
    );
  });

  it("falls back to ITEM_WIDTH calculation with min/max clamping", () => {
    const { root, setWidth } = setup({ minItems: 2, maxItems: 4 });

    setWidth(100); // below min
    expect(root.style.gridTemplateColumns).toBe(
      "repeat(2, minmax(0, 1fr))"
    );

    setWidth(800); // within range
    expect(root.style.gridTemplateColumns).toBe(
      "repeat(3, minmax(0, 1fr))"
    );

    setWidth(2000); // above max
    expect(root.style.gridTemplateColumns).toBe(
      "repeat(4, minmax(0, 1fr))"
    );
  });
});


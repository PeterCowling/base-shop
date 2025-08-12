import React from "react";
import { render, act } from "@testing-library/react";
import CollectionList from "../src/components/cms/blocks/CollectionList";
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

describe("CollectionList", () => {
  it("uses minItems when container is narrow", () => {
    const { container } = render(
      <CollectionList collections={collections} minItems={2} maxItems={5} />
    );
    const root = container.firstChild as HTMLElement;
    Object.defineProperty(root, "clientWidth", {
      value: 100,
      configurable: true,
    });
    act(() => resizeCb([]));
    expect(root.style.gridTemplateColumns).toBe("repeat(2, minmax(0, 1fr))");
  });

  it("clamps to maxItems on wide containers", () => {
    const { container } = render(
      <CollectionList collections={collections} minItems={1} maxItems={3} />
    );
    const root = container.firstChild as HTMLElement;
    Object.defineProperty(root, "clientWidth", {
      value: 2000,
      configurable: true,
    });
    act(() => resizeCb([]));
    expect(root.style.gridTemplateColumns).toBe(
      "repeat(3, minmax(0, 1fr))"
    );
  });
});

import { act,render } from "@testing-library/react";

import CollectionList, {
  type CollectionListProps,
} from "../CollectionList";

jest.mock("@acme/ui/components/organisms/CategoryCard", () => ({
  CategoryCard: ({ category }: { category: { id: string } }) => (
    <div data-testid={`category-${category.id}`} />
  ),
}));

const collections = Array.from({ length: 5 }).map((_, i) => ({
  id: String(i + 1),
  title: `Collection ${i + 1}`,
  image: "",
}));

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
    act(() => resizeCb([], {} as ResizeObserver));
  };
  return { root, setWidth };
}

describe("CollectionList", () => {
  it("clamps columns using min/max when no breakpoints provided", () => {
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

  it("uses device-specific item counts when provided", () => {
    const { root, setWidth } = setup({
      desktopItems: 4,
      tabletItems: 3,
      mobileItems: 2,
    });

    setWidth(1200); // desktop
    expect(root.style.gridTemplateColumns).toBe(
      "repeat(4, minmax(0, 1fr))"
    );

    setWidth(800); // tablet
    expect(root.style.gridTemplateColumns).toBe(
      "repeat(3, minmax(0, 1fr))"
    );

    setWidth(500); // mobile
    expect(root.style.gridTemplateColumns).toBe(
      "repeat(2, minmax(0, 1fr))"
    );
  });
});


import { renderHook, act } from "@testing-library/react";
import useCenterInParent from "../hooks/useCenterInParent";

describe("useCenterInParent", () => {
  it("centers allowed absolute children and respects locked editor flags", () => {
    const a = { id: "a", type: "Text", position: "absolute" } as any;
    const b = { id: "b", type: "Text", position: "relative" } as any;
    const c = { id: "c", type: "Text", position: "absolute" } as any;
    const components = [a, b, c];
    const editor = { c: { locked: true } } as any;
    const dispatch = jest.fn();

    // Fake DOM nodes with dimensions
    const parent = document.createElement("div");
    Object.defineProperty(parent, "clientWidth", { value: 200 });
    Object.defineProperty(parent, "clientHeight", { value: 100 });

    const makeEl = (id: string, w: number, h: number) => {
      const el = document.createElement("div");
      el.setAttribute("data-component-id", id);
      Object.defineProperty(el, "offsetParent", { value: parent });
      Object.defineProperty(el, "offsetWidth", { value: w });
      Object.defineProperty(el, "offsetHeight", { value: h });
      document.body.appendChild(el);
      return el;
    };
    makeEl("a", 100, 40);
    makeEl("b", 50, 20);
    makeEl("c", 80, 20);

    const { result } = renderHook(() =>
      useCenterInParent({ components, selectedIds: ["a", "b", "c"], editor, dispatch, viewport: "desktop" })
    );

    act(() => result.current.centerInParentX());
    act(() => result.current.centerInParentY());

    // a is absolute and not locked -> both X and Y dispatched
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "resize", id: "a", leftDesktop: `${(200 - 100) / 2}px` }));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "resize", id: "a", topDesktop: `${(100 - 40) / 2}px` }));
    // b is not absolute -> ignored
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ id: "b" }));
    // c is locked -> ignored
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ id: "c" }));
  });
});


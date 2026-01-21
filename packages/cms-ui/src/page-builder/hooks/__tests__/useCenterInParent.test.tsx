// packages/ui/src/components/cms/page-builder/hooks/__tests__/useCenterInParent.test.tsx
import { act,renderHook } from "@testing-library/react";

import useCenterInParent from "../useCenterInParent";

function makeEl(id: string, w: number, h: number, pw: number, ph: number) {
  const child = document.createElement("div");
  child.setAttribute("data-component-id", id);
  Object.defineProperty(child, "offsetWidth", { value: w });
  Object.defineProperty(child, "offsetHeight", { value: h });
  const parent = document.createElement("div");
  Object.defineProperty(parent, "clientWidth", { value: pw });
  Object.defineProperty(parent, "clientHeight", { value: ph });
  Object.defineProperty(child, "offsetParent", { value: parent });
  document.body.appendChild(parent);
  parent.appendChild(child);
}

describe("useCenterInParent", () => {
  test("dispatches resize with centered left/top per viewport", () => {
    makeEl("a", 200, 100, 1000, 600);
    const components = [{ id: "a", position: "absolute" }] as any;
    const selectedIds = ["a"];
    const dispatch = jest.fn();
    const { result, rerender } = renderHook(({ viewport }: { viewport: "desktop" | "tablet" | "mobile" }) =>
      useCenterInParent({ components, selectedIds, editor: {}, dispatch, viewport })
    , { initialProps: { viewport: "desktop" as "desktop" | "tablet" | "mobile" } });

    act(() => result.current.centerInParentX());
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "resize", id: "a", leftDesktop: "400px" }));
    dispatch.mockClear();

    rerender({ viewport: "mobile" as "desktop" | "tablet" | "mobile" });
    act(() => result.current.centerInParentY());
    // (600 - 100) / 2 = 250
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "resize", id: "a", topMobile: "250px" }));
  });
});


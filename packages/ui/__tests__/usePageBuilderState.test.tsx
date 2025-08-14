import { renderHook, act } from "@testing-library/react";
import usePageBuilderState from "../src/components/cms/page-builder/hooks/usePageBuilderState";

describe("usePageBuilderState", () => {
  it("supports undo and redo", () => {
    const page: any = {
      id: "p1",
      updatedAt: "now",
      slug: "home",
      status: "draft",
      seo: { title: { en: "Home" } },
      components: [],
    };
    const { result } = renderHook(() => usePageBuilderState({ page }));
    act(() =>
      result.current.dispatch({
        type: "add",
        component: { id: "c1", type: "Text" } as any,
      })
    );
    expect(result.current.components).toHaveLength(1);
    act(() => result.current.dispatch({ type: "undo" }));
    expect(result.current.components).toHaveLength(0);
    act(() => result.current.dispatch({ type: "redo" }));
    expect(result.current.components).toHaveLength(1);
    act(() => result.current.clearHistory());
  });
});

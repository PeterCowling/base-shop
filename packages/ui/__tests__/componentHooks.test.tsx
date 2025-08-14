import { renderHook, act } from "@testing-library/react";
import useComponentInputs from "../src/components/cms/page-builder/useComponentInputs";
import useComponentResize from "../src/components/cms/page-builder/useComponentResize";
import usePageBuilderState from "../src/components/cms/page-builder/hooks/usePageBuilderState";

describe("component hooks", () => {
  it("useComponentInputs forwards field changes", () => {
    const onChange = jest.fn();
    const { result } = renderHook(() => useComponentInputs(onChange));
    act(() => result.current.handleInput("foo", "bar"));
    expect(onChange).toHaveBeenCalledWith({ foo: "bar" });
  });

  it("useComponentResize trims values and sets full size", () => {
    const onResize = jest.fn();
    const { result } = renderHook(() => useComponentResize(onResize));
    act(() => result.current.handleResize("widthDesktop", " 200px "));
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "200px" });
    act(() => result.current.handleResize("widthDesktop", "   "));
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: undefined });
    act(() => result.current.handleFullSize("widthDesktop"));
    expect(onResize).toHaveBeenCalledWith({ widthDesktop: "100%" });
  });

  it("usePageBuilderState supports undo and redo", () => {
    const page: any = {
      id: "p1",
      updatedAt: "now",
      slug: "home",
      status: "draft",
      seo: { title: { en: "Home" } },
      components: [],
    };
    const { result } = renderHook(() =>
      usePageBuilderState({ page })
    );
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

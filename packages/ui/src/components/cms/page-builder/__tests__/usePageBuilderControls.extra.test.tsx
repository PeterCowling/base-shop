import { renderHook, act } from "@testing-library/react";
import usePageBuilderControls from "../hooks/usePageBuilderControls";

describe("usePageBuilderControls – extras", () => {
  const base = { gridCols: 12, breakpoints: [{ id: "sm", label: "Small", min: 360 }, { id: "lg", label: "Large", max: 1280 }] } as any;

  it("derives extra devices from custom breakpoints", () => {
    const { result } = renderHook(() => usePageBuilderControls({ state: base, dispatch: jest.fn() }));
    const extra = result.current.extraDevices.map((d) => d.id);
    expect(extra).toEqual(expect.arrayContaining(["bp-sm", "bp-lg"]));
  });

  it("editingSize overrides viewportStyle width for current viewport and toggles rulers/baseline", () => {
    const { result } = renderHook(() => usePageBuilderControls({ state: base, dispatch: jest.fn() }));
    // Default style includes width from device preset (but we only assert override effect)
    act(() => { result.current.setEditingSizePx(777); });
    expect((result.current.viewportStyle as any).width).toBe("777px");

    expect(result.current.showRulers).toBe(false);
    act(() => result.current.toggleRulers());
    expect(result.current.showRulers).toBe(true);

    expect(result.current.showBaseline).toBe(false);
    act(() => result.current.toggleBaseline());
    expect(result.current.showBaseline).toBe(true);
    act(() => result.current.setBaselineStep(12));
    expect(result.current.baselineStep).toBe(12);
  });

  it("syncs editing size overrides for pinned global instances via editor state", () => {
    const dispatch = jest.fn();
    const initialState = {
      ...base,
      editor: {
        foo: { global: { id: "gid_1", pinned: true, editingSize: { desktop: 840 } } },
      },
    } as any;
    const { result, rerender } = renderHook(
      ({ state }: { state: any }) => usePageBuilderControls({ state, dispatch }),
      { initialProps: { state: initialState } },
    );

    expect(result.current.editingSizePx).toBe(840);

    act(() => { result.current.setEditingSizePx(900); });
    expect(dispatch).toHaveBeenCalledWith({
      type: "update-editor",
      id: "foo",
      patch: { global: { id: "gid_1", pinned: true, editingSize: { desktop: 900 } } },
    });

    const updatedState = {
      ...initialState,
      editor: {
        foo: { global: { id: "gid_1", pinned: true, editingSize: { desktop: 900 } } },
      },
    } as any;
    rerender({ state: updatedState });
    expect(result.current.editingSizePx).toBe(900);

    dispatch.mockClear();
    act(() => { result.current.setEditingSizePx(null); });
    const clearCall = dispatch.mock.calls[0]?.[0] as any;
    expect(clearCall).toEqual({
      type: "update-editor",
      id: "foo",
      patch: { global: { id: "gid_1", pinned: true } },
    });

    rerender({
      state: {
        ...updatedState,
        editor: { foo: { global: { id: "gid_1", pinned: true } } },
      } as any,
    });
    expect(result.current.editingSizePx).toBeNull();
  });

  it("setBreakpoints dispatches list", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() => usePageBuilderControls({ state: base, dispatch }));
    const list = [{ id: "x", label: "X" }];
    act(() => result.current.setBreakpoints(list as any));
    expect(dispatch).toHaveBeenCalledWith({ type: "set-breakpoints", breakpoints: list });
  });
});


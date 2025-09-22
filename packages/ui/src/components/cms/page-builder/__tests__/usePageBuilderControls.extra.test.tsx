import { renderHook, act, waitFor } from "@testing-library/react";
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

  it("setBreakpoints dispatches list", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() => usePageBuilderControls({ state: base, dispatch }));
    const list = [{ id: "x", label: "X" }];
    act(() => result.current.setBreakpoints(list as any));
    expect(dispatch).toHaveBeenCalledWith({ type: "set-breakpoints", breakpoints: list });
  });

  it("syncs and persists global editing widths independently", async () => {
    const dispatch = jest.fn();
    const state = {
      gridCols: 12,
      breakpoints: [],
      editor: {
        g1: { global: { id: "global-1", editingWidth: { desktop: 640 } } },
      },
    } as any;
    const { result } = renderHook(() =>
      usePageBuilderControls({ state, dispatch, globalContext: { id: "global-1" } })
    );

    await waitFor(() => expect(result.current.editingSizePx).toBe(640));

    act(() => {
      result.current.setEditingSizePx(720);
    });
    expect(result.current.editingSizePx).toBe(720);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenLastCalledWith({
      type: "update-editor",
      id: "g1",
      patch: { global: { id: "global-1", editingWidth: { desktop: 720 } } },
    });

    act(() => {
      result.current.setEditingSizePx(null);
    });
    expect(result.current.editingSizePx).toBeNull();
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenLastCalledWith({
      type: "update-editor",
      id: "g1",
      patch: { global: { id: "global-1" } },
    });
  });
});


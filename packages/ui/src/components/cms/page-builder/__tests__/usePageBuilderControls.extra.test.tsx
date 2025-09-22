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

  it("persists editingSize per viewport when switching device types", () => {
    const { result } = renderHook(() => usePageBuilderControls({ state: base, dispatch: jest.fn() }));
    // Desktop override
    act(() => { result.current.setEditingSizePx(777); });
    const desktopStyle = result.current.viewportStyle as any;
    expect(desktopStyle.width).toBe("777px");

    // Switch to a tablet-like preset (from extraDevices or built-ins via device.type change)
    const tabletId = (result.current.extraDevices.find((d) => d.type === 'tablet') || []).id || 'tablet';
    act(() => { result.current.setDeviceId(tabletId as any); });
    // Set tablet override
    act(() => { result.current.setEditingSizePx(555); });
    expect((result.current.viewportStyle as any).width).toBe("555px");

    // Switch back to a desktop preset (first desktop extra or fallback)
    const desktopPreset = (result.current.extraDevices.find((d) => d.type === 'desktop') || []).id || result.current.deviceId;
    act(() => { result.current.setDeviceId(desktopPreset as any); });
    expect((result.current.viewportStyle as any).width).toBe("777px");
  });

  it("setBreakpoints dispatches list", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() => usePageBuilderControls({ state: base, dispatch }));
    const list = [{ id: "x", label: "X" }];
    act(() => result.current.setBreakpoints(list as any));
    expect(dispatch).toHaveBeenCalledWith({ type: "set-breakpoints", breakpoints: list });
  });
});

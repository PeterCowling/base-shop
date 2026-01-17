import { renderHook, act } from "@testing-library/react";
import { devicePresets } from "@acme/ui/utils/devicePresets";
import { useThemePreviewDevice } from "../useThemePreviewDevice";

describe("useThemePreviewDevice", () => {
  it("returns default device", () => {
    const { result } = renderHook(() => useThemePreviewDevice());
    expect(result.current.deviceId).toBe(devicePresets[0].id);
  });

  it("updates device id when setDeviceId is called", () => {
    const { result } = renderHook(() => useThemePreviewDevice());
    act(() => result.current.setDeviceId(devicePresets[1].id));
    expect(result.current.deviceId).toBe(devicePresets[1].id);
  });

  it("persists selected device between renders", () => {
    const { result, rerender } = renderHook(() => useThemePreviewDevice());
    act(() => result.current.setDeviceId(devicePresets[1].id));
    rerender();
    expect(result.current.deviceId).toBe(devicePresets[1].id);
  });
});


// packages/ui/src/hooks/__tests__/usePreviewDevice.test.tsx
import { renderHook, act } from "@testing-library/react";
import { PREVIEW_DEVICE_STORAGE_KEY, usePreviewDevice } from "../usePreviewDevice";

describe("usePreviewDevice", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("loads stored device on mount", () => {
    localStorage.setItem(PREVIEW_DEVICE_STORAGE_KEY, "tablet");
    const { result } = renderHook(() => usePreviewDevice("desktop"));
    expect(result.current[0]).toBe("tablet");
  });

  test("persists device on change", () => {
    const { result } = renderHook(() => usePreviewDevice("desktop"));
    act(() => {
      result.current[1]("mobile");
    });
    expect(localStorage.getItem(PREVIEW_DEVICE_STORAGE_KEY)).toBe("mobile");
  });

  test("falls back to initial id when no stored value", () => {
    const { result } = renderHook(() => usePreviewDevice("desktop"));
    expect(result.current[0]).toBe("desktop");
  });
});

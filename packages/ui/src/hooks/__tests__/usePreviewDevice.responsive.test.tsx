import { useEffect } from "react";
import { act,renderHook } from "@testing-library/react";

import { PREVIEW_DEVICE_STORAGE_KEY,usePreviewDevice } from "../usePreviewDevice";

describe("usePreviewDevice", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1200,
    });
  });

  function useResponsivePreview() {
    const [device, setDevice] = usePreviewDevice("desktop");
    useEffect(() => {
      const handler = () => {
        const w = window.innerWidth;
        if (w < 768) setDevice("mobile");
        else if (w < 1024) setDevice("tablet");
        else setDevice("desktop");
      };
      window.addEventListener("resize", handler);
      handler();
      return () => window.removeEventListener("resize", handler);
    }, [setDevice]);
    return device;
  }

  it("returns device string for breakpoints", () => {
    const { result } = renderHook(() => useResponsivePreview());

    expect(result.current).toBe("desktop");

    act(() => {
      (window as any).innerWidth = 500;
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe("mobile");

    act(() => {
      (window as any).innerWidth = 800;
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe("tablet");

    act(() => {
      (window as any).innerWidth = 1300;
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe("desktop");
    expect(localStorage.getItem(PREVIEW_DEVICE_STORAGE_KEY)).toBe("desktop");
  });
});

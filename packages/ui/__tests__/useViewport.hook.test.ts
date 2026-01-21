import * as React from "react";
import { act,renderHook } from "@testing-library/react";

import useViewport from "../src/hooks/useViewport";

describe("useViewport hook", () => {
  it("typeof window === undefined returns desktop", () => {
    const originalWindow = (global as any).window;
    (global as any).window = undefined;
    const { result } = renderHook(() => useViewport());
    expect(result.current).toBe("desktop");
    (global as any).window = originalWindow;
  });

  it("returns desktop when matchMedia is missing", () => {
    const originalMatchMedia = window.matchMedia;
    (window as any).matchMedia = undefined;

    const { result } = renderHook(() => useViewport());

    expect(result.current).toBe("desktop");

    window.matchMedia = originalMatchMedia;
  });

  it("updates across desktop -> tablet -> mobile", () => {
    const originalMatchMedia = window.matchMedia;

    let width = 1200;
    window.matchMedia = jest.fn((query: string) => ({
      matches:
        query === "(min-width: 1024px)"
          ? width >= 1024
          : query === "(min-width: 768px)"
          ? width >= 768
          : false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      onchange: null,
      dispatchEvent: jest.fn(),
    })) as any;

    const { result } = renderHook(() => useViewport());

    expect(result.current).toBe("desktop");

    act(() => {
      width = 800;
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe("tablet");

    act(() => {
      width = 500;
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe("mobile");

    window.matchMedia = originalMatchMedia;
  });
});


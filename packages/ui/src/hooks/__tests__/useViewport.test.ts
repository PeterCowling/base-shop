import React from "react";
import { act,renderHook } from "@testing-library/react";

import useViewport from "../useViewport";

// i18n-exempt: test suite name
describe("useViewport", () => {
  const originalMatchMedia = window.matchMedia;

  const mockMatchMedia = (width: number) => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches:
          query === "(min-width: 1024px)"
            ? width >= 1024
            : query === "(min-width: 768px)"
            ? width >= 768
            : false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  };

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia,
    });
    jest.restoreAllMocks();
  });

  // i18n-exempt: test description
  it("returns 'desktop' for desktop width", () => {
    mockMatchMedia(1200);
    const { result } = renderHook(() => useViewport());
    expect(result.current).toBe("desktop");
  });

  // i18n-exempt: test table descriptions
  it.each([
    [800, "tablet"],
    [500, "mobile"],
  ])("width %i returns '%s'", (width, expected) => {
    mockMatchMedia(width as number);
    const { result } = renderHook(() => useViewport());
    expect(result.current).toBe(expected);
  });

  // i18n-exempt: test description
  it("defaults to 'desktop' when matchMedia returns undefined", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: undefined,
    });
    const { result } = renderHook(() => useViewport());
    expect(result.current).toBe("desktop");
  });

  // i18n-exempt: test description
  it("defaults to 'desktop' when window is undefined", () => {
    const originalWindow = globalThis.window;
    const effectSpy = jest.spyOn(React, "useEffect").mockImplementation(() => {});
    const { result } = renderHook(() => {
      // Simulate window being undefined by redefining property
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        configurable: true,
      });
      const vp = useViewport();
      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        configurable: true,
      });
      return vp;
    });
    expect(result.current).toBe("desktop");
    effectSpy.mockRestore();
  });

  // i18n-exempt: test description
  it("updates on resize events", () => {
    let width = 500;
    mockMatchMedia(width);

    const { result } = renderHook(() => useViewport());
    expect(result.current).toBe("mobile");

    act(() => {
      width = 1300;
      mockMatchMedia(width);
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe("desktop");
  });
});

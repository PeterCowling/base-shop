import { renderHook, act } from "@testing-library/react";
import React from "react";
import useViewport from "../useViewport";

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

  it("returns 'desktop' for desktop width", () => {
    mockMatchMedia(1200);
    const { result } = renderHook(() => useViewport());
    expect(result.current).toBe("desktop");
  });

  it.each([
    [800, "tablet"],
    [500, "mobile"],
  ])("width %i returns '%s'", (width, expected) => {
    mockMatchMedia(width as number);
    const { result } = renderHook(() => useViewport());
    expect(result.current).toBe(expected);
  });

  it("defaults to 'desktop' when matchMedia returns undefined", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: undefined,
    });
    const { result } = renderHook(() => useViewport());
    expect(result.current).toBe("desktop");
  });

  it("defaults to 'desktop' when window is undefined", () => {
    const originalWindow = global.window;
    const effectSpy = jest
      .spyOn(React, "useEffect")
      .mockImplementation(() => {});
    const { result } = renderHook(() => {
      // @ts-expect-error
      delete (global as any).window;
      const vp = useViewport();
      global.window = originalWindow;
      return vp;
    });
    expect(result.current).toBe("desktop");
    effectSpy.mockRestore();
  });

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


import { act, renderHook } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { useScrolledPast } from "@/hooks/useScrolledPast";

beforeAll(() => {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    cb(0);
    return 0;
  };
});

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    get: () => value,
  });
}

describe("useScrolledPast", () => {
  beforeEach(() => {
    setScrollY(0);
  });

  it("returns false when the page has not reached the threshold", () => {
    const { result } = renderHook(() => useScrolledPast(100));
    expect(result.current).toBe(false);
  });

  it("returns true once scrollY crosses the threshold", () => {
    const { result } = renderHook(() => useScrolledPast(120));

    act(() => {
      setScrollY(150);
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(true);
  });

  it("toggles back to false when scrolling above and below the threshold", () => {
    const { result } = renderHook(() => useScrolledPast(80));

    act(() => {
      setScrollY(100);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);

    act(() => {
      setScrollY(50);
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(false);
  });
});
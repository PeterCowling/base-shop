import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useScrollProgress } from "@/hooks/useScrollProgress";

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value,
    writable: true,
  });
}

function simulateScroll(y: number) {
  setScrollY(y);
  window.dispatchEvent(new Event("scroll"));
}

function simulateMouse(y: number, x = 10) {
  const event = new MouseEvent("mousemove", { clientY: y, clientX: x });
  window.dispatchEvent(event);
}

describe("useScrollProgress", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 2000,
    });
    setScrollY(0);
  });

  it("initializes progress and scrolled state", () => {
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current.scrolled).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.mouseNearTop).toBe(false);
  });

  it("updates progress on scroll", () => {
    const { result } = renderHook(() => useScrollProgress());

    act(() => {
      simulateScroll(1000);
    });

    expect(result.current.scrolled).toBe(true);
    expect(result.current.progress).toBeCloseTo(50, 0);
  });

  it("detects mouse near the top", () => {
    const { result } = renderHook(() => useScrollProgress());

    act(() => {
      simulateMouse(10);
    });

    expect(result.current.mouseNearTop).toBe(true);
  });

  it("treats cursor inside the header bounds as near the top", () => {
    const header = document.createElement("header");
    header.setAttribute("role", "banner");
    header.getBoundingClientRect = vi.fn(
      () =>
        ({
          top: 0,
          bottom: 96,
          left: 0,
          right: 1200,
          width: 1200,
          height: 96,
          x: 0,
          y: 0,
          toJSON: () => {},
        }) as DOMRect,
    );
    document.body.append(header);

    const { result } = renderHook(() => useScrollProgress());

    act(() => {
      simulateMouse(120, 200);
    });

    expect(result.current.mouseNearTop).toBe(false);

    act(() => {
      simulateMouse(60, 200);
    });

    expect(result.current.mouseNearTop).toBe(true);

    header.remove();
  });

  it("does nothing on mobile widths", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 400 });
    const { result } = renderHook(() => useScrollProgress());

    act(() => {
      simulateScroll(1000);
      simulateMouse(10);
    });

    expect(result.current.scrolled).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(result.current.mouseNearTop).toBe(false);
  });
});
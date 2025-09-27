import React from "react";
import { renderHook, act } from "@testing-library/react";
import useCanvasDrag from "../src/components/cms/page-builder/useCanvasDrag";

// Polyfill PointerEvent for jsdom
if (typeof window !== "undefined" && !(window as any).PointerEvent) {
  (window as any).PointerEvent = MouseEvent as any;
}

// Mocks for useGuides and snapToGrid
const siblingEdgesRef = { current: { vertical: [] as number[], horizontal: [] as number[] } };
const computeSiblingEdges = jest.fn();

jest.mock("../src/components/cms/page-builder/useGuides", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: function useGuidesMock() {
      const [guides, setGuidesState] = React.useState({ x: null as number | null, y: null as number | null });
      return {
        guides,
        setGuides: (g: { x: number | null; y: number | null }) => setGuidesState(g),
        siblingEdgesRef,
        computeSiblingEdges,
      };
    },
  };
});

const snapToGrid = jest.fn((value: number, size: number) => Math.round(value / size) * size);

jest.mock("../src/components/cms/page-builder/gridSnap", () => ({
  __esModule: true,
  snapToGrid: (value: number, size: number) => snapToGrid(value, size),
  default: (value: number, size: number) => snapToGrid(value, size),
}));

describe("useCanvasDrag", () => {
  beforeEach(() => {
    siblingEdgesRef.current = { vertical: [], horizontal: [] };
    computeSiblingEdges.mockReset();
    snapToGrid.mockClear();
  });

  it("snaps to sibling edges and updates guides/distances", () => {
    const dispatch = jest.fn();
    const container = document.createElement("div");
    Object.defineProperties(container, {
      offsetLeft: { value: 0, writable: true },
      offsetTop: { value: 0, writable: true },
      offsetWidth: { value: 50, writable: true },
      offsetHeight: { value: 50, writable: true },
    });
    const parent = document.createElement("div");
    parent.appendChild(container);
    const containerRef = { current: container } as React.RefObject<HTMLDivElement>;

    siblingEdgesRef.current = { vertical: [100], horizontal: [100] };

    const { result } = renderHook(() =>
      useCanvasDrag({ componentId: "c1", dispatch, gridCols: 4, containerRef })
    );

    act(() => {
      result.current.startDrag({ clientX: 0, clientY: 0 } as any);
    });

    // Move near the right/bottom edges (within threshold)
    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 55, clientY: 55 })
      );
    });

    // Guides are positioned relative to the dragged element
    expect(result.current.guides.x).not.toBeNull();
    expect(result.current.guides.y).not.toBeNull();
    expect(result.current.distances).toEqual({ x: 5, y: 5 });
    // The element snaps so its right/bottom edges align to 100
    expect(dispatch).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "resize", left: "50px", top: "50px" })
    );

    act(() => {
      window.dispatchEvent(new PointerEvent("pointerup", {}));
    });
  });

  it("snaps to grid lines and dispatches snapped coordinates", () => {
    const dispatch = jest.fn();
    const container = document.createElement("div");
    Object.defineProperties(container, {
      offsetLeft: { value: 0, writable: true },
      offsetTop: { value: 0, writable: true },
      offsetWidth: { value: 50, writable: true },
      offsetHeight: { value: 50, writable: true },
    });
    const parent = document.createElement("div");
    Object.defineProperty(parent, "offsetWidth", { value: 200, writable: true });
    parent.appendChild(container);
    const containerRef = { current: container } as React.RefObject<HTMLDivElement>;

    const { result } = renderHook(() =>
      useCanvasDrag({
        componentId: "c1",
        dispatch,
        gridEnabled: true,
        gridCols: 4,
        containerRef,
      })
    );

    act(() => {
      result.current.startDrag({ clientX: 0, clientY: 0 } as any);
    });

    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 95, clientY: 95 })
      );
    });

    expect(snapToGrid).toHaveBeenCalled();
    expect(result.current.guides.x).toBe(0);
    // Y guide may reflect snapped vertical offset based on container size
    expect(result.current.guides.y).not.toBeNull();
    expect(result.current.distances).toEqual({ x: 5, y: 5 });
    expect(dispatch).toHaveBeenLastCalledWith(
      expect.objectContaining({ left: "100px", top: "100px" })
    );

    act(() => {
      window.dispatchEvent(new PointerEvent("pointerup", {}));
    });
  });

  it("does not drag when disabled", () => {
    const dispatch = jest.fn();
    const container = document.createElement("div");
    Object.defineProperties(container, {
      offsetLeft: { value: 0, writable: true },
      offsetTop: { value: 0, writable: true },
      offsetWidth: { value: 50, writable: true },
      offsetHeight: { value: 50, writable: true },
    });
    const parent = document.createElement("div");
    parent.appendChild(container);
    const containerRef = { current: container } as React.RefObject<HTMLDivElement>;

    const { result } = renderHook(() =>
      useCanvasDrag({
        componentId: "c1",
        dispatch,
        gridCols: 4,
        containerRef,
        disabled: true,
      })
    );

    act(() => {
      result.current.startDrag({ clientX: 0, clientY: 0 } as any);
      window.dispatchEvent(
        new PointerEvent("pointermove", { clientX: 50, clientY: 50 })
      );
    });

    expect(dispatch).not.toHaveBeenCalled();
    expect(result.current.moving).toBe(false);
  });
});

import { act, renderHook } from "@testing-library/react";
import useViewport from "../hooks/useViewport";

if (typeof window !== "undefined" && !window.requestAnimationFrame) {
  (window as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  };
}

test("updates width and grid size when viewport changes", () => {
  const canvas = document.createElement("div");
  Object.defineProperty(canvas, "offsetWidth", { value: 1200, writable: true });
  const ref = { current: canvas } as React.RefObject<HTMLDivElement>;
  const { result } = renderHook(() =>
    useViewport({ canvasRef: ref, showGrid: true, gridCols: 12 })
  );
  expect(result.current.viewportStyle.width).toBe("1024px");
  expect(result.current.gridSize).toBe(100);
  act(() => {
    Object.defineProperty(canvas, "offsetWidth", { value: 600, writable: true });
    result.current.setViewport("tablet");
  });
  expect(result.current.viewportStyle.width).toBe("768px");
  expect(result.current.gridSize).toBe(50);
});


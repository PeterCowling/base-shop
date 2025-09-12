import { renderHook, act } from "@testing-library/react";
import usePageBuilderControls from "../hooks/usePageBuilderControls";
import { STATUS } from "../PageBuilderTour";

describe("usePageBuilderControls", () => {
  const baseState = { gridCols: 12 } as any;

  test("rotateDevice swaps width/height and updates viewport", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() =>
      usePageBuilderControls({ state: baseState, dispatch })
    );
    const initial = result.current.device;
    act(() => {
      result.current.rotateDevice();
    });
    expect(result.current.device.width).toBe(initial.height);
    expect(result.current.device.height).toBe(initial.width);
    expect(result.current.viewport).toBe(result.current.device.type);
  });

  test("startTour sets runTour and handleTourCallback clears and persists", () => {
    const dispatch = jest.fn();
    localStorage.setItem("page-builder-tour", "done");
    const { result } = renderHook(() =>
      usePageBuilderControls({ state: baseState, dispatch })
    );
    expect(result.current.runTour).toBe(false);
    act(() => {
      result.current.startTour();
    });
    expect(result.current.runTour).toBe(true);
    act(() => {
      result.current.handleTourCallback({ status: STATUS.FINISHED } as any);
    });
    expect(result.current.runTour).toBe(false);
    expect(localStorage.getItem("page-builder-tour")).toBe("done");
  });

  test("toggleGrid and setGridCols dispatch actions", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() =>
      usePageBuilderControls({ state: baseState, dispatch })
    );
    act(() => {
      result.current.toggleGrid();
    });
    expect(result.current.showGrid).toBe(true);
    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: "set-grid-cols",
      gridCols: baseState.gridCols,
    });
    act(() => {
      result.current.setGridCols(24);
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: "set-grid-cols",
      gridCols: 24,
    });
  });
});


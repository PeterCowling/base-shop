import { renderHook, act } from "@testing-library/react";
import usePageBuilderControls from "../hooks/usePageBuilderControls";
import { STATUS } from "../PageBuilderTour";

describe("usePageBuilderControls", () => {
  const baseState = { gridCols: 12 } as any;

  test("rotateDevice switches orientation and adjusts dimensions", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() =>
      usePageBuilderControls({ state: baseState, dispatch })
    );

    const { width, height } = result.current.device;
    expect(result.current.orientation).toBe("portrait");

    act(() => {
      result.current.rotateDevice();
    });

    expect(result.current.orientation).toBe("landscape");
    expect(result.current.device.width).toBe(height);
    expect(result.current.device.height).toBe(width);
  });

  test("handleTourCallback finishes tour and sets localStorage", () => {
    const dispatch = jest.fn();
    localStorage.clear();
    const { result } = renderHook(() =>
      usePageBuilderControls({ state: baseState, dispatch })
    );

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

  test("toggleGrid dispatches current grid cols", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() =>
      usePageBuilderControls({ state: baseState, dispatch })
    );

    act(() => {
      result.current.toggleGrid();
    });

    expect(result.current.showGrid).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({
      type: "set-grid-cols",
      gridCols: baseState.gridCols,
    });
  });

  test("setGridCols dispatches provided value", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() =>
      usePageBuilderControls({ state: baseState, dispatch })
    );

    act(() => {
      result.current.setGridCols(24);
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: "set-grid-cols",
      gridCols: 24,
    });
  });

  test("toggleSnap flips snapToGrid state", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() =>
      usePageBuilderControls({ state: baseState, dispatch })
    );
    expect(result.current.snapToGrid).toBe(true);
    act(() => {
      result.current.toggleSnap();
    });
    expect(result.current.snapToGrid).toBe(false);
    act(() => {
      result.current.toggleSnap();
    });
    expect(result.current.snapToGrid).toBe(true);
  });

  test("setZoom updates zoom level", () => {
    const dispatch = jest.fn();
    const { result } = renderHook(() =>
      usePageBuilderControls({ state: baseState, dispatch })
    );
    expect(result.current.zoom).toBe(1);
    act(() => {
      result.current.setZoom(1.5);
    });
    expect(result.current.zoom).toBe(1.5);
  });
});

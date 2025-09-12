import { renderHook, act } from "@testing-library/react";
import usePageBuilderDnD from "../hooks/usePageBuilderDnD";

describe("usePageBuilderDnD", () => {
  it("handleDragMove updates insertIndex and snap position", () => {
    const setSnapPosition = jest.fn();
    const canvasRef = {
      current: { getBoundingClientRect: () => ({ left: 0 }) },
    } as any;

    const { result } = renderHook(() =>
      usePageBuilderDnD({
        components: [],
        dispatch: jest.fn(),
        defaults: {},
        containerTypes: [],
        selectId: jest.fn(),
        gridSize: 10,
        canvasRef,
        setSnapPosition,
      })
    );

    act(() =>
      result.current.handleDragMove({
        over: { id: "canvas", data: { current: {} }, rect: { top: 0, height: 0 } },
        delta: { x: 12, y: 0 },
        activatorEvent: { clientX: 0, clientY: 0 },
      } as any)
    );

    expect(result.current.insertIndex).toBe(0);
    expect(setSnapPosition).toHaveBeenLastCalledWith(10);
  });

  it("adds new component from the palette", () => {
    const dispatch = jest.fn();
    const selectId = jest.fn();

    const { result } = renderHook(() =>
      usePageBuilderDnD({
        components: [],
        dispatch,
        defaults: {},
        containerTypes: [],
        selectId,
        gridSize: 10,
        setSnapPosition: jest.fn(),
      })
    );

    act(() =>
      result.current.handleDragStart({
        active: { data: { current: { type: "Text" } } },
      } as any)
    );

    act(() =>
      result.current.handleDragEnd({
        active: { data: { current: { from: "palette", type: "Text" } } },
        over: { id: "canvas", data: { current: {} } },
      } as any)
    );

    const action = dispatch.mock.calls[0][0];
    expect(action.type).toBe("add");
    expect(selectId).toHaveBeenCalledWith(action.component.id);
  });

  it("moves existing component", () => {
    const components = [
      { id: "a", type: "Text" },
      { id: "b", type: "Text" },
    ] as any;

    const dispatch = jest.fn();
    const canvasRef = {
      current: { getBoundingClientRect: () => ({ left: 0 }) },
    } as any;

    const { result } = renderHook(() =>
      usePageBuilderDnD({
        components,
        dispatch,
        defaults: {},
        containerTypes: [],
        selectId: jest.fn(),
        gridSize: 10,
        canvasRef,
        setSnapPosition: jest.fn(),
      })
    );

    act(() =>
      result.current.handleDragStart({
        active: { data: { current: { type: "Text" } } },
      } as any)
    );

    act(() =>
      result.current.handleDragMove({
        over: { id: "canvas", data: { current: {} }, rect: { top: 0, height: 0 } },
        delta: { x: 8, y: 0 },
        activatorEvent: { clientX: 0, clientY: 0 },
      } as any)
    );

    act(() =>
      result.current.handleDragEnd({
        active: {
          data: {
            current: {
              from: "canvas",
              index: 0,
              parentId: undefined,
              type: "Text",
            },
          },
        },
        over: { id: "canvas", data: { current: {} } },
      } as any)
    );

    expect(dispatch).toHaveBeenCalledWith({
      type: "move",
      from: { parentId: undefined, index: 0 },
      to: { parentId: undefined, index: 1 },
    });
  });
});


import { act,renderHook } from "@testing-library/react";

import usePageBuilderDnD from "@acme/ui/components/cms/page-builder/hooks/usePageBuilderDnD";

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
        active: { id: "a", data: { current: {} } },
        over: { id: "canvas", data: { current: {} }, rect: { top: 0, height: 0 } },
        delta: { x: 12, y: 0 },
        activatorEvent: { clientX: 0, clientY: 0 },
      } as any)
    );

    expect(result.current.insertIndex).toBe(0);
    expect(setSnapPosition).toHaveBeenLastCalledWith(10);
  });

  it("adds new component from the palette (allowed at root)", () => {
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
        active: { id: "new", data: { current: { type: "Section" } } },
      } as any)
    );

    act(() =>
      result.current.handleDragEnd({
        active: { data: { current: { from: "palette", type: "Section" } } },
        over: { id: "canvas", data: { current: {} } },
      } as any)
    );

    const action = dispatch.mock.calls[0][0];
    expect(action.type).toBe("add");
    expect(selectId).toHaveBeenCalledWith(action.component.id);
  });

  it("moves existing component (allowed at root)", () => {
    const components = [
      { id: "a", type: "Section" },
      { id: "b", type: "Section" },
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
        active: { data: { current: { type: "Section" } } },
      } as any)
    );

    act(() =>
      result.current.handleDragMove({
        active: { id: "a", data: { current: {} } },
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
              type: "Section",
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

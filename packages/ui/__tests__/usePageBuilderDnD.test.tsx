import { renderHook, act } from "@testing-library/react";
import usePageBuilderDnD from "../src/components/cms/page-builder/hooks/usePageBuilderDnD";

describe("usePageBuilderDnD", () => {
  it("adds palette component onto canvas with grid snapping", () => {
    const dispatch = jest.fn();
    const selectId = jest.fn();
    const setSnapPosition = jest.fn();
    const canvasRef = {
      current: { getBoundingClientRect: () => ({ left: 0 }) },
    } as any;
    const { result } = renderHook(() =>
      usePageBuilderDnD({
        components: [],
        dispatch,
        defaults: {},
        containerTypes: [],
        selectId,
        gridSize: 10,
        canvasRef,
        setSnapPosition,
      })
    );

    act(() =>
      result.current.handleDragStart({
        active: { data: { current: { type: "Text" } } },
      } as any)
    );
    expect(result.current.activeType).toBe("Text");

    act(() =>
      result.current.handleDragMove({
        over: { id: "canvas", data: { current: {} }, rect: { top: 0, height: 0 } },
        delta: { x: 12, y: 0 },
        activatorEvent: { clientX: 0, clientY: 0 },
      } as any)
    );
    expect(result.current.insertIndex).toBe(0);
    expect(setSnapPosition).toHaveBeenLastCalledWith(10);

    act(() =>
      result.current.handleDragEnd({
        active: { data: { current: { from: "palette", type: "Text" } } },
        over: { id: "canvas", data: { current: {} } },
      } as any)
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "add",
        component: expect.objectContaining({ type: "Text" }),
      })
    );
    expect(selectId).toHaveBeenCalled();
    expect(result.current.activeType).toBeNull();
    expect(result.current.insertIndex).toBeNull();
    expect(setSnapPosition).toHaveBeenLastCalledWith(null);
  });

  it("moves existing component within canvas with grid snapping", () => {
    const components = [
      { id: "a", type: "Text" },
      { id: "b", type: "Text" },
    ] as any;
    const dispatch = jest.fn();
    const setSnapPosition = jest.fn();
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
        setSnapPosition,
      })
    );

    act(() =>
      result.current.handleDragStart({
        active: { data: { current: { type: "Text" } } },
      } as any)
    );
    expect(result.current.activeType).toBe("Text");

    act(() =>
      result.current.handleDragMove({
        over: { id: "canvas", data: { current: {} }, rect: { top: 0, height: 0 } },
        delta: { x: 8, y: 0 },
        activatorEvent: { clientX: 0, clientY: 0 },
      } as any)
    );
    expect(result.current.insertIndex).toBe(2);
    expect(setSnapPosition).toHaveBeenLastCalledWith(10);

    act(() =>
      result.current.handleDragEnd({
        active: {
          data: { current: { from: "canvas", index: 0, parentId: undefined, type: "Text" } },
        },
        over: { id: "canvas", data: { current: {} } },
      } as any)
    );

    expect(dispatch).toHaveBeenCalledWith({
      type: "move",
      from: { parentId: undefined, index: 0 },
      to: { parentId: undefined, index: 1 },
    });
    expect(result.current.insertIndex).toBeNull();
    expect(result.current.activeType).toBeNull();
    expect(setSnapPosition).toHaveBeenLastCalledWith(null);
  });

  it("adds palette component into a container with resolved parentId and index", () => {
    const components = [
      {
        id: "container-1",
        type: "Container",
        children: [{ id: "child-1", type: "Text" }],
      },
    ] as any;
    const dispatch = jest.fn();
    const selectId = jest.fn();
    const { result } = renderHook(() =>
      usePageBuilderDnD({
        components,
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
        active: {
          data: { current: { from: "palette", type: "Text" } },
        },
        over: { id: "container-container-1", data: { current: {} } },
      } as any)
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "add",
        parentId: "container-1",
        index: 1,
        component: expect.objectContaining({ type: "Text" }),
      })
    );
    expect(selectId).toHaveBeenCalled();
  });
});

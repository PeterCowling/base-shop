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
        active: { id: "new", data: { current: { type: "Section" } } },
      } as any)
    );
    expect(result.current.activeType).toBe("Section");

    act(() =>
      result.current.handleDragMove({
        active: { id: "new", data: { current: {} } },
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
        component: expect.objectContaining({ type: "Section" }),
      })
    );
    expect(selectId).toHaveBeenCalled();
    expect(result.current.activeType).toBeNull();
    expect(result.current.insertIndex).toBeNull();
    expect(setSnapPosition).toHaveBeenLastCalledWith(null);
  });

  it("moves existing component within canvas with grid snapping", () => {
    const components = [
      { id: "a", type: "Section" },
      { id: "b", type: "Section" },
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
        active: { id: "a", data: { current: { type: "Section" } } },
      } as any)
    );
    expect(result.current.activeType).toBe("Section");

    act(() =>
      result.current.handleDragMove({
        active: { id: "a", data: { current: {} } },
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

  it("adjusts insertIndex when dragging over a component by pointer position", () => {
    const components = [
      { id: "a", type: "Text" },
      { id: "b", type: "Text" },
    ] as any;
    const { result } = renderHook(() =>
      usePageBuilderDnD({
        components,
        dispatch: jest.fn(),
        defaults: {},
        containerTypes: [],
        selectId: jest.fn(),
        gridSize: 10,
        canvasRef: { current: { getBoundingClientRect: () => ({ left: 0 }) } } as any,
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
        active: { id: "a", data: { current: {} } },
        over: {
          id: "a",
          data: { current: { index: 0 } },
          rect: { top: 100, height: 100 },
        },
        delta: { x: 0, y: 0 },
        activatorEvent: { clientX: 0, clientY: 120 },
      } as any)
    );
    expect(result.current.insertIndex).toBe(0);

    act(() =>
      result.current.handleDragMove({
        active: { id: "a", data: { current: {} } },
        over: {
          id: "a",
          data: { current: { index: 0 } },
          rect: { top: 100, height: 100 },
        },
        delta: { x: 0, y: 60 },
        activatorEvent: { clientX: 0, clientY: 120 },
      } as any)
    );
    expect(result.current.insertIndex).toBe(1);
  });

  it("adds palette component into a container with resolved parentId and index", () => {
    const components = [
      {
        id: "container-1",
        type: "Section",
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

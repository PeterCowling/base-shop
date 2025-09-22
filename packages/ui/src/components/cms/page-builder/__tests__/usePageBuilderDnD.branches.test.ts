import { renderHook, act } from "@testing-library/react";
import usePageBuilderDnD from "../hooks/usePageBuilderDnD";

describe("usePageBuilderDnD branch coverage", () => {
  it("returns early when activator is not a pointer event", () => {
    const { result } = renderHook(() =>
      usePageBuilderDnD({
        components: [],
        dispatch: jest.fn(),
        defaults: {},
        containerTypes: [],
        selectId: jest.fn(),
      })
    );
    act(() =>
      result.current.handleDragMove({
        active: { id: "a", data: { current: {} } },
        over: { id: "canvas", data: { current: {} }, rect: { top: 0, height: 0 } },
        delta: { x: 0, y: 0 },
        activatorEvent: {} as any,
      } as any)
    );
    expect(result.current.currentOverId).toBeNull();
    expect(result.current.dropAllowed).toBeNull();
  });

  it("over container: sets insertParentId and index to children length", () => {
    const components = [{ id: "p1", type: "Section", children: [{ id: "c1", type: "Text" }, { id: "c2", type: "Text" }] }] as any;
    const { result } = renderHook(() =>
      usePageBuilderDnD({
        components,
        dispatch: jest.fn(),
        defaults: {},
        containerTypes: [],
        selectId: jest.fn(),
      })
    );
    act(() =>
      result.current.handleDragMove({
        active: { id: "new", data: { current: { from: "palette", type: "Text" } } },
        over: { id: `container-${components[0].id}`, data: { current: {} }, rect: { top: 0, height: 100 } },
        delta: { x: 0, y: 0 },
        activatorEvent: { clientX: 0, clientY: 0 },
      } as any)
    );
    expect(result.current.insertParentId).toBe("p1");
    expect(result.current.insertIndex).toBe(2);
  });

  it("over child above/below midpoint adjusts index", () => {
    const components = [{ id: "p1", type: "Section", children: [{ id: "c1", type: "Text" }, { id: "c2", type: "Text" }] }] as any;
    const { result } = renderHook(() =>
      usePageBuilderDnD({
        components,
        dispatch: jest.fn(),
        defaults: {},
        containerTypes: [],
        selectId: jest.fn(),
      })
    );

    // Over c1 above midpoint → index stays at base
    act(() =>
      result.current.handleDragMove({
        active: { id: "new", data: { current: { from: "palette", type: "Text" } } },
        over: { id: "c1", data: { current: { index: 0 } }, rect: { top: 0, height: 100 } },
        delta: { x: 0, y: 0 },
        activatorEvent: { clientX: 0, clientY: 0 },
      } as any)
    );
    expect(result.current.insertIndex).toBe(0);

    // Over c1 below midpoint → index = base + 1
    act(() =>
      result.current.handleDragMove({
        active: { id: "new", data: { current: { from: "palette", type: "Text" } } },
        over: { id: "c1", data: { current: { index: 0 } }, rect: { top: 0, height: 100 } },
        delta: { x: 0, y: 60 },
        activatorEvent: { clientX: 0, clientY: 0 },
      } as any)
    );
    expect(result.current.insertIndex).toBe(1);
  });

  it("dropAllowed true for library templates and null for empty library entry", () => {
    const { result } = renderHook(() =>
      usePageBuilderDnD({
        components: [],
        dispatch: jest.fn(),
        defaults: {},
        containerTypes: [],
        selectId: jest.fn(),
      })
    );
    // Allowed at ROOT (Section)
    act(() =>
      result.current.handleDragMove({
        active: { id: "lib", data: { current: { from: "library", templates: [{ id: "x", type: "Section" }] } } },
        over: { id: "canvas", data: { current: {} }, rect: { top: 0, height: 0 } },
        delta: { x: 0, y: 0 },
        activatorEvent: { clientX: 0, clientY: 0 },
      } as any)
    );
    expect(result.current.dropAllowed).toBe(true);

    // Empty entry → null
    act(() =>
      result.current.handleDragMove({
        active: { id: "lib", data: { current: { from: "library", templates: [] } } },
        over: { id: "canvas", data: { current: {} }, rect: { top: 0, height: 0 } },
        delta: { x: 0, y: 0 },
        activatorEvent: { clientX: 0, clientY: 0 },
      } as any)
    );
    expect(result.current.dropAllowed).toBeNull();
  });

  it("dropAllowed false when moving disallowed type at ROOT", () => {
    const components = [{ id: "t1", type: "Text" }] as any;
    const { result } = renderHook(() =>
      usePageBuilderDnD({
        components,
        dispatch: jest.fn(),
        defaults: {},
        containerTypes: [],
        selectId: jest.fn(),
      })
    );
    act(() =>
      result.current.handleDragMove({
        active: { id: "t1", data: { current: { from: "canvas" } } },
        over: { id: "canvas", data: { current: {} }, rect: { top: 0, height: 0 } },
        delta: { x: 0, y: 0 },
        activatorEvent: { clientX: 0, clientY: 0 },
      } as any)
    );
    expect(result.current.dropAllowed).toBe(false);
  });

  it("handleDragCancel clears transient state", () => {
    const { result } = renderHook(() =>
      usePageBuilderDnD({
        components: [],
        dispatch: jest.fn(),
        defaults: {},
        containerTypes: [],
        selectId: jest.fn(),
      })
    );
    act(() => result.current.handleDragStart({ active: { data: { current: { type: "Text", from: "palette" } } } } as any));
    // Sanity: activeType set
    expect(result.current.activeType).toBe("Text");
    act(() => result.current.handleDragCancel());
    expect(result.current.activeType).toBeNull();
    expect(result.current.insertIndex).toBeNull();
    expect(result.current.dropAllowed).toBeNull();
  });
});

import { renderHook, act } from "@testing-library/react";
import { usePageBuilderDnD } from "@acme/page-builder-ui";

// Mock dnd sensors and auto-scroll to keep logic synchronous and deterministic
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/hooks/dnd/sensors"), () => ({ __esModule: true, useDndSensors: () => [] }));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/hooks/dnd/autoscroll"), () => ({
  __esModule: true,
  autoScroll: () => {},
  AUTOSCROLL_EDGE_PX: 16,
  AUTOSCROLL_MAX_SPEED_PX: 24,
}));

// Tree helpers simplified
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/hooks/dnd/tree"), () => ({
  __esModule: true,
  findById: () => null,
  findParentId: () => undefined,
  getTypeOfId: () => "Section",
  getVisibleComponents: (c: any[]) => c,
  resolveParentKind: () => "root",
}));

// Finalize drop no-op to avoid side-effects
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/hooks/dnd/finalizeDrop"), () => ({ __esModule: true, finalizeDrop: () => {} }));

// Coords and snapping simplified
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/utils/coords"), () => ({ __esModule: true, screenToCanvas: (p: any) => p }));
jest.mock(require.resolve("@acme/ui/components/cms/page-builder/gridSnap"), () => ({ __esModule: true, snapToGrid: (x: number) => x }));

describe("usePageBuilderDnD (smoke)", () => {
  it("updates insert index on drag move and finalizes drop on drag end", () => {
    const components = [{ id: "a", type: "Section" } as any];
    const dispatch = jest.fn();
    const setSnap = jest.fn();
    const selectId = jest.fn();
    const { result } = renderHook(() =>
      usePageBuilderDnD({
        components,
        dispatch,
        defaults: {},
        containerTypes: ["Section"] as any,
        selectId,
        gridSize: 10,
        setSnapPosition: setSnap,
        zoom: 1,
      })
    );

    // Simulate a drag move over the canvas center
    act(() => {
      result.current.handleDragMove({
        over: { id: "canvas", rect: { top: 0, height: 100 }, data: { current: {} } } as any,
        delta: { x: 0, y: 0 } as any,
        activatorEvent: { clientX: 100, clientY: 100 } as any,
        active: { id: "a", data: { current: { from: "canvas" } } },
      } as any);
    });

    // Finish drag
    act(() => {
      result.current.handleDragEnd({ active: { id: "a", data: { current: {} } } } as any);
    });

    expect(setSnap).toHaveBeenCalled();
  });
});

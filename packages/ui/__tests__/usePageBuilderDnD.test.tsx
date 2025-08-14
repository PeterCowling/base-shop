import { renderHook, act } from "@testing-library/react";
import usePageBuilderDnD from "../src/components/cms/page-builder/hooks/usePageBuilderDnD";

describe("usePageBuilderDnD", () => {
  it("adds component on drop from palette", () => {
    const dispatch = jest.fn();
    const selectId = jest.fn();
    const { result } = renderHook(() =>
      usePageBuilderDnD({
        components: [],
        dispatch,
        defaults: {},
        containerTypes: [],
        selectId,
      })
    );

    act(() =>
      result.current.handleDragStart({
        active: { data: { current: { type: "Text" } } },
      } as any)
    );
    expect(result.current.activeType).toBe("Text");

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
  });

  it("sets insert index when moving over canvas", () => {
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
        over: { id: "canvas", data: { current: {} } },
        delta: { x: 0, y: 0 },
        activatorEvent: { clientX: 0, clientY: 0 },
      } as any)
    );
    expect(result.current.insertIndex).toBe(0);
  });
});

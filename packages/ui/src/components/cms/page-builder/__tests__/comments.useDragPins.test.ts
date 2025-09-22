import { act, renderHook } from "@testing-library/react";
import { useDragPins } from "../comments/useDragPins";

describe("comments/useDragPins", () => {
  it("normalizes drag position within component bounds and calls patch on mouseup", async () => {
    const canvas = document.createElement("div");
    canvas.getBoundingClientRect = () => ({ left: 5, top: 5, right: 205, bottom: 105, width: 200, height: 100, x: 5, y: 5, toJSON: () => ({}) } as any);

    const positionsRef = { current: {
      comp1: { left: 10, top: 20, width: 100, height: 50 },
    } } as any;

    const threads = [{ id: "t1", componentId: "comp1" }] as any;
    const patch = jest.fn();

    const canvasRef = { current: canvas } as React.RefObject<HTMLDivElement>;
    const { result } = renderHook(() => useDragPins(canvasRef, positionsRef, threads, patch));

    act(() => {
      result.current.startDrag("t1");
    });

    // Move mouse to a point inside the component: expect normalized coords
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 5 + 10 + 50, clientY: 5 + 20 + 25 }));
    });
    expect(result.current.dragPos).toEqual({ x: 0.5, y: 0.5 });

    await act(async () => {
      window.dispatchEvent(new MouseEvent("mouseup"));
      // allow any async patch
      await Promise.resolve();
    });

    expect(patch).toHaveBeenCalledWith("t1", { pos: { x: 0.5, y: 0.5 } });
    expect(result.current.dragId).toBeNull();
    expect(result.current.dragPos).toBeNull();
  });
});


import { act,renderHook } from "@testing-library/react";

import { autoScroll } from "../hooks/dnd/autoscroll";
import usePageBuilderDnD from "../hooks/usePageBuilderDnD";

// Mock autoscroll to capture calls
jest.mock("../hooks/dnd/autoscroll", () => ({
  __esModule: true,
  autoScroll: jest.fn(),
  AUTOSCROLL_EDGE_PX: 16,
  AUTOSCROLL_MAX_SPEED_PX: 64,
}));

describe("usePageBuilderDnD – autoscroll", () => {
  it("calls autoScroll with scrollRef and screen coords near edges", () => {
    const scrollEl = document.createElement("div");
    const scrollRef = { current: scrollEl } as any;
    const canvasRef = { current: { getBoundingClientRect: () => ({ left: 0, top: 0 }) } } as any;

    const { result } = renderHook(() =>
      usePageBuilderDnD({
        components: [],
        dispatch: jest.fn(),
        defaults: {},
        containerTypes: [],
        selectId: jest.fn(),
        gridSize: 10,
        canvasRef,
        setSnapPosition: jest.fn(),
        scrollRef,
      })
    );

    act(() => {
      result.current.handleDragMove({
        active: { id: "a", data: { current: {} } },
        over: { id: "canvas", data: { current: {} }, rect: { top: 0, height: 100 } },
        delta: { x: 0, y: 0 },
        activatorEvent: { clientX: 5, clientY: 5 },
      } as any);
    });

    expect((autoScroll as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    const [ref, x, y] = (autoScroll as jest.Mock).mock.calls.at(-1) || [];
    expect(ref).toBe(scrollRef);
    expect(x).toBe(5);
    expect(y).toBe(5);
  });

  it("calls autoScroll for bottom-right edge coordinates as well", () => {
    const scrollEl = document.createElement("div");
    const scrollRef = { current: scrollEl } as any;
    const canvasRef = { current: { getBoundingClientRect: () => ({ left: 0, top: 0 }) } } as any;

    const { result } = renderHook(() =>
      usePageBuilderDnD({
        components: [],
        dispatch: jest.fn(),
        defaults: {},
        containerTypes: [],
        selectId: jest.fn(),
        gridSize: 10,
        canvasRef,
        setSnapPosition: jest.fn(),
        scrollRef,
      })
    );

    ;(autoScroll as jest.Mock).mockClear();
    act(() => {
      result.current.handleDragMove({
        active: { id: "a", data: { current: {} } },
        over: { id: "canvas", data: { current: {} }, rect: { top: 900, height: 100 } },
        delta: { x: 0, y: 0 },
        activatorEvent: { clientX: 1000, clientY: 1000 },
      } as any);
    });

    const last = (autoScroll as jest.Mock).mock.calls.at(-1) || [];
    expect(last[0]).toBe(scrollRef);
    expect(last[1]).toBe(1000);
    expect(last[2]).toBe(1000);
  });

  it("updates autoScroll on successive moves; last call wins", () => {
    const scrollEl = document.createElement("div");
    const scrollRef = { current: scrollEl } as any;
    const canvasRef = { current: { getBoundingClientRect: () => ({ left: 0, top: 0 }) } } as any;

    const { result } = renderHook(() =>
      usePageBuilderDnD({
        components: [],
        dispatch: jest.fn(),
        defaults: {},
        containerTypes: [],
        selectId: jest.fn(),
        gridSize: 10,
        canvasRef,
        setSnapPosition: jest.fn(),
        scrollRef,
      })
    );

    ;(autoScroll as jest.Mock).mockClear();
    act(() => {
      result.current.handleDragMove({
        active: { id: "a", data: { current: {} } },
        over: { id: "canvas", data: { current: {} }, rect: { top: 0, height: 100 } },
        delta: { x: 0, y: 0 },
        activatorEvent: { clientX: 10, clientY: 10 },
      } as any);
    });
    act(() => {
      result.current.handleDragMove({
        active: { id: "a", data: { current: {} } },
        over: { id: "canvas", data: { current: {} }, rect: { top: 0, height: 100 } },
        delta: { x: 0, y: 0 },
        activatorEvent: { clientX: 250, clientY: 300 },
      } as any);
    });

    const last = (autoScroll as jest.Mock).mock.calls.at(-1) || [];
    expect(last[1]).toBe(250);
    expect(last[2]).toBe(300);
  });
});

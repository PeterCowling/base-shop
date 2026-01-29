/**
 * useRovingTabindex Hook Tests
 * BOS-P2-05: Keyboard arrow navigation
 */

import { renderHook, act } from "@testing-library/react";

import { useRovingTabindex } from "./useRovingTabindex";

describe("useRovingTabindex", () => {
  const mockGrid = [
    ["card-1-1", "card-1-2", "card-1-3"], // Lane 1: 3 cards
    ["card-2-1", "card-2-2"], // Lane 2: 2 cards
    ["card-3-1"], // Lane 3: 1 card
  ];

  beforeEach(() => {
    // Reset focus before each test
    document.body.focus();
  });

  it("initializes with no focused element", () => {
    const { result } = renderHook(() => useRovingTabindex(mockGrid));

    expect(result.current.focusedId).toBeNull();
    expect(result.current.isFocusMode).toBe(false);
  });

  it("enters focus mode when focusElement is called", () => {
    const { result } = renderHook(() => useRovingTabindex(mockGrid));

    act(() => {
      result.current.focusElement("card-1-1");
    });

    expect(result.current.focusedId).toBe("card-1-1");
    expect(result.current.isFocusMode).toBe(true);
  });

  it("moves focus down within same lane (ArrowDown)", () => {
    const { result } = renderHook(() => useRovingTabindex(mockGrid));

    act(() => {
      result.current.focusElement("card-1-1");
    });

    act(() => {
      result.current.handleArrowKey("ArrowDown");
    });

    expect(result.current.focusedId).toBe("card-1-2");
  });

  it("moves focus up within same lane (ArrowUp)", () => {
    const { result } = renderHook(() => useRovingTabindex(mockGrid));

    act(() => {
      result.current.focusElement("card-1-2");
    });

    act(() => {
      result.current.handleArrowKey("ArrowUp");
    });

    expect(result.current.focusedId).toBe("card-1-1");
  });

  it("moves focus right to next lane (ArrowRight)", () => {
    const { result } = renderHook(() => useRovingTabindex(mockGrid));

    act(() => {
      result.current.focusElement("card-1-1");
    });

    act(() => {
      result.current.handleArrowKey("ArrowRight");
    });

    expect(result.current.focusedId).toBe("card-2-1");
  });

  it("moves focus left to previous lane (ArrowLeft)", () => {
    const { result } = renderHook(() => useRovingTabindex(mockGrid));

    act(() => {
      result.current.focusElement("card-2-1");
    });

    act(() => {
      result.current.handleArrowKey("ArrowLeft");
    });

    expect(result.current.focusedId).toBe("card-1-1");
  });

  it("does not move up from first card in lane", () => {
    const { result } = renderHook(() => useRovingTabindex(mockGrid));

    act(() => {
      result.current.focusElement("card-1-1");
    });

    act(() => {
      result.current.handleArrowKey("ArrowUp");
    });

    // Should stay on same card
    expect(result.current.focusedId).toBe("card-1-1");
  });

  it("does not move down from last card in lane", () => {
    const { result } = renderHook(() => useRovingTabindex(mockGrid));

    act(() => {
      result.current.focusElement("card-1-3");
    });

    act(() => {
      result.current.handleArrowKey("ArrowDown");
    });

    // Should stay on same card
    expect(result.current.focusedId).toBe("card-1-3");
  });

  it("does not move left from first lane", () => {
    const { result } = renderHook(() => useRovingTabindex(mockGrid));

    act(() => {
      result.current.focusElement("card-1-1");
    });

    act(() => {
      result.current.handleArrowKey("ArrowLeft");
    });

    // Should stay on same card
    expect(result.current.focusedId).toBe("card-1-1");
  });

  it("does not move right from last lane", () => {
    const { result } = renderHook(() => useRovingTabindex(mockGrid));

    act(() => {
      result.current.focusElement("card-3-1");
    });

    act(() => {
      result.current.handleArrowKey("ArrowRight");
    });

    // Should stay on same card
    expect(result.current.focusedId).toBe("card-3-1");
  });

  it("exits focus mode on Escape key", () => {
    const { result } = renderHook(() => useRovingTabindex(mockGrid));

    act(() => {
      result.current.focusElement("card-1-1");
    });

    expect(result.current.isFocusMode).toBe(true);

    act(() => {
      result.current.exitFocusMode();
    });

    expect(result.current.focusedId).toBeNull();
    expect(result.current.isFocusMode).toBe(false);
  });

  it("maintains focus position when moving to lane with fewer cards", () => {
    const { result } = renderHook(() => useRovingTabindex(mockGrid));

    // Start at card-1-3 (row index 2)
    act(() => {
      result.current.focusElement("card-1-3");
    });

    // Move right to lane 2 (only has 2 cards)
    act(() => {
      result.current.handleArrowKey("ArrowRight");
    });

    // Should focus last card in lane 2 (card-2-2)
    expect(result.current.focusedId).toBe("card-2-2");
  });

  it("getTabIndex returns 0 for focused element, -1 for others", () => {
    const { result } = renderHook(() => useRovingTabindex(mockGrid));

    // Initially no element focused, all should be -1
    expect(result.current.getTabIndex("card-1-1")).toBe(-1);
    expect(result.current.getTabIndex("card-1-2")).toBe(-1);

    // Focus one element
    act(() => {
      result.current.focusElement("card-1-1");
    });

    // Focused element gets tabIndex 0
    expect(result.current.getTabIndex("card-1-1")).toBe(0);
    // Others get -1
    expect(result.current.getTabIndex("card-1-2")).toBe(-1);
    expect(result.current.getTabIndex("card-2-1")).toBe(-1);
  });

  it("handles empty lanes gracefully", () => {
    const gridWithEmptyLane = [
      ["card-1-1", "card-1-2"],
      [], // Empty lane
      ["card-3-1"],
    ];

    const { result } = renderHook(() => useRovingTabindex(gridWithEmptyLane));

    act(() => {
      result.current.focusElement("card-1-1");
    });

    // Moving right should skip empty lane
    act(() => {
      result.current.handleArrowKey("ArrowRight");
    });

    expect(result.current.focusedId).toBe("card-3-1");
  });
});

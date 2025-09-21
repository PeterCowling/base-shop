import { screenToCanvas, rectScreenToCanvas, addPoints, subPoints, clampRectToPositive, normalizeDragDelta, rectsIntersect } from "../coords";

describe("coords utils", () => {
  it("converts screen to canvas coordinates with zoom", () => {
    const canvasRect = { left: 100, top: 50 } as any;
    expect(screenToCanvas({ x: 110, y: 60 }, canvasRect, 1)).toEqual({ x: 10, y: 10 });
    expect(screenToCanvas({ x: 120, y: 70 }, canvasRect, 2)).toEqual({ x: 10, y: 10 });
  });

  it("converts rect from screen to canvas with zoom", () => {
    const canvasRect = { left: 50, top: 10 } as any;
    const out = rectScreenToCanvas({ left: 60, top: 30, width: 40, height: 20 }, canvasRect, 2);
    expect(out).toEqual({ left: 5, top: 10, width: 20, height: 10 });
  });

  it("adds and subtracts points", () => {
    expect(addPoints({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
    expect(subPoints({ x: 5, y: 7 }, { x: 2, y: 1 })).toEqual({ x: 3, y: 6 });
  });

  it("clamps rect dimensions and position to positive", () => {
    const out = clampRectToPositive({ left: -5, top: -2, width: -10, height: 3 });
    expect(out).toEqual({ left: 0, top: 0, width: 0, height: 3 });
  });

  it("normalizes drag delta with zoom", () => {
    expect(normalizeDragDelta({ x: 0, y: 0 }, { x: 20, y: 10 }, 2)).toEqual({ x: 10, y: 5 });
  });

  it("detects rect intersection", () => {
    const a = { left: 0, top: 0, width: 10, height: 10 };
    const b = { left: 5, top: 5, width: 10, height: 10 };
    const c = { left: 20, top: 20, width: 5, height: 5 };
    expect(rectsIntersect(a, b)).toBe(true);
    expect(rectsIntersect(a, c)).toBe(false);
  });
});


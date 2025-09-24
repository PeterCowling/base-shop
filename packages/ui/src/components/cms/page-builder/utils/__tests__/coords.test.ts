// packages/ui/src/components/cms/page-builder/utils/__tests__/coords.test.ts
import {
  addPoints,
  clampRectToPositive,
  normalizeDragDelta,
  rectScreenToCanvas,
  rectsIntersect,
  screenToCanvas,
  subPoints,
} from "../coords";

describe("coords utils", () => {
  test("screenToCanvas respects zoom and canvas origin", () => {
    const p = screenToCanvas({ x: 110, y: 210 }, { left: 10, top: 10 } as any, 2);
    expect(p).toEqual({ x: 50, y: 100 });
    // zero/negative zoom clamps to epsilon
    const p2 = screenToCanvas({ x: 10, y: 10 }, { left: 0, top: 0 } as any, 0);
    expect(Number.isFinite(p2.x)).toBe(true);
  });

  test("rectScreenToCanvas divides by zoom and offsets", () => {
    const r = rectScreenToCanvas({ left: 20, top: 30, width: 100, height: 50 }, { left: 10, top: 10 } as any, 2);
    expect(r).toEqual({ left: 5, top: 10, width: 50, height: 25 });
  });

  test("add/sub points and normalizeDragDelta", () => {
    expect(addPoints({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
    expect(subPoints({ x: 5, y: 5 }, { x: 2, y: 3 })).toEqual({ x: 3, y: 2 });
    expect(normalizeDragDelta({ x: 0, y: 0 }, { x: 10, y: 5 }, 2)).toEqual({ x: 5, y: 2.5 });
  });

  test("clampRectToPositive clamps negative values", () => {
    const clamped = clampRectToPositive({ left: -1, top: -2, width: -3, height: 4 });
    expect(clamped).toEqual({ left: 0, top: 0, width: 0, height: 4 });
  });

  test("rectsIntersect detects overlap and non-overlap", () => {
    const a = { left: 0, top: 0, width: 10, height: 10 };
    const b = { left: 5, top: 5, width: 10, height: 10 };
    const c = { left: 20, top: 20, width: 5, height: 5 };
    expect(rectsIntersect(a, b)).toBe(true);
    expect(rectsIntersect(a, c)).toBe(false);
  });
});


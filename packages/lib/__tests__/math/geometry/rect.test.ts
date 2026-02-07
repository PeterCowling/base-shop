import {
  area,
  type Bounds,
  boundsFromRect,
  // Properties
  center,
  clamp as clampPoint,
  // Tests
  containsPoint,
  containsRect,
  corners,
  equals as rectsEqual,
  expand,
  // Operations
  intersection,
  intersects,
  normalize as normalizeRect,
  perimeter,
  // Types
  type Rect,
  // Construction
  rect,
  rectFromBounds,
  rectFromCenter,
  rectFromPoints,
  scale as scaleRect,
  translate as translateRect,
  union,
} from "../../../src/math/geometry/rect";
import { vec2 } from "../../../src/math/geometry/vector";

describe("rect", () => {
  it("creates a rectangle from position and size", () => {
    const r = rect(10, 20, 100, 50);
    expect(r).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  it("handles zero dimensions", () => {
    const r = rect(0, 0, 0, 0);
    expect(r).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });

  it("handles negative dimensions", () => {
    const r = rect(100, 100, -50, -30);
    expect(r).toEqual({ x: 100, y: 100, width: -50, height: -30 });
  });
});

describe("rectFromBounds", () => {
  it("creates rectangle from bounds", () => {
    const r = rectFromBounds({ minX: 10, minY: 20, maxX: 110, maxY: 70 });
    expect(r).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  it("handles zero-size bounds", () => {
    const r = rectFromBounds({ minX: 50, minY: 50, maxX: 50, maxY: 50 });
    expect(r).toEqual({ x: 50, y: 50, width: 0, height: 0 });
  });
});

describe("rectFromPoints", () => {
  it("creates rectangle from two corners", () => {
    const r = rectFromPoints({ x: 0, y: 0 }, { x: 100, y: 50 });
    expect(r).toEqual({ x: 0, y: 0, width: 100, height: 50 });
  });

  it("handles points in reverse order", () => {
    const r = rectFromPoints({ x: 100, y: 100 }, { x: 0, y: 0 });
    expect(r).toEqual({ x: 0, y: 0, width: 100, height: 100 });
  });

  it("handles same point (zero-size rect)", () => {
    const r = rectFromPoints({ x: 50, y: 50 }, { x: 50, y: 50 });
    expect(r).toEqual({ x: 50, y: 50, width: 0, height: 0 });
  });

  it("handles diagonal points in any quadrant", () => {
    const r = rectFromPoints({ x: -50, y: 50 }, { x: 50, y: -50 });
    expect(r).toEqual({ x: -50, y: -50, width: 100, height: 100 });
  });
});

describe("rectFromCenter", () => {
  it("creates rectangle centered at point", () => {
    const r = rectFromCenter({ x: 50, y: 50 }, 100, 60);
    expect(r).toEqual({ x: 0, y: 20, width: 100, height: 60 });
  });

  it("handles zero dimensions", () => {
    const r = rectFromCenter({ x: 50, y: 50 }, 0, 0);
    expect(r).toEqual({ x: 50, y: 50, width: 0, height: 0 });
  });
});

describe("boundsFromRect", () => {
  it("converts rectangle to bounds", () => {
    const b = boundsFromRect({ x: 10, y: 20, width: 100, height: 50 });
    expect(b).toEqual({ minX: 10, minY: 20, maxX: 110, maxY: 70 });
  });

  it("handles zero-size rectangle", () => {
    const b = boundsFromRect({ x: 50, y: 50, width: 0, height: 0 });
    expect(b).toEqual({ minX: 50, minY: 50, maxX: 50, maxY: 50 });
  });
});

describe("center", () => {
  it("returns center point of rectangle", () => {
    const c = center({ x: 0, y: 0, width: 100, height: 50 });
    expect(c).toEqual({ x: 50, y: 25 });
  });

  it("handles non-zero origin", () => {
    const c = center({ x: 10, y: 20, width: 100, height: 50 });
    expect(c).toEqual({ x: 60, y: 45 });
  });

  it("handles zero-size rectangle", () => {
    const c = center({ x: 50, y: 50, width: 0, height: 0 });
    expect(c).toEqual({ x: 50, y: 50 });
  });
});

describe("area", () => {
  it("calculates area", () => {
    expect(area({ x: 0, y: 0, width: 10, height: 5 })).toBe(50);
  });

  it("returns zero for zero dimensions", () => {
    expect(area({ x: 0, y: 0, width: 0, height: 10 })).toBe(0);
    expect(area({ x: 0, y: 0, width: 10, height: 0 })).toBe(0);
  });

  it("handles negative dimensions (absolute area)", () => {
    // Note: negative dimensions produce negative area
    expect(area({ x: 0, y: 0, width: -10, height: 5 })).toBe(-50);
  });
});

describe("perimeter", () => {
  it("calculates perimeter", () => {
    expect(perimeter({ x: 0, y: 0, width: 10, height: 5 })).toBe(30);
  });

  it("returns zero for zero dimensions", () => {
    expect(perimeter({ x: 0, y: 0, width: 0, height: 0 })).toBe(0);
  });
});

describe("corners", () => {
  it("returns four corner points in clockwise order", () => {
    const c = corners({ x: 0, y: 0, width: 100, height: 50 });
    expect(c).toEqual([
      { x: 0, y: 0 }, // top-left
      { x: 100, y: 0 }, // top-right
      { x: 100, y: 50 }, // bottom-right
      { x: 0, y: 50 }, // bottom-left
    ]);
  });

  it("handles non-zero origin", () => {
    const c = corners({ x: 10, y: 20, width: 30, height: 40 });
    expect(c[0]).toEqual({ x: 10, y: 20 }); // top-left
    expect(c[2]).toEqual({ x: 40, y: 60 }); // bottom-right
  });
});

describe("containsPoint", () => {
  const box = { x: 0, y: 0, width: 100, height: 50 };

  it("returns true for point inside", () => {
    expect(containsPoint(box, { x: 50, y: 25 })).toBe(true);
  });

  it("returns true for point on edge (inclusive)", () => {
    expect(containsPoint(box, { x: 0, y: 0 })).toBe(true);
    expect(containsPoint(box, { x: 100, y: 50 })).toBe(true);
    expect(containsPoint(box, { x: 50, y: 0 })).toBe(true);
    expect(containsPoint(box, { x: 0, y: 25 })).toBe(true);
  });

  it("returns false for point outside", () => {
    expect(containsPoint(box, { x: -1, y: 25 })).toBe(false);
    expect(containsPoint(box, { x: 101, y: 25 })).toBe(false);
    expect(containsPoint(box, { x: 50, y: -1 })).toBe(false);
    expect(containsPoint(box, { x: 50, y: 51 })).toBe(false);
  });

  it("handles zero-size rectangle", () => {
    const point = { x: 50, y: 50, width: 0, height: 0 };
    expect(containsPoint(point, { x: 50, y: 50 })).toBe(true);
    expect(containsPoint(point, { x: 51, y: 50 })).toBe(false);
  });
});

describe("containsRect", () => {
  const outer = { x: 0, y: 0, width: 100, height: 100 };

  it("returns true when inner is fully contained", () => {
    const inner = { x: 10, y: 10, width: 20, height: 20 };
    expect(containsRect(outer, inner)).toBe(true);
  });

  it("returns true when inner touches edges", () => {
    const inner = { x: 0, y: 0, width: 100, height: 100 };
    expect(containsRect(outer, inner)).toBe(true);
  });

  it("returns false when inner extends beyond", () => {
    const inner = { x: 50, y: 50, width: 60, height: 60 };
    expect(containsRect(outer, inner)).toBe(false);
  });

  it("returns false when inner is completely outside", () => {
    const inner = { x: 200, y: 200, width: 20, height: 20 };
    expect(containsRect(outer, inner)).toBe(false);
  });
});

describe("intersects", () => {
  const a = { x: 0, y: 0, width: 10, height: 10 };

  it("returns true for overlapping rectangles", () => {
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(intersects(a, b)).toBe(true);
  });

  it("returns false for non-overlapping rectangles", () => {
    const c = { x: 20, y: 20, width: 5, height: 5 };
    expect(intersects(a, c)).toBe(false);
  });

  it("returns false for touching edges (strict inequality)", () => {
    const d = { x: 10, y: 0, width: 10, height: 10 }; // touching right edge
    expect(intersects(a, d)).toBe(false);
  });

  it("is symmetric", () => {
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(intersects(a, b)).toBe(intersects(b, a));
  });

  it("rectangle intersects with itself", () => {
    expect(intersects(a, a)).toBe(true);
  });
});

describe("intersection", () => {
  it("returns intersection rectangle for overlapping rects", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(intersection(a, b)).toEqual({ x: 5, y: 5, width: 5, height: 5 });
  });

  it("returns null for non-overlapping rectangles", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 20, y: 20, width: 10, height: 10 };
    expect(intersection(a, b)).toBeNull();
  });

  it("returns null for touching edges", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 10, y: 0, width: 10, height: 10 };
    expect(intersection(a, b)).toBeNull();
  });

  it("returns full rect when one contains other", () => {
    const outer = { x: 0, y: 0, width: 100, height: 100 };
    const inner = { x: 20, y: 20, width: 30, height: 30 };
    expect(intersection(outer, inner)).toEqual(inner);
  });
});

describe("union", () => {
  it("returns bounding box containing both rects", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 20, y: 20, width: 10, height: 10 };
    expect(union(a, b)).toEqual({ x: 0, y: 0, width: 30, height: 30 });
  });

  it("handles overlapping rectangles", () => {
    const a = { x: 0, y: 0, width: 20, height: 20 };
    const b = { x: 10, y: 10, width: 20, height: 20 };
    expect(union(a, b)).toEqual({ x: 0, y: 0, width: 30, height: 30 });
  });

  it("handles contained rectangle", () => {
    const outer = { x: 0, y: 0, width: 100, height: 100 };
    const inner = { x: 20, y: 20, width: 30, height: 30 };
    expect(union(outer, inner)).toEqual(outer);
  });

  it("is symmetric", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 20, y: 20, width: 10, height: 10 };
    expect(union(a, b)).toEqual(union(b, a));
  });
});

describe("expand", () => {
  it("expands rectangle by given amount", () => {
    const r = expand({ x: 10, y: 10, width: 80, height: 80 }, 10);
    expect(r).toEqual({ x: 0, y: 0, width: 100, height: 100 });
  });

  it("shrinks rectangle with negative amount", () => {
    const r = expand({ x: 0, y: 0, width: 100, height: 100 }, -10);
    expect(r).toEqual({ x: 10, y: 10, width: 80, height: 80 });
  });

  it("handles zero expansion", () => {
    const original = { x: 10, y: 10, width: 50, height: 50 };
    expect(expand(original, 0)).toEqual(original);
  });
});

describe("translateRect", () => {
  it("translates rectangle by offset", () => {
    const r = translateRect({ x: 0, y: 0, width: 100, height: 50 }, { x: 10, y: 20 });
    expect(r).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  it("handles negative offset", () => {
    const r = translateRect({ x: 50, y: 50, width: 100, height: 50 }, { x: -25, y: -25 });
    expect(r).toEqual({ x: 25, y: 25, width: 100, height: 50 });
  });

  it("preserves dimensions", () => {
    const original = { x: 0, y: 0, width: 100, height: 50 };
    const translated = translateRect(original, { x: 999, y: 999 });
    expect(translated.width).toBe(original.width);
    expect(translated.height).toBe(original.height);
  });
});

describe("scaleRect", () => {
  it("scales rectangle from center by default", () => {
    const r = scaleRect({ x: 0, y: 0, width: 100, height: 50 }, 2);
    expect(r).toEqual({ x: -50, y: -25, width: 200, height: 100 });
  });

  it("scales rectangle from custom origin", () => {
    const r = scaleRect({ x: 0, y: 0, width: 100, height: 50 }, 2, { x: 0, y: 0 });
    expect(r).toEqual({ x: 0, y: 0, width: 200, height: 100 });
  });

  it("scales down with factor < 1", () => {
    const r = scaleRect({ x: 0, y: 0, width: 100, height: 100 }, 0.5);
    expect(r).toEqual({ x: 25, y: 25, width: 50, height: 50 });
  });

  it("handles zero scale", () => {
    const r = scaleRect({ x: 0, y: 0, width: 100, height: 50 }, 0);
    expect(r.width).toBe(0);
    expect(r.height).toBe(0);
  });
});

describe("clampPoint", () => {
  const box = { x: 0, y: 0, width: 100, height: 50 };

  it("returns point if inside", () => {
    expect(clampPoint(box, { x: 50, y: 25 })).toEqual({ x: 50, y: 25 });
  });

  it("clamps point beyond right edge", () => {
    expect(clampPoint(box, { x: 150, y: 25 })).toEqual({ x: 100, y: 25 });
  });

  it("clamps point beyond left edge", () => {
    expect(clampPoint(box, { x: -50, y: 25 })).toEqual({ x: 0, y: 25 });
  });

  it("clamps point beyond bottom edge", () => {
    expect(clampPoint(box, { x: 50, y: 100 })).toEqual({ x: 50, y: 50 });
  });

  it("clamps point beyond top edge", () => {
    expect(clampPoint(box, { x: 50, y: -50 })).toEqual({ x: 50, y: 0 });
  });

  it("clamps corner point", () => {
    expect(clampPoint(box, { x: -10, y: -10 })).toEqual({ x: 0, y: 0 });
    expect(clampPoint(box, { x: 200, y: 200 })).toEqual({ x: 100, y: 50 });
  });
});

describe("normalizeRect", () => {
  it("keeps positive dimensions unchanged", () => {
    const r = normalizeRect({ x: 10, y: 20, width: 100, height: 50 });
    expect(r).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  it("normalizes negative width", () => {
    const r = normalizeRect({ x: 100, y: 20, width: -50, height: 30 });
    expect(r).toEqual({ x: 50, y: 20, width: 50, height: 30 });
  });

  it("normalizes negative height", () => {
    const r = normalizeRect({ x: 10, y: 100, width: 50, height: -30 });
    expect(r).toEqual({ x: 10, y: 70, width: 50, height: 30 });
  });

  it("normalizes both negative dimensions", () => {
    const r = normalizeRect({ x: 100, y: 100, width: -50, height: -30 });
    expect(r).toEqual({ x: 50, y: 70, width: 50, height: 30 });
  });

  it("handles zero dimensions", () => {
    const r = normalizeRect({ x: 50, y: 50, width: 0, height: 0 });
    expect(r).toEqual({ x: 50, y: 50, width: 0, height: 0 });
  });
});

describe("rectsEqual", () => {
  it("returns true for equal rectangles", () => {
    const a = { x: 0, y: 0, width: 100, height: 50 };
    const b = { x: 0, y: 0, width: 100, height: 50 };
    expect(rectsEqual(a, b)).toBe(true);
  });

  it("returns false for different rectangles", () => {
    const a = { x: 0, y: 0, width: 100, height: 50 };
    const b = { x: 0, y: 0, width: 100, height: 51 };
    expect(rectsEqual(a, b)).toBe(false);
  });

  it("handles epsilon tolerance", () => {
    const a = { x: 0, y: 0, width: 100, height: 50 };
    const b = { x: 0.0001, y: 0, width: 100, height: 50 };
    expect(rectsEqual(a, b, 0)).toBe(false);
    expect(rectsEqual(a, b, 0.001)).toBe(true);
  });

  it("is reflexive", () => {
    const r = { x: 10, y: 20, width: 30, height: 40 };
    expect(rectsEqual(r, r)).toBe(true);
  });

  it("is symmetric", () => {
    const a = { x: 0, y: 0, width: 100, height: 50 };
    const b = { x: 0, y: 0, width: 100, height: 50 };
    expect(rectsEqual(a, b)).toBe(rectsEqual(b, a));
  });
});

// Immutability tests

describe("immutability", () => {
  it("translateRect does not mutate input", () => {
    const original = { x: 0, y: 0, width: 100, height: 50 };
    translateRect(original, { x: 10, y: 20 });
    expect(original).toEqual({ x: 0, y: 0, width: 100, height: 50 });
  });

  it("scaleRect does not mutate input", () => {
    const original = { x: 0, y: 0, width: 100, height: 50 };
    scaleRect(original, 2);
    expect(original).toEqual({ x: 0, y: 0, width: 100, height: 50 });
  });

  it("expand does not mutate input", () => {
    const original = { x: 10, y: 10, width: 80, height: 80 };
    expand(original, 10);
    expect(original).toEqual({ x: 10, y: 10, width: 80, height: 80 });
  });

  it("normalizeRect does not mutate input", () => {
    const original = { x: 100, y: 100, width: -50, height: -30 };
    normalizeRect(original);
    expect(original).toEqual({ x: 100, y: 100, width: -50, height: -30 });
  });
});

// Edge cases

describe("edge cases", () => {
  it("intersection with self returns same rect", () => {
    const r = { x: 10, y: 10, width: 50, height: 50 };
    expect(intersection(r, r)).toEqual(r);
  });

  it("union with self returns same rect", () => {
    const r = { x: 10, y: 10, width: 50, height: 50 };
    expect(union(r, r)).toEqual(r);
  });

  it("handles very small rectangles", () => {
    const tiny = { x: 0, y: 0, width: 0.0001, height: 0.0001 };
    expect(area(tiny)).toBeCloseTo(0.00000001);
    expect(containsPoint(tiny, { x: 0, y: 0 })).toBe(true);
  });

  it("handles very large coordinates", () => {
    const large = { x: 1e10, y: 1e10, width: 100, height: 100 };
    const c = center(large);
    expect(c.x).toBeCloseTo(1e10 + 50);
    expect(c.y).toBeCloseTo(1e10 + 50);
  });
});

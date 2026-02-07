import {
  // Decomposition
  decompose,
  determinant,
  fromTransform,
  // Constants
  IDENTITY,
  identity,
  inverse,
  // Types
  type Matrix3x3,
  // Operations
  multiply,
  rotate,
  scale,
  skew,
  type TransformComponents,
  // Application
  transformPoint,
  transformVector,
  // Construction
  translate,
  transpose,
} from "../../../src/math/geometry/matrix";
import { vec2 } from "../../../src/math/geometry/vector";

describe("IDENTITY", () => {
  it("has correct values", () => {
    expect(IDENTITY).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  });

  it("is frozen", () => {
    expect(Object.isFrozen(IDENTITY)).toBe(true);
  });

  it("transforms point to itself", () => {
    const p = { x: 5, y: 10 };
    expect(transformPoint(IDENTITY, p)).toEqual(p);
  });
});

describe("identity", () => {
  it("creates a new identity matrix", () => {
    const m = identity();
    expect(m).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  });

  it("returns a new array each time", () => {
    const m1 = identity();
    const m2 = identity();
    expect(m1).not.toBe(m2);
    expect(m1).toEqual(m2);
  });
});

describe("translate", () => {
  it("creates a translation matrix", () => {
    const m = translate(10, 20);
    expect(m).toEqual([1, 0, 10, 0, 1, 20, 0, 0, 1]);
  });

  it("translates a point", () => {
    const m = translate(10, 20);
    const p = transformPoint(m, { x: 5, y: 5 });
    expect(p).toEqual({ x: 15, y: 25 });
  });

  it("handles negative translation", () => {
    const m = translate(-10, -20);
    const p = transformPoint(m, { x: 10, y: 20 });
    expect(p).toEqual({ x: 0, y: 0 });
  });

  it("handles zero translation (identity)", () => {
    const m = translate(0, 0);
    expect(m).toEqual(IDENTITY);
  });
});

describe("rotate", () => {
  it("creates a rotation matrix", () => {
    const m = rotate(Math.PI / 2); // 90 degrees
    // cos(90) = 0, sin(90) = 1
    expect(m[0]).toBeCloseTo(0);
    expect(m[1]).toBeCloseTo(-1);
    expect(m[3]).toBeCloseTo(1);
    expect(m[4]).toBeCloseTo(0);
  });

  it("rotates point 90 degrees counterclockwise", () => {
    const m = rotate(Math.PI / 2);
    const p = transformPoint(m, { x: 1, y: 0 });
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(1);
  });

  it("rotates point 180 degrees", () => {
    const m = rotate(Math.PI);
    const p = transformPoint(m, { x: 1, y: 0 });
    expect(p.x).toBeCloseTo(-1);
    expect(p.y).toBeCloseTo(0);
  });

  it("handles zero rotation (identity)", () => {
    const m = rotate(0);
    const p = transformPoint(m, { x: 5, y: 10 });
    expect(p.x).toBeCloseTo(5);
    expect(p.y).toBeCloseTo(10);
  });

  it("full rotation returns to original", () => {
    const m = rotate(Math.PI * 2);
    const p = transformPoint(m, { x: 3, y: 4 });
    expect(p.x).toBeCloseTo(3);
    expect(p.y).toBeCloseTo(4);
  });
});

describe("scale", () => {
  it("creates a scaling matrix", () => {
    const m = scale(2, 3);
    expect(m).toEqual([2, 0, 0, 0, 3, 0, 0, 0, 1]);
  });

  it("scales a point", () => {
    const m = scale(2, 3);
    const p = transformPoint(m, { x: 10, y: 10 });
    expect(p).toEqual({ x: 20, y: 30 });
  });

  it("handles uniform scaling", () => {
    const m = scale(2); // sy defaults to sx
    const p = transformPoint(m, { x: 5, y: 10 });
    expect(p).toEqual({ x: 10, y: 20 });
  });

  it("handles negative scale (reflection)", () => {
    const m = scale(-1, 1);
    const p = transformPoint(m, { x: 5, y: 10 });
    expect(p).toEqual({ x: -5, y: 10 });
  });

  it("handles zero scale", () => {
    const m = scale(0, 0);
    const p = transformPoint(m, { x: 100, y: 200 });
    expect(p).toEqual({ x: 0, y: 0 });
  });
});

describe("skew", () => {
  it("creates a skew matrix", () => {
    const m = skew(Math.PI / 4, 0); // 45 degree horizontal skew
    expect(m[0]).toBeCloseTo(1);
    expect(m[1]).toBeCloseTo(1); // tan(45) = 1
    expect(m[3]).toBeCloseTo(0);
    expect(m[4]).toBeCloseTo(1);
  });

  it("applies horizontal skew", () => {
    const m = skew(Math.PI / 4, 0);
    const p = transformPoint(m, { x: 0, y: 10 });
    expect(p.x).toBeCloseTo(10); // x += y * tan(45)
    expect(p.y).toBeCloseTo(10);
  });

  it("applies vertical skew", () => {
    const m = skew(0, Math.PI / 4);
    const p = transformPoint(m, { x: 10, y: 0 });
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(10); // y += x * tan(45)
  });

  it("handles zero skew (identity)", () => {
    const m = skew(0, 0);
    expect(m).toEqual(IDENTITY);
  });
});

describe("fromTransform", () => {
  it("creates matrix from transform components", () => {
    const m = fromTransform({
      translation: { x: 10, y: 20 },
      rotation: 0,
      scale: { x: 1, y: 1 },
      skew: { x: 0, y: 0 },
    });
    // Should be a translation matrix
    const p = transformPoint(m, { x: 0, y: 0 });
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(20);
  });

  it("combines scale and translation", () => {
    const m = fromTransform({
      translation: { x: 100, y: 50 },
      rotation: 0,
      scale: { x: 2, y: 2 },
      skew: { x: 0, y: 0 },
    });
    const p = transformPoint(m, { x: 10, y: 10 });
    // Scale first (20, 20), then translate (+100, +50)
    expect(p.x).toBeCloseTo(120);
    expect(p.y).toBeCloseTo(70);
  });

  it("combines rotation and translation", () => {
    const m = fromTransform({
      translation: { x: 10, y: 0 },
      rotation: Math.PI / 2,
      scale: { x: 1, y: 1 },
      skew: { x: 0, y: 0 },
    });
    const p = transformPoint(m, { x: 1, y: 0 });
    // Rotate (1,0) -> (0,1), then translate by (10, 0)
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(1);
  });
});

describe("multiply", () => {
  it("multiplies identity by itself", () => {
    const m = multiply(IDENTITY, IDENTITY);
    expect(m).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  });

  it("multiplies by identity returns same matrix", () => {
    const t = translate(10, 20);
    expect(multiply(t, IDENTITY)).toEqual(t);
    expect(multiply(IDENTITY, t)).toEqual(t);
  });

  it("combines translations", () => {
    const t1 = translate(10, 0);
    const t2 = translate(0, 20);
    const combined = multiply(t1, t2);
    const p = transformPoint(combined, { x: 0, y: 0 });
    expect(p).toEqual({ x: 10, y: 20 });
  });

  it("applies transformations right-to-left", () => {
    // multiply(a, b) applies b first, then a
    const t = translate(10, 0);
    const s = scale(2, 2);

    // scale first, then translate: (5,5) -> (10,10) -> (20,10)
    const scaleFirst = multiply(t, s);
    expect(transformPoint(scaleFirst, { x: 5, y: 5 })).toEqual({ x: 20, y: 10 });

    // translate first, then scale: (5,5) -> (15,5) -> (30,10)
    const translateFirst = multiply(s, t);
    expect(transformPoint(translateFirst, { x: 5, y: 5 })).toEqual({ x: 30, y: 10 });
  });

  it("is associative", () => {
    const a = translate(1, 2);
    const b = rotate(Math.PI / 4);
    const c = scale(2, 2);

    const left = multiply(multiply(a, b), c);
    const right = multiply(a, multiply(b, c));

    for (let i = 0; i < 9; i++) {
      expect(left[i]).toBeCloseTo(right[i]);
    }
  });
});

describe("determinant", () => {
  it("returns 1 for identity matrix", () => {
    expect(determinant(IDENTITY)).toBe(1);
  });

  it("returns scale product for scale matrix", () => {
    expect(determinant(scale(2, 3))).toBe(6);
  });

  it("returns 1 for rotation matrix", () => {
    const r = rotate(Math.PI / 4);
    expect(determinant(r)).toBeCloseTo(1);
  });

  it("returns 0 for singular matrix", () => {
    const singular: Matrix3x3 = [0, 0, 0, 0, 0, 0, 0, 0, 1];
    expect(determinant(singular)).toBe(0);
  });

  it("negative determinant for reflection", () => {
    expect(determinant(scale(-1, 1))).toBe(-1);
  });
});

describe("inverse", () => {
  it("inverts identity matrix", () => {
    const inv = inverse(IDENTITY);
    expect(inv).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  });

  it("inverts translation matrix", () => {
    const t = translate(10, 20);
    const inv = inverse(t);
    expect(inv).not.toBeNull();
    const p = transformPoint(inv!, { x: 10, y: 20 });
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });

  it("inverts scale matrix", () => {
    const s = scale(2, 4);
    const inv = inverse(s);
    expect(inv).not.toBeNull();
    const p = transformPoint(inv!, { x: 10, y: 20 });
    expect(p.x).toBeCloseTo(5);
    expect(p.y).toBeCloseTo(5);
  });

  it("inverts rotation matrix", () => {
    const r = rotate(Math.PI / 4);
    const inv = inverse(r);
    expect(inv).not.toBeNull();
    // Inverse rotation should be -PI/4
    const p = transformPoint(r, { x: 1, y: 0 });
    const pBack = transformPoint(inv!, p);
    expect(pBack.x).toBeCloseTo(1);
    expect(pBack.y).toBeCloseTo(0);
  });

  it("returns null for singular matrix", () => {
    const singular: Matrix3x3 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(inverse(singular)).toBeNull();
  });

  it("returns null for zero-scale matrix", () => {
    const zeroScale = scale(0, 0);
    expect(inverse(zeroScale)).toBeNull();
  });

  it("M * M^-1 = Identity", () => {
    const m = multiply(multiply(translate(10, 20), rotate(Math.PI / 3)), scale(2, 3));
    const inv = inverse(m);
    expect(inv).not.toBeNull();
    const product = multiply(m, inv!);
    for (let i = 0; i < 9; i++) {
      expect(product[i]).toBeCloseTo(IDENTITY[i]);
    }
  });
});

describe("transpose", () => {
  it("transposes a matrix", () => {
    const m: Matrix3x3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const t = transpose(m);
    expect(t).toEqual([1, 4, 7, 2, 5, 8, 3, 6, 9]);
  });

  it("transpose of identity is identity", () => {
    expect(transpose(IDENTITY)).toEqual(IDENTITY);
  });

  it("double transpose returns original", () => {
    const m: Matrix3x3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    expect(transpose(transpose(m))).toEqual(m);
  });
});

describe("transformPoint", () => {
  it("transforms origin with translation", () => {
    const m = translate(10, 20);
    expect(transformPoint(m, { x: 0, y: 0 })).toEqual({ x: 10, y: 20 });
  });

  it("includes translation component", () => {
    const m = translate(100, 50);
    const p = transformPoint(m, { x: 5, y: 5 });
    expect(p).toEqual({ x: 105, y: 55 });
  });

  it("applies scale and translation together", () => {
    const m = multiply(translate(10, 10), scale(2, 2));
    const p = transformPoint(m, { x: 5, y: 5 });
    // scale (5,5) -> (10, 10), translate -> (20, 20)
    expect(p).toEqual({ x: 20, y: 20 });
  });
});

describe("transformVector", () => {
  it("ignores translation for vectors", () => {
    const m = translate(100, 200);
    const v = transformVector(m, { x: 5, y: 10 });
    expect(v).toEqual({ x: 5, y: 10 });
  });

  it("applies scale to vectors", () => {
    const m = scale(2, 3);
    const v = transformVector(m, { x: 5, y: 10 });
    expect(v).toEqual({ x: 10, y: 30 });
  });

  it("applies rotation to vectors", () => {
    const m = rotate(Math.PI / 2);
    const v = transformVector(m, { x: 1, y: 0 });
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(1);
  });

  it("differs from transformPoint for translated matrix", () => {
    const m = multiply(translate(100, 100), scale(2, 2));
    const point = transformPoint(m, { x: 0, y: 0 });
    const vector = transformVector(m, { x: 0, y: 0 });
    expect(point).toEqual({ x: 100, y: 100 });
    expect(vector).toEqual({ x: 0, y: 0 });
  });
});

describe("decompose", () => {
  it("decomposes identity matrix", () => {
    const d = decompose(IDENTITY);
    expect(d.translation).toEqual({ x: 0, y: 0 });
    expect(d.rotation).toBeCloseTo(0);
    expect(d.scale.x).toBeCloseTo(1);
    expect(d.scale.y).toBeCloseTo(1);
  });

  it("decomposes translation matrix", () => {
    const m = translate(10, 20);
    const d = decompose(m);
    expect(d.translation).toEqual({ x: 10, y: 20 });
    expect(d.rotation).toBeCloseTo(0);
    expect(d.scale.x).toBeCloseTo(1);
    expect(d.scale.y).toBeCloseTo(1);
  });

  it("decomposes rotation matrix", () => {
    const m = rotate(Math.PI / 4);
    const d = decompose(m);
    expect(d.translation.x).toBeCloseTo(0);
    expect(d.translation.y).toBeCloseTo(0);
    expect(d.rotation).toBeCloseTo(Math.PI / 4);
    expect(d.scale.x).toBeCloseTo(1);
    expect(d.scale.y).toBeCloseTo(1);
  });

  it("decomposes scale matrix", () => {
    const m = scale(2, 3);
    const d = decompose(m);
    expect(d.translation.x).toBeCloseTo(0);
    expect(d.translation.y).toBeCloseTo(0);
    expect(d.rotation).toBeCloseTo(0);
    expect(Math.abs(d.scale.x)).toBeCloseTo(2);
    expect(Math.abs(d.scale.y)).toBeCloseTo(3);
  });

  it("decomposes combined transformation", () => {
    const m = multiply(translate(10, 20), rotate(Math.PI / 4));
    const d = decompose(m);
    expect(d.translation).toEqual({ x: 10, y: 20 });
    expect(d.rotation).toBeCloseTo(Math.PI / 4);
  });

  it("round-trips with fromTransform (approximately)", () => {
    const original = {
      translation: { x: 50, y: 30 },
      rotation: Math.PI / 6,
      scale: { x: 2, y: 3 },
      skew: { x: 0, y: 0 }, // Note: skew makes decomposition non-unique
    };
    const m = fromTransform(original);
    const d = decompose(m);

    expect(d.translation.x).toBeCloseTo(original.translation.x);
    expect(d.translation.y).toBeCloseTo(original.translation.y);
    expect(d.rotation).toBeCloseTo(original.rotation);
    // Scale may have sign differences due to determinant
    expect(Math.abs(d.scale.x)).toBeCloseTo(Math.abs(original.scale.x));
    expect(Math.abs(d.scale.y)).toBeCloseTo(Math.abs(original.scale.y));
  });
});

// Immutability tests

describe("immutability", () => {
  it("multiply does not mutate inputs", () => {
    const a = translate(10, 20);
    const b = scale(2, 2);
    const aCopy = [...a] as unknown as Matrix3x3;
    const bCopy = [...b] as unknown as Matrix3x3;
    multiply(a, b);
    expect(a).toEqual(aCopy);
    expect(b).toEqual(bCopy);
  });

  it("inverse does not mutate input", () => {
    const m = translate(10, 20);
    const mCopy = [...m] as unknown as Matrix3x3;
    inverse(m);
    expect(m).toEqual(mCopy);
  });

  it("transpose does not mutate input", () => {
    const m: Matrix3x3 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const mCopy = [...m] as unknown as Matrix3x3;
    transpose(m);
    expect(m).toEqual(mCopy);
  });
});

// Edge cases

describe("edge cases", () => {
  it("handles very small rotation angles", () => {
    const m = rotate(0.0001);
    const p = transformPoint(m, { x: 1, y: 0 });
    expect(p.x).toBeCloseTo(1);
    expect(p.y).toBeCloseTo(0.0001);
  });

  it("handles negative rotation", () => {
    const m = rotate(-Math.PI / 2);
    const p = transformPoint(m, { x: 1, y: 0 });
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(-1);
  });

  it("handles very large scale values", () => {
    const m = scale(1e6, 1e6);
    const p = transformPoint(m, { x: 1, y: 1 });
    expect(p.x).toBeCloseTo(1e6);
    expect(p.y).toBeCloseTo(1e6);
  });

  it("handles very small scale values", () => {
    const m = scale(1e-6, 1e-6);
    const p = transformPoint(m, { x: 1e6, y: 1e6 });
    expect(p.x).toBeCloseTo(1);
    expect(p.y).toBeCloseTo(1);
  });
});

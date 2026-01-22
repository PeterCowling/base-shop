import {
  // Vector2 Arithmetic
  add,
  // Vector3 Operations
  add3,
  // Vector2 Angles
  angle,
  angleBetween,
  cross,
  cross2D,
  distance,
  distance3,
  distanceSquared,
  distanceSquared3,
  div,
  div3,
  // Vector2 Products
  dot,
  dot3,
  // Vector2 Interpolation & Projection
  lerp as lerpVec2,
  lerp3 as lerpVec3,
  // Vector2 Magnitude
  magnitude,
  magnitude3,
  magnitudeSquared,
  magnitudeSquared3,
  mul,
  mul3,
  negate,
  negate3,
  normalize,
  normalize3,
  perpendicular,
  project,
  reflect,
  rotate as rotateVec2,
  sub,
  sub3,
  UNIT_X,
  UNIT_X3,
  UNIT_Y,
  UNIT_Y3,
  UNIT_Z3,
  // Construction
  vec2,
  vec3,
  // Types and Constants
  type Vector2,
  type Vector3,
  ZERO2,
  ZERO3,
} from "../../../src/math/geometry/vector";

describe("Vector2 Constants", () => {
  describe("ZERO2", () => {
    it("has zero components", () => {
      expect(ZERO2.x).toBe(0);
      expect(ZERO2.y).toBe(0);
    });

    it("is frozen", () => {
      expect(Object.isFrozen(ZERO2)).toBe(true);
    });
  });

  describe("UNIT_X", () => {
    it("points in positive X direction", () => {
      expect(UNIT_X.x).toBe(1);
      expect(UNIT_X.y).toBe(0);
    });

    it("is frozen", () => {
      expect(Object.isFrozen(UNIT_X)).toBe(true);
    });
  });

  describe("UNIT_Y", () => {
    it("points in positive Y direction", () => {
      expect(UNIT_Y.x).toBe(0);
      expect(UNIT_Y.y).toBe(1);
    });

    it("is frozen", () => {
      expect(Object.isFrozen(UNIT_Y)).toBe(true);
    });
  });
});

describe("Vector3 Constants", () => {
  describe("ZERO3", () => {
    it("has zero components", () => {
      expect(ZERO3.x).toBe(0);
      expect(ZERO3.y).toBe(0);
      expect(ZERO3.z).toBe(0);
    });

    it("is frozen", () => {
      expect(Object.isFrozen(ZERO3)).toBe(true);
    });
  });

  describe("UNIT_X3", () => {
    it("points in positive X direction", () => {
      expect(UNIT_X3).toEqual({ x: 1, y: 0, z: 0 });
    });
  });

  describe("UNIT_Y3", () => {
    it("points in positive Y direction", () => {
      expect(UNIT_Y3).toEqual({ x: 0, y: 1, z: 0 });
    });
  });

  describe("UNIT_Z3", () => {
    it("points in positive Z direction", () => {
      expect(UNIT_Z3).toEqual({ x: 0, y: 0, z: 1 });
    });
  });
});

describe("vec2", () => {
  it("creates a vector with given components", () => {
    const v = vec2(3, 4);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  it("handles negative values", () => {
    const v = vec2(-5, -10);
    expect(v).toEqual({ x: -5, y: -10 });
  });

  it("handles floating point values", () => {
    const v = vec2(1.5, 2.7);
    expect(v.x).toBeCloseTo(1.5);
    expect(v.y).toBeCloseTo(2.7);
  });
});

describe("vec3", () => {
  it("creates a vector with given components", () => {
    const v = vec3(1, 2, 3);
    expect(v).toEqual({ x: 1, y: 2, z: 3 });
  });
});

describe("add", () => {
  it("adds two vectors", () => {
    expect(add({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
  });

  it("handles negative values", () => {
    expect(add({ x: 5, y: 5 }, { x: -3, y: -2 })).toEqual({ x: 2, y: 3 });
  });

  it("handles zero vectors", () => {
    expect(add({ x: 5, y: 5 }, ZERO2)).toEqual({ x: 5, y: 5 });
  });

  it("is commutative", () => {
    const a = { x: 1, y: 2 };
    const b = { x: 3, y: 4 };
    expect(add(a, b)).toEqual(add(b, a));
  });
});

describe("sub", () => {
  it("subtracts second vector from first", () => {
    expect(sub({ x: 5, y: 7 }, { x: 2, y: 3 })).toEqual({ x: 3, y: 4 });
  });

  it("handles negative results", () => {
    expect(sub({ x: 1, y: 1 }, { x: 5, y: 5 })).toEqual({ x: -4, y: -4 });
  });

  it("subtracting zero returns same vector", () => {
    const v = { x: 5, y: 5 };
    expect(sub(v, ZERO2)).toEqual(v);
  });
});

describe("mul", () => {
  it("multiplies vector by scalar", () => {
    expect(mul({ x: 2, y: 3 }, 4)).toEqual({ x: 8, y: 12 });
  });

  it("handles zero scalar", () => {
    expect(mul({ x: 100, y: 200 }, 0)).toEqual({ x: 0, y: 0 });
  });

  it("handles negative scalar", () => {
    expect(mul({ x: 2, y: 3 }, -2)).toEqual({ x: -4, y: -6 });
  });

  it("handles fractional scalar", () => {
    expect(mul({ x: 10, y: 20 }, 0.5)).toEqual({ x: 5, y: 10 });
  });
});

describe("div", () => {
  it("divides vector by scalar", () => {
    expect(div({ x: 8, y: 12 }, 4)).toEqual({ x: 2, y: 3 });
  });

  it("handles fractional results", () => {
    const result = div({ x: 1, y: 1 }, 3);
    expect(result.x).toBeCloseTo(1 / 3);
    expect(result.y).toBeCloseTo(1 / 3);
  });

  it("throws on division by zero", () => {
    expect(() => div({ x: 1, y: 1 }, 0)).toThrow("Cannot divide vector by zero");
  });

  it("handles negative scalar", () => {
    expect(div({ x: 6, y: 9 }, -3)).toEqual({ x: -2, y: -3 });
  });
});

describe("negate", () => {
  it("negates vector components", () => {
    expect(negate({ x: 3, y: -4 })).toEqual({ x: -3, y: 4 });
  });

  it("double negation returns original", () => {
    const v = { x: 5, y: -7 };
    expect(negate(negate(v))).toEqual(v);
  });

  it("negating zero returns zero", () => {
    expect(negate(ZERO2)).toEqual({ x: -0, y: -0 });
  });
});

describe("dot", () => {
  it("computes dot product", () => {
    expect(dot({ x: 1, y: 2 }, { x: 3, y: 4 })).toBe(11); // 1*3 + 2*4
  });

  it("perpendicular vectors have zero dot product", () => {
    expect(dot({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(0);
  });

  it("dot product with self equals magnitude squared", () => {
    const v = { x: 3, y: 4 };
    expect(dot(v, v)).toBe(magnitudeSquared(v));
  });

  it("is commutative", () => {
    const a = { x: 2, y: 3 };
    const b = { x: 4, y: 5 };
    expect(dot(a, b)).toBe(dot(b, a));
  });
});

describe("cross2D", () => {
  it("computes 2D cross product (z component)", () => {
    expect(cross2D({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(1); // counterclockwise
    expect(cross2D({ x: 0, y: 1 }, { x: 1, y: 0 })).toBe(-1); // clockwise
  });

  it("parallel vectors have zero cross product", () => {
    expect(cross2D({ x: 2, y: 0 }, { x: 5, y: 0 })).toBe(0);
  });

  it("cross product with self is zero", () => {
    const v = { x: 3, y: 4 };
    expect(cross2D(v, v)).toBe(0);
  });
});

describe("magnitude", () => {
  it("computes vector length", () => {
    expect(magnitude({ x: 3, y: 4 })).toBe(5);
  });

  it("returns zero for zero vector", () => {
    expect(magnitude(ZERO2)).toBe(0);
  });

  it("handles unit vectors", () => {
    expect(magnitude(UNIT_X)).toBe(1);
    expect(magnitude(UNIT_Y)).toBe(1);
  });

  it("handles negative components", () => {
    expect(magnitude({ x: -3, y: -4 })).toBe(5);
  });
});

describe("magnitudeSquared", () => {
  it("computes squared length", () => {
    expect(magnitudeSquared({ x: 3, y: 4 })).toBe(25);
  });

  it("is faster than magnitude (no sqrt)", () => {
    const v = { x: 3, y: 4 };
    expect(magnitudeSquared(v)).toBe(magnitude(v) ** 2);
  });
});

describe("normalize", () => {
  it("returns unit vector in same direction", () => {
    const n = normalize({ x: 3, y: 4 });
    expect(n.x).toBeCloseTo(0.6);
    expect(n.y).toBeCloseTo(0.8);
    expect(magnitude(n)).toBeCloseTo(1);
  });

  it("returns ZERO2 for zero-length vector (not NaN)", () => {
    const n = normalize(ZERO2);
    expect(n).toEqual(ZERO2);
    expect(Number.isNaN(n.x)).toBe(false);
    expect(Number.isNaN(n.y)).toBe(false);
  });

  it("preserves direction", () => {
    const v = { x: -6, y: 8 };
    const n = normalize(v);
    expect(n.x).toBeCloseTo(-0.6);
    expect(n.y).toBeCloseTo(0.8);
  });

  it("unit vectors remain unchanged", () => {
    const n = normalize(UNIT_X);
    expect(n.x).toBeCloseTo(1);
    expect(n.y).toBeCloseTo(0);
  });
});

describe("distance", () => {
  it("computes distance between two points", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it("distance to self is zero", () => {
    const p = { x: 5, y: 5 };
    expect(distance(p, p)).toBe(0);
  });

  it("is symmetric", () => {
    const a = { x: 1, y: 2 };
    const b = { x: 4, y: 6 };
    expect(distance(a, b)).toBe(distance(b, a));
  });
});

describe("distanceSquared", () => {
  it("computes squared distance", () => {
    expect(distanceSquared({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(25);
  });

  it("is faster than distance (no sqrt)", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 3, y: 4 };
    expect(distanceSquared(a, b)).toBe(distance(a, b) ** 2);
  });
});

describe("angle", () => {
  it("returns angle from positive X axis", () => {
    expect(angle({ x: 1, y: 0 })).toBeCloseTo(0);
    expect(angle({ x: 0, y: 1 })).toBeCloseTo(Math.PI / 2);
    expect(angle({ x: -1, y: 0 })).toBeCloseTo(Math.PI);
    expect(angle({ x: 0, y: -1 })).toBeCloseTo(-Math.PI / 2);
  });

  it("handles diagonal vectors", () => {
    expect(angle({ x: 1, y: 1 })).toBeCloseTo(Math.PI / 4);
  });
});

describe("angleBetween", () => {
  it("computes angle between two vectors", () => {
    expect(angleBetween({ x: 1, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(Math.PI / 2);
    expect(angleBetween({ x: 1, y: 0 }, { x: -1, y: 0 })).toBeCloseTo(Math.PI);
  });

  it("returns 0 for parallel vectors", () => {
    expect(angleBetween({ x: 1, y: 0 }, { x: 5, y: 0 })).toBeCloseTo(0);
  });

  it("returns 0 for zero-length vector (edge case)", () => {
    expect(angleBetween({ x: 1, y: 0 }, ZERO2)).toBe(0);
    expect(angleBetween(ZERO2, { x: 1, y: 0 })).toBe(0);
  });

  it("is symmetric", () => {
    const a = { x: 1, y: 2 };
    const b = { x: 3, y: 1 };
    expect(angleBetween(a, b)).toBeCloseTo(angleBetween(b, a));
  });
});

describe("rotateVec2", () => {
  it("rotates vector by 90 degrees", () => {
    const r = rotateVec2({ x: 1, y: 0 }, Math.PI / 2);
    expect(r.x).toBeCloseTo(0);
    expect(r.y).toBeCloseTo(1);
  });

  it("rotates vector by 180 degrees", () => {
    const r = rotateVec2({ x: 1, y: 0 }, Math.PI);
    expect(r.x).toBeCloseTo(-1);
    expect(r.y).toBeCloseTo(0);
  });

  it("rotates vector by -90 degrees", () => {
    const r = rotateVec2({ x: 1, y: 0 }, -Math.PI / 2);
    expect(r.x).toBeCloseTo(0);
    expect(r.y).toBeCloseTo(-1);
  });

  it("full rotation returns same vector", () => {
    const v = { x: 3, y: 4 };
    const r = rotateVec2(v, Math.PI * 2);
    expect(r.x).toBeCloseTo(v.x);
    expect(r.y).toBeCloseTo(v.y);
  });

  it("preserves magnitude", () => {
    const v = { x: 3, y: 4 };
    const r = rotateVec2(v, Math.PI / 3);
    expect(magnitude(r)).toBeCloseTo(magnitude(v));
  });
});

describe("lerpVec2", () => {
  it("returns start at t=0", () => {
    expect(lerpVec2({ x: 0, y: 0 }, { x: 10, y: 20 }, 0)).toEqual({ x: 0, y: 0 });
  });

  it("returns end at t=1", () => {
    expect(lerpVec2({ x: 0, y: 0 }, { x: 10, y: 20 }, 1)).toEqual({ x: 10, y: 20 });
  });

  it("returns midpoint at t=0.5", () => {
    expect(lerpVec2({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5)).toEqual({ x: 5, y: 10 });
  });

  it("extrapolates for t>1", () => {
    expect(lerpVec2({ x: 0, y: 0 }, { x: 10, y: 10 }, 2)).toEqual({ x: 20, y: 20 });
  });

  it("extrapolates for t<0", () => {
    expect(lerpVec2({ x: 10, y: 10 }, { x: 20, y: 20 }, -1)).toEqual({ x: 0, y: 0 });
  });
});

describe("reflect", () => {
  it("reflects off horizontal surface", () => {
    const r = reflect({ x: 1, y: -1 }, { x: 0, y: 1 });
    expect(r.x).toBeCloseTo(1);
    expect(r.y).toBeCloseTo(1);
  });

  it("reflects off vertical surface", () => {
    const r = reflect({ x: 1, y: 1 }, { x: -1, y: 0 });
    expect(r.x).toBeCloseTo(-1);
    expect(r.y).toBeCloseTo(1);
  });

  it("perpendicular to normal inverts vector", () => {
    const r = reflect({ x: 0, y: -1 }, { x: 0, y: 1 });
    expect(r.x).toBeCloseTo(0);
    expect(r.y).toBeCloseTo(1);
  });
});

describe("project", () => {
  it("projects onto X axis", () => {
    const p = project({ x: 3, y: 4 }, { x: 1, y: 0 });
    expect(p.x).toBeCloseTo(3);
    expect(p.y).toBeCloseTo(0);
  });

  it("projects onto Y axis", () => {
    const p = project({ x: 3, y: 4 }, { x: 0, y: 1 });
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(4);
  });

  it("projects onto zero vector returns ZERO2", () => {
    const p = project({ x: 3, y: 4 }, ZERO2);
    expect(p).toEqual(ZERO2);
  });

  it("projecting parallel vectors returns same magnitude", () => {
    const p = project({ x: 5, y: 0 }, { x: 1, y: 0 });
    expect(p).toEqual({ x: 5, y: 0 });
  });
});

describe("perpendicular", () => {
  it("returns 90 degree counterclockwise rotation", () => {
    const p1 = perpendicular({ x: 1, y: 0 });
    expect(p1.x).toBeCloseTo(0);
    expect(p1.y).toBe(1);
    expect(perpendicular({ x: 0, y: 1 })).toEqual({ x: -1, y: 0 });
  });

  it("is perpendicular to original", () => {
    const v = { x: 3, y: 4 };
    const p = perpendicular(v);
    expect(dot(v, p)).toBeCloseTo(0);
  });

  it("preserves magnitude", () => {
    const v = { x: 3, y: 4 };
    expect(magnitude(perpendicular(v))).toBeCloseTo(magnitude(v));
  });
});

// Vector3 Tests

describe("add3", () => {
  it("adds two 3D vectors", () => {
    expect(add3({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 })).toEqual({
      x: 5,
      y: 7,
      z: 9,
    });
  });
});

describe("sub3", () => {
  it("subtracts two 3D vectors", () => {
    expect(sub3({ x: 5, y: 7, z: 9 }, { x: 1, y: 2, z: 3 })).toEqual({
      x: 4,
      y: 5,
      z: 6,
    });
  });
});

describe("mul3", () => {
  it("multiplies 3D vector by scalar", () => {
    expect(mul3({ x: 1, y: 2, z: 3 }, 2)).toEqual({ x: 2, y: 4, z: 6 });
  });
});

describe("div3", () => {
  it("divides 3D vector by scalar", () => {
    expect(div3({ x: 6, y: 9, z: 12 }, 3)).toEqual({ x: 2, y: 3, z: 4 });
  });

  it("throws on division by zero", () => {
    expect(() => div3({ x: 1, y: 1, z: 1 }, 0)).toThrow(
      "Cannot divide vector by zero"
    );
  });
});

describe("negate3", () => {
  it("negates 3D vector", () => {
    expect(negate3({ x: 1, y: -2, z: 3 })).toEqual({ x: -1, y: 2, z: -3 });
  });
});

describe("dot3", () => {
  it("computes 3D dot product", () => {
    expect(dot3({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 })).toBe(32); // 1*4 + 2*5 + 3*6
  });
});

describe("cross", () => {
  it("computes 3D cross product", () => {
    expect(cross({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toEqual({
      x: 0,
      y: 0,
      z: 1,
    });
  });

  it("cross product is perpendicular to both inputs", () => {
    const a = { x: 1, y: 2, z: 3 };
    const b = { x: 4, y: 5, z: 6 };
    const c = cross(a, b);
    expect(dot3(a, c)).toBeCloseTo(0);
    expect(dot3(b, c)).toBeCloseTo(0);
  });

  it("cross product with self is zero", () => {
    const v = { x: 1, y: 2, z: 3 };
    const c = cross(v, v);
    expect(c).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("is anti-commutative", () => {
    const a = { x: 1, y: 2, z: 3 };
    const b = { x: 4, y: 5, z: 6 };
    const ab = cross(a, b);
    const ba = cross(b, a);
    expect(ab.x).toBeCloseTo(-ba.x);
    expect(ab.y).toBeCloseTo(-ba.y);
    expect(ab.z).toBeCloseTo(-ba.z);
  });
});

describe("magnitude3", () => {
  it("computes 3D vector length", () => {
    expect(magnitude3({ x: 2, y: 3, z: 6 })).toBe(7);
  });

  it("returns 0 for zero vector", () => {
    expect(magnitude3(ZERO3)).toBe(0);
  });
});

describe("magnitudeSquared3", () => {
  it("computes squared 3D length", () => {
    expect(magnitudeSquared3({ x: 2, y: 3, z: 6 })).toBe(49);
  });
});

describe("normalize3", () => {
  it("returns unit vector in same direction", () => {
    const n = normalize3({ x: 0, y: 0, z: 5 });
    expect(n).toEqual({ x: 0, y: 0, z: 1 });
    expect(magnitude3(n)).toBeCloseTo(1);
  });

  it("returns ZERO3 for zero-length vector (not NaN)", () => {
    const n = normalize3(ZERO3);
    expect(n).toEqual(ZERO3);
    expect(Number.isNaN(n.x)).toBe(false);
    expect(Number.isNaN(n.y)).toBe(false);
    expect(Number.isNaN(n.z)).toBe(false);
  });
});

describe("distance3", () => {
  it("computes distance between two 3D points", () => {
    expect(distance3({ x: 0, y: 0, z: 0 }, { x: 2, y: 3, z: 6 })).toBe(7);
  });

  it("distance to self is zero", () => {
    const p = { x: 1, y: 2, z: 3 };
    expect(distance3(p, p)).toBe(0);
  });
});

describe("distanceSquared3", () => {
  it("computes squared distance between two 3D points", () => {
    expect(distanceSquared3({ x: 0, y: 0, z: 0 }, { x: 2, y: 3, z: 6 })).toBe(49);
  });
});

describe("lerpVec3", () => {
  it("returns start at t=0", () => {
    expect(lerpVec3({ x: 0, y: 0, z: 0 }, { x: 10, y: 20, z: 30 }, 0)).toEqual({
      x: 0,
      y: 0,
      z: 0,
    });
  });

  it("returns end at t=1", () => {
    expect(lerpVec3({ x: 0, y: 0, z: 0 }, { x: 10, y: 20, z: 30 }, 1)).toEqual({
      x: 10,
      y: 20,
      z: 30,
    });
  });

  it("returns midpoint at t=0.5", () => {
    expect(lerpVec3({ x: 0, y: 0, z: 0 }, { x: 10, y: 20, z: 30 }, 0.5)).toEqual({
      x: 5,
      y: 10,
      z: 15,
    });
  });
});

// Edge cases and immutability tests

describe("immutability", () => {
  it("add does not mutate inputs", () => {
    const a = { x: 1, y: 2 };
    const b = { x: 3, y: 4 };
    add(a, b);
    expect(a).toEqual({ x: 1, y: 2 });
    expect(b).toEqual({ x: 3, y: 4 });
  });

  it("normalize does not mutate input", () => {
    const v = { x: 3, y: 4 };
    normalize(v);
    expect(v).toEqual({ x: 3, y: 4 });
  });

  it("rotateVec2 does not mutate input", () => {
    const v = { x: 1, y: 0 };
    rotateVec2(v, Math.PI / 2);
    expect(v).toEqual({ x: 1, y: 0 });
  });
});

describe("special floating point values", () => {
  it("handles Infinity", () => {
    const v = { x: Infinity, y: 0 };
    expect(magnitude(v)).toBe(Infinity);
  });

  it("dot product with Infinity", () => {
    expect(dot({ x: Infinity, y: 0 }, { x: 1, y: 0 })).toBe(Infinity);
  });
});

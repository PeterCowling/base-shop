import {
  clamp,
  clamp01,
  cubicBezier,
  ease,
  easeIn,
  easeInOut,
  easeInOutBack,
  easeInOutQuint,
  easeOut,
  easeOutBack,
  easeOutQuint,
  inverseLerp,
  lerp,
  linear,
  remap,
  spring,
} from "../../../src/math/animation/bezier";

describe("cubicBezier", () => {
  describe("boundary values", () => {
    it("returns 0 for t=0", () => {
      const ease = cubicBezier(0.25, 0.1, 0.25, 1.0);
      expect(ease(0)).toBe(0);
    });

    it("returns 1 for t=1", () => {
      const ease = cubicBezier(0.25, 0.1, 0.25, 1.0);
      expect(ease(1)).toBe(1);
    });

    it("returns 0 for t<0", () => {
      const ease = cubicBezier(0.25, 0.1, 0.25, 1.0);
      expect(ease(-0.5)).toBe(0);
      expect(ease(-1)).toBe(0);
    });

    it("returns 1 for t>1", () => {
      const ease = cubicBezier(0.25, 0.1, 0.25, 1.0);
      expect(ease(1.5)).toBe(1);
      expect(ease(2)).toBe(1);
    });
  });

  describe("validation", () => {
    it("throws for x1 < 0", () => {
      expect(() => cubicBezier(-0.1, 0, 0.5, 1)).toThrow(
        "Bézier x values must be in [0, 1]"
      );
    });

    it("throws for x1 > 1", () => {
      expect(() => cubicBezier(1.1, 0, 0.5, 1)).toThrow(
        "Bézier x values must be in [0, 1]"
      );
    });

    it("throws for x2 < 0", () => {
      expect(() => cubicBezier(0.5, 0, -0.1, 1)).toThrow(
        "Bézier x values must be in [0, 1]"
      );
    });

    it("throws for x2 > 1", () => {
      expect(() => cubicBezier(0.5, 0, 1.1, 1)).toThrow(
        "Bézier x values must be in [0, 1]"
      );
    });

    it("allows y values outside [0,1] (for overshoot)", () => {
      expect(() => cubicBezier(0.5, -0.5, 0.5, 1.5)).not.toThrow();
    });
  });

  describe("linear case optimization", () => {
    it("returns linear function when all points are equal", () => {
      const linearBezier = cubicBezier(0.5, 0.5, 0.5, 0.5);

      for (let t = 0; t <= 1; t += 0.1) {
        expect(linearBezier(t)).toBeCloseTo(t, 5);
      }
    });
  });

  describe("CSS compatibility", () => {
    // These values are verified against CSS cubic-bezier output
    it("matches CSS ease (0.25, 0.1, 0.25, 1.0)", () => {
      const easeFn = cubicBezier(0.25, 0.1, 0.25, 1.0);

      // Known CSS ease values at specific points
      expect(easeFn(0)).toBeCloseTo(0, 5);
      expect(easeFn(0.25)).toBeCloseTo(0.409, 2);
      expect(easeFn(0.5)).toBeCloseTo(0.802, 2);
      expect(easeFn(0.75)).toBeCloseTo(0.960, 2);
      expect(easeFn(1)).toBeCloseTo(1, 5);
    });

    it("matches CSS ease-in (0.42, 0, 1.0, 1.0)", () => {
      const easeFn = cubicBezier(0.42, 0, 1.0, 1.0);

      expect(easeFn(0)).toBeCloseTo(0, 5);
      // At t=0.5, ease-in is still accelerating, so output is less than 0.5
      expect(easeFn(0.5)).toBeCloseTo(0.315, 2);
      expect(easeFn(1)).toBeCloseTo(1, 5);
    });

    it("matches CSS ease-out (0, 0, 0.58, 1.0)", () => {
      const easeFn = cubicBezier(0, 0, 0.58, 1.0);

      expect(easeFn(0)).toBeCloseTo(0, 5);
      // At t=0.5, ease-out has already done most of the movement
      expect(easeFn(0.5)).toBeCloseTo(0.685, 2);
      expect(easeFn(1)).toBeCloseTo(1, 5);
    });

    it("matches CSS ease-in-out (0.42, 0, 0.58, 1.0)", () => {
      const easeFn = cubicBezier(0.42, 0, 0.58, 1.0);

      expect(easeFn(0)).toBeCloseTo(0, 5);
      expect(easeFn(0.5)).toBeCloseTo(0.5, 2);
      expect(easeFn(1)).toBeCloseTo(1, 5);
    });
  });

  describe("overshoot curves", () => {
    it("can exceed 1 with y2 > 1", () => {
      const overshoot = cubicBezier(0.34, 1.56, 0.64, 1);
      const maxValue = Math.max(
        ...Array.from({ length: 100 }, (_, i) => overshoot(i / 100))
      );
      expect(maxValue).toBeGreaterThan(1);
    });

    it("can go below 0 with y1 < 0", () => {
      const undershoot = cubicBezier(0.68, -0.55, 0.265, 1.55);
      const minValue = Math.min(
        ...Array.from({ length: 100 }, (_, i) => undershoot(i / 100))
      );
      expect(minValue).toBeLessThan(0);
    });
  });

  describe("monotonicity for standard curves", () => {
    it("ease-in is monotonically increasing", () => {
      const easeFn = cubicBezier(0.42, 0, 1.0, 1.0);
      let prev = easeFn(0);

      for (let t = 0.01; t <= 1; t += 0.01) {
        const curr = easeFn(t);
        expect(curr).toBeGreaterThanOrEqual(prev - 0.0001); // Small tolerance for float precision
        prev = curr;
      }
    });

    it("ease-out is monotonically increasing", () => {
      const easeFn = cubicBezier(0, 0, 0.58, 1.0);
      let prev = easeFn(0);

      for (let t = 0.01; t <= 1; t += 0.01) {
        const curr = easeFn(t);
        expect(curr).toBeGreaterThanOrEqual(prev - 0.0001);
        prev = curr;
      }
    });
  });
});

describe("presets", () => {
  describe("linear", () => {
    it("returns input unchanged", () => {
      expect(linear(0)).toBe(0);
      expect(linear(0.5)).toBe(0.5);
      expect(linear(1)).toBe(1);
    });
  });

  describe("ease", () => {
    it("has correct boundary values", () => {
      expect(ease(0)).toBe(0);
      expect(ease(1)).toBe(1);
    });

    it("is faster than linear in the middle", () => {
      expect(ease(0.5)).toBeGreaterThan(0.5);
    });
  });

  describe("easeIn", () => {
    it("is slower than linear at start", () => {
      expect(easeIn(0.25)).toBeLessThan(0.25);
      expect(easeIn(0.5)).toBeLessThan(0.5);
    });
  });

  describe("easeOut", () => {
    it("is faster than linear at start", () => {
      expect(easeOut(0.25)).toBeGreaterThan(0.25);
      expect(easeOut(0.5)).toBeGreaterThan(0.5);
    });
  });

  describe("easeInOut", () => {
    it("crosses 0.5 at midpoint", () => {
      expect(easeInOut(0.5)).toBeCloseTo(0.5, 2);
    });

    it("is symmetric around midpoint", () => {
      expect(easeInOut(0.25)).toBeCloseTo(1 - easeInOut(0.75), 2);
    });
  });

  describe("easeOutQuint", () => {
    it("decelerates dramatically", () => {
      expect(easeOutQuint(0.25)).toBeGreaterThan(0.6);
    });
  });

  describe("easeInOutQuint", () => {
    it("has dramatic acceleration and deceleration", () => {
      expect(easeInOutQuint(0.25)).toBeLessThan(0.1);
      expect(easeInOutQuint(0.75)).toBeGreaterThan(0.9);
    });
  });

  describe("easeInOutBack", () => {
    it("overshoots at both ends", () => {
      // Should go negative at start
      const values = Array.from({ length: 30 }, (_, i) =>
        easeInOutBack(i / 100)
      );
      expect(Math.min(...values)).toBeLessThan(0);

      // Should exceed 1 near end
      const endValues = Array.from({ length: 30 }, (_, i) =>
        easeInOutBack(0.7 + i / 100)
      );
      expect(Math.max(...endValues)).toBeGreaterThan(1);
    });
  });

  describe("easeOutBack", () => {
    it("overshoots then settles", () => {
      const values = Array.from({ length: 100 }, (_, i) =>
        easeOutBack(i / 100)
      );
      expect(Math.max(...values)).toBeGreaterThan(1);
      expect(easeOutBack(1)).toBeCloseTo(1, 5);
    });
  });
});

describe("spring", () => {
  describe("validation", () => {
    it("throws for non-positive tension", () => {
      expect(() => spring(0, 10)).toThrow("Spring tension must be positive");
      expect(() => spring(-100, 10)).toThrow("Spring tension must be positive");
    });

    it("throws for negative friction", () => {
      expect(() => spring(100, -10)).toThrow(
        "Spring friction must be non-negative"
      );
    });

    it("allows zero friction", () => {
      expect(() => spring(100, 0)).not.toThrow();
    });
  });

  describe("boundary values", () => {
    it("returns 0 for t=0", () => {
      expect(spring(180, 12)(0)).toBe(0);
    });

    it("returns 1 for t=1", () => {
      expect(spring(180, 12)(1)).toBe(1);
    });

    it("returns 0 for t<0", () => {
      expect(spring(180, 12)(-0.5)).toBe(0);
    });

    it("returns 1 for t>1", () => {
      expect(spring(180, 12)(1.5)).toBe(1);
    });
  });

  describe("under-damped (bouncy)", () => {
    it("overshoots with low friction", () => {
      const bouncy = spring(200, 10);
      const values = Array.from({ length: 100 }, (_, i) => bouncy(i / 100));
      expect(Math.max(...values)).toBeGreaterThan(1);
    });
  });

  describe("critically damped", () => {
    it("approaches 1 without oscillation", () => {
      // Critically damped: friction = 2 * sqrt(tension)
      const criticalFriction = 2 * Math.sqrt(100);
      const critical = spring(100, criticalFriction);

      // Should approach 1 monotonically
      let prev = 0;
      for (let t = 0.1; t <= 1; t += 0.1) {
        const curr = critical(t);
        expect(curr).toBeGreaterThan(prev);
        expect(curr).toBeLessThanOrEqual(1.001); // Small tolerance
        prev = curr;
      }
    });
  });

  describe("over-damped (sluggish)", () => {
    it("approaches 1 slowly without oscillation", () => {
      const overdamped = spring(100, 50);

      // Should be monotonically increasing but slow
      let prev = 0;
      for (let t = 0.1; t <= 1; t += 0.1) {
        const curr = overdamped(t);
        expect(curr).toBeGreaterThan(prev);
        expect(curr).toBeLessThanOrEqual(1);
        prev = curr;
      }
    });
  });
});

describe("lerp", () => {
  it("returns a at t=0", () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it("returns b at t=1", () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it("returns midpoint at t=0.5", () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });

  it("handles negative values", () => {
    expect(lerp(-10, 10, 0.5)).toBe(0);
  });

  it("extrapolates for t<0", () => {
    expect(lerp(0, 100, -0.5)).toBe(-50);
  });

  it("extrapolates for t>1", () => {
    expect(lerp(0, 100, 1.5)).toBe(150);
  });
});

describe("inverseLerp", () => {
  it("returns 0 when value equals a", () => {
    expect(inverseLerp(10, 20, 10)).toBe(0);
  });

  it("returns 1 when value equals b", () => {
    expect(inverseLerp(10, 20, 20)).toBe(1);
  });

  it("returns 0.5 for midpoint", () => {
    expect(inverseLerp(0, 100, 50)).toBe(0.5);
  });

  it("handles a === b (returns 0)", () => {
    expect(inverseLerp(5, 5, 5)).toBe(0);
  });

  it("handles value outside range", () => {
    expect(inverseLerp(0, 100, 150)).toBe(1.5);
    expect(inverseLerp(0, 100, -50)).toBe(-0.5);
  });
});

describe("remap", () => {
  it("remaps to new range", () => {
    expect(remap(50, 0, 100, 0, 1)).toBe(0.5);
    expect(remap(0.5, 0, 1, 100, 200)).toBe(150);
    expect(remap(5, 0, 10, 0, 360)).toBe(180);
  });

  it("handles inverted output range", () => {
    expect(remap(0, 0, 100, 100, 0)).toBe(100);
    expect(remap(100, 0, 100, 100, 0)).toBe(0);
  });

  it("handles inverted input range", () => {
    expect(remap(75, 100, 0, 0, 100)).toBe(25);
  });
});

describe("clamp", () => {
  it("returns value when in range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("returns min when value is below", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("returns max when value is above", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("handles edge cases", () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe("clamp01", () => {
  it("clamps to [0, 1]", () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(0)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(1)).toBe(1);
    expect(clamp01(1.5)).toBe(1);
  });
});

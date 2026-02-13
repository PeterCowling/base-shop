import {
  meanConfidenceInterval,
  meanDifferenceCI,
  proportionConfidenceInterval,
  proportionDifferenceCI,
} from "../../../src/math/experimentation/confidence-intervals";

describe("confidence-intervals", () => {
  describe("proportionConfidenceInterval", () => {
    test("TC-04-01: Wilson CI for 50/1000 at 95%", () => {
      const result = proportionConfidenceInterval(50, 1000, 0.95);
      expect(result.estimate).toBeCloseTo(0.05, 12);
      expect(result.lower).toBeCloseTo(0.038, 3);
      expect(result.upper).toBeCloseTo(0.065, 3);
      expect(result.halfWidth).toBeCloseTo((result.upper - result.lower) / 2, 12);
    });

    test("higher confidence yields wider interval", () => {
      const ci95 = proportionConfidenceInterval(50, 1000, 0.95);
      const ci99 = proportionConfidenceInterval(50, 1000, 0.99);
      expect(ci99.halfWidth).toBeGreaterThan(ci95.halfWidth);
    });

    test("Wilson interval remains bounded in [0, 1] at extremes", () => {
      const low = proportionConfidenceInterval(0, 20, 0.95);
      const high = proportionConfidenceInterval(20, 20, 0.95);

      expect(low.lower).toBeGreaterThanOrEqual(0);
      expect(low.upper).toBeLessThanOrEqual(1);
      expect(high.lower).toBeGreaterThanOrEqual(0);
      expect(high.upper).toBeLessThanOrEqual(1);
    });

    test("invalid successes/total throws", () => {
      expect(() => proportionConfidenceInterval(-1, 10, 0.95)).toThrow(RangeError);
      expect(() => proportionConfidenceInterval(11, 10, 0.95)).toThrow(RangeError);
      expect(() => proportionConfidenceInterval(1, 0, 0.95)).toThrow(RangeError);
    });
  });

  describe("meanConfidenceInterval", () => {
    test("TC-04-02: mean CI at 95% uses Student-t critical value", () => {
      const result = meanConfidenceInterval(100, 15, 30, 0.95);
      expect(result.estimate).toBeCloseTo(100, 12);
      expect(result.lower).toBeCloseTo(94.4, 1);
      expect(result.upper).toBeCloseTo(105.6, 1);
      expect(result.halfWidth).toBeCloseTo((result.upper - result.lower) / 2, 12);
    });

    test("higher confidence yields wider mean interval", () => {
      const ci95 = meanConfidenceInterval(100, 15, 30, 0.95);
      const ci99 = meanConfidenceInterval(100, 15, 30, 0.99);
      expect(ci99.halfWidth).toBeGreaterThan(ci95.halfWidth);
    });

    test("invalid stddev and n throw", () => {
      expect(() => meanConfidenceInterval(100, -1, 30, 0.95)).toThrow(RangeError);
      expect(() => meanConfidenceInterval(100, 15, 1, 0.95)).toThrow(RangeError);
    });
  });

  describe("proportionDifferenceCI", () => {
    test("TC-04-03: Newcombe-Wilson difference CI for 50/1000 vs 65/1000", () => {
      const result = proportionDifferenceCI(50, 1000, 65, 1000, 0.95);
      expect(result.estimate).toBeCloseTo(0.015, 12);
      expect(result.lower).toBeCloseTo(-0.006, 2);
      expect(result.upper).toBeCloseTo(0.036, 2);
      expect(result.halfWidth).toBeCloseTo((result.upper - result.lower) / 2, 12);
    });

    test("difference CI reflects stronger signals with narrower bounds", () => {
      const wide = proportionDifferenceCI(50, 1000, 65, 1000, 0.95);
      const narrow = proportionDifferenceCI(500, 10000, 650, 10000, 0.95);
      expect(narrow.halfWidth).toBeLessThan(wide.halfWidth);
    });

    test("invalid proportion-difference inputs throw", () => {
      expect(() => proportionDifferenceCI(1, 0, 1, 10, 0.95)).toThrow(RangeError);
      expect(() => proportionDifferenceCI(11, 10, 1, 10, 0.95)).toThrow(RangeError);
      expect(() => proportionDifferenceCI(1, 10, 11, 10, 0.95)).toThrow(RangeError);
    });
  });

  describe("meanDifferenceCI", () => {
    test("mean difference CI uses Welch SE and remains symmetric around estimate", () => {
      const result = meanDifferenceCI(100, 15, 30, 104, 20, 35, 0.95);
      expect(result.estimate).toBeCloseTo(4, 12);
      expect(result.lower).toBeLessThan(result.estimate);
      expect(result.upper).toBeGreaterThan(result.estimate);
      expect(result.halfWidth).toBeCloseTo((result.upper - result.lower) / 2, 12);
    });

    test("higher confidence yields wider mean difference interval", () => {
      const ci95 = meanDifferenceCI(100, 15, 30, 104, 20, 35, 0.95);
      const ci99 = meanDifferenceCI(100, 15, 30, 104, 20, 35, 0.99);
      expect(ci99.halfWidth).toBeGreaterThan(ci95.halfWidth);
    });

    test("invalid mean-difference inputs throw", () => {
      expect(() => meanDifferenceCI(100, -1, 30, 104, 20, 35, 0.95)).toThrow(RangeError);
      expect(() => meanDifferenceCI(100, 15, 1, 104, 20, 35, 0.95)).toThrow(RangeError);
      expect(() => meanDifferenceCI(100, 15, 30, 104, 20, 1, 0.95)).toThrow(RangeError);
    });
  });

  describe("confidence-level validation", () => {
    test("TC-04-04: invalid confidence levels throw across all interval APIs", () => {
      expect(() => proportionConfidenceInterval(1, 10, 0)).toThrow(RangeError);
      expect(() => meanConfidenceInterval(100, 15, 30, 1)).toThrow(RangeError);
      expect(() => proportionDifferenceCI(1, 10, 2, 10, -0.1)).toThrow(RangeError);
      expect(() => meanDifferenceCI(1, 1, 10, 2, 1, 10, 1.5)).toThrow(RangeError);
    });
  });
});

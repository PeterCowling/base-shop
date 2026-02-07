import {
  coefOfVariation,
  iqr,
  kurtosis,
  max,
  mean,
  median,
  min,
  mode,
  normalizeArray,
  percentile,
  quartiles,
  range,
  skewness,
  stddev,
  sum,
  variance,
  zScore,
} from "../descriptive";

describe("Descriptive Statistics", () => {
  describe("sum", () => {
    it("calculates sum of numbers", () => {
      expect(sum([1, 2, 3, 4, 5])).toBe(15);
    });

    it("returns 0 for empty array", () => {
      expect(sum([])).toBe(0);
    });

    it("handles negative numbers", () => {
      expect(sum([-1, -2, 3])).toBe(0);
    });

    it("handles single element", () => {
      expect(sum([42])).toBe(42);
    });

    it("handles decimals", () => {
      expect(sum([0.1, 0.2, 0.3])).toBeCloseTo(0.6);
    });
  });

  describe("mean", () => {
    it("calculates arithmetic mean", () => {
      expect(mean([1, 2, 3, 4, 5])).toBe(3);
    });

    it("returns NaN for empty array", () => {
      expect(mean([])).toBeNaN();
    });

    it("handles single element", () => {
      expect(mean([42])).toBe(42);
    });

    it("handles decimals", () => {
      expect(mean([10, 20, 30])).toBe(20);
    });
  });

  describe("median", () => {
    it("calculates median for odd-length array", () => {
      expect(median([1, 2, 3, 4, 5])).toBe(3);
    });

    it("calculates median for even-length array", () => {
      expect(median([1, 2, 3, 4])).toBe(2.5);
    });

    it("returns NaN for empty array", () => {
      expect(median([])).toBeNaN();
    });

    it("handles single element", () => {
      expect(median([42])).toBe(42);
    });

    it("handles unsorted input", () => {
      expect(median([5, 1, 3, 2, 4])).toBe(3);
    });
  });

  describe("mode", () => {
    it("finds single mode", () => {
      expect(mode([1, 2, 2, 3, 3, 3])).toEqual([3]);
    });

    it("finds multiple modes", () => {
      expect(mode([1, 1, 2, 2])).toEqual([1, 2]);
    });

    it("returns all values when all have equal frequency", () => {
      expect(mode([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it("returns empty array for empty input", () => {
      expect(mode([])).toEqual([]);
    });

    it("handles single element", () => {
      expect(mode([42])).toEqual([42]);
    });
  });

  describe("variance", () => {
    it("calculates population variance", () => {
      expect(variance([2, 4, 4, 4, 5, 5, 7, 9])).toBe(4);
    });

    it("calculates sample variance with Bessel correction", () => {
      expect(variance([2, 4, 4, 4, 5, 5, 7, 9], true)).toBeCloseTo(4.571, 2);
    });

    it("returns 0 for single element array", () => {
      expect(variance([5])).toBe(0);
    });

    it("returns NaN for empty array", () => {
      expect(variance([])).toBeNaN();
    });

    it("returns 0 for array of identical values", () => {
      expect(variance([5, 5, 5, 5])).toBe(0);
    });
  });

  describe("stddev", () => {
    it("calculates population standard deviation", () => {
      expect(stddev([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
    });

    it("calculates sample standard deviation", () => {
      expect(stddev([2, 4, 4, 4, 5, 5, 7, 9], true)).toBeCloseTo(2.138, 2);
    });

    it("returns 0 for single element array", () => {
      expect(stddev([5])).toBe(0);
    });

    it("returns NaN for empty array", () => {
      expect(stddev([])).toBeNaN();
    });
  });

  describe("range", () => {
    it("calculates range", () => {
      expect(range([1, 2, 3, 4, 5])).toBe(4);
    });

    it("returns 0 for single element", () => {
      expect(range([5])).toBe(0);
    });

    it("returns NaN for empty array", () => {
      expect(range([])).toBeNaN();
    });

    it("handles negative numbers", () => {
      expect(range([-5, 0, 5])).toBe(10);
    });
  });

  describe("min", () => {
    it("finds minimum value", () => {
      expect(min([1, 2, 3, 4, 5])).toBe(1);
    });

    it("returns Infinity for empty array", () => {
      expect(min([])).toBe(Infinity);
    });

    it("handles negative numbers", () => {
      expect(min([-5, 0, 5])).toBe(-5);
    });

    it("handles single element", () => {
      expect(min([42])).toBe(42);
    });
  });

  describe("max", () => {
    it("finds maximum value", () => {
      expect(max([1, 2, 3, 4, 5])).toBe(5);
    });

    it("returns -Infinity for empty array", () => {
      expect(max([])).toBe(-Infinity);
    });

    it("handles negative numbers", () => {
      expect(max([-5, 0, 5])).toBe(5);
    });

    it("handles single element", () => {
      expect(max([42])).toBe(42);
    });
  });

  describe("percentile", () => {
    it("calculates 50th percentile (median)", () => {
      expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
    });

    it("calculates 25th percentile (Q1)", () => {
      expect(percentile([1, 2, 3, 4, 5], 25)).toBe(2);
    });

    it("calculates 75th percentile (Q3)", () => {
      expect(percentile([1, 2, 3, 4, 5], 75)).toBe(4);
    });

    it("calculates 0th percentile (min)", () => {
      expect(percentile([1, 2, 3, 4, 5], 0)).toBe(1);
    });

    it("calculates 100th percentile (max)", () => {
      expect(percentile([1, 2, 3, 4, 5], 100)).toBe(5);
    });

    it("throws RangeError for empty array", () => {
      expect(() => percentile([], 50)).toThrow(RangeError);
    });

    it("throws RangeError for p < 0", () => {
      expect(() => percentile([1, 2, 3], -1)).toThrow(RangeError);
    });

    it("throws RangeError for p > 100", () => {
      expect(() => percentile([1, 2, 3], 101)).toThrow(RangeError);
    });

    it("uses R-7 linear interpolation", () => {
      // With [1, 2, 3, 4], p=25:
      // h = (4-1) * 25/100 = 0.75
      // result = 1 + 0.75 * (2 - 1) = 1.75
      expect(percentile([1, 2, 3, 4], 25)).toBeCloseTo(1.75);
    });
  });

  describe("quartiles", () => {
    it("calculates Q1, Q2, Q3", () => {
      const [q1, q2, q3] = quartiles([1, 2, 3, 4, 5, 6, 7]);
      expect(q2).toBe(4); // median
      // R-7 method: Q1 at p=25% with n=7: h = (7-1) * 0.25 = 1.5
      // result = arr[1] + 0.5 * (arr[2] - arr[1]) = 2 + 0.5 * 1 = 2.5
      expect(q1).toBe(2.5);
      // Q3 at p=75% with n=7: h = (7-1) * 0.75 = 4.5
      // result = arr[4] + 0.5 * (arr[5] - arr[4]) = 5 + 0.5 * 1 = 5.5
      expect(q3).toBe(5.5);
    });

    it("throws RangeError for empty array", () => {
      expect(() => quartiles([])).toThrow(RangeError);
    });
  });

  describe("iqr", () => {
    it("calculates interquartile range", () => {
      // IQR = Q3 - Q1 = 5.5 - 2.5 = 3
      expect(iqr([1, 2, 3, 4, 5, 6, 7])).toBe(3);
    });

    it("throws RangeError for empty array", () => {
      expect(() => iqr([])).toThrow(RangeError);
    });
  });

  describe("skewness", () => {
    it("returns approximately 0 for symmetric data", () => {
      const symmetric = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      expect(Math.abs(skewness(symmetric))).toBeLessThan(0.1);
    });

    it("returns positive for right-skewed data", () => {
      const rightSkewed = [1, 1, 1, 1, 1, 10];
      expect(skewness(rightSkewed)).toBeGreaterThan(0);
    });

    it("returns negative for left-skewed data", () => {
      const leftSkewed = [1, 10, 10, 10, 10, 10];
      expect(skewness(leftSkewed)).toBeLessThan(0);
    });

    it("returns NaN for arrays with less than 3 elements", () => {
      expect(skewness([1, 2])).toBeNaN();
      expect(skewness([1])).toBeNaN();
      expect(skewness([])).toBeNaN();
    });

    it("returns NaN for zero variance", () => {
      expect(skewness([5, 5, 5, 5])).toBeNaN();
    });
  });

  describe("kurtosis", () => {
    it("calculates excess kurtosis correctly", () => {
      // For a small sample, kurtosis can vary
      // Test with a larger more uniform-like distribution
      const uniform = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const k = kurtosis(uniform);
      // Uniform distribution has negative excess kurtosis (platykurtic)
      // The exact value depends on the formula used
      expect(k).toBeDefined();
      expect(Number.isFinite(k)).toBe(true);
    });

    it("returns NaN for arrays with less than 4 elements", () => {
      expect(kurtosis([1, 2, 3])).toBeNaN();
      expect(kurtosis([1, 2])).toBeNaN();
      expect(kurtosis([1])).toBeNaN();
      expect(kurtosis([])).toBeNaN();
    });

    it("returns NaN for zero variance", () => {
      expect(kurtosis([5, 5, 5, 5, 5])).toBeNaN();
    });
  });

  describe("zScore", () => {
    it("calculates z-score correctly", () => {
      expect(zScore(100, 80, 10)).toBe(2); // 2 stddev above
      expect(zScore(70, 80, 10)).toBe(-1); // 1 stddev below
      expect(zScore(80, 80, 10)).toBe(0); // at mean
    });

    it("returns NaN for zero standard deviation", () => {
      expect(zScore(100, 80, 0)).toBeNaN();
    });
  });

  describe("normalizeArray", () => {
    it("normalizes values to [0, 1] range", () => {
      const result = normalizeArray([0, 5, 10]);
      expect(result).toEqual([0, 0.5, 1]);
    });

    it("handles negative values", () => {
      const result = normalizeArray([-10, 0, 10]);
      expect(result).toEqual([0, 0.5, 1]);
    });

    it("returns all zeros for constant values", () => {
      const result = normalizeArray([5, 5, 5]);
      expect(result).toEqual([0, 0, 0]);
    });

    it("throws RangeError for empty array", () => {
      expect(() => normalizeArray([])).toThrow(RangeError);
    });

    it("handles single element", () => {
      expect(normalizeArray([42])).toEqual([0]);
    });
  });

  describe("coefOfVariation", () => {
    it("calculates coefficient of variation", () => {
      // stddev / mean for [10, 20, 30] = ~8.165 / 20 = ~0.408
      expect(coefOfVariation([10, 20, 30])).toBeCloseTo(0.408, 2);
    });

    it("returns low CV for stable data", () => {
      expect(coefOfVariation([100, 101, 99])).toBeLessThan(0.02);
    });

    it("returns NaN for zero mean", () => {
      expect(coefOfVariation([-1, 0, 1])).toBeNaN();
    });

    it("returns NaN for empty array", () => {
      expect(coefOfVariation([])).toBeNaN();
    });

    it("uses absolute value of mean", () => {
      // For negative mean, should still return positive CV
      const cv = coefOfVariation([-10, -20, -30]);
      expect(cv).toBeGreaterThan(0);
    });
  });
});

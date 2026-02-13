import {
  chiSquareGoodnessOfFit,
  welchTTest,
  zTestProportions,
} from "../../../src/math/experimentation/hypothesis-tests";

describe("hypothesis-tests", () => {
  describe("zTestProportions", () => {
    test("TC-03-01: two-sided z-test reference parity", () => {
      const result = zTestProportions({
        controlSuccesses: 50,
        controlTotal: 1000,
        treatmentSuccesses: 65,
        treatmentTotal: 1000,
        alternative: "two-sided",
      });

      expect(result.zScore).toBeCloseTo(1.441, 3);
      expect(result.pValue).toBeCloseTo(0.1496, 3);
      expect(result.alternative).toBe("two-sided");
      expect(result.isSignificant).toBeUndefined();
      expect(result.warnings).toEqual([]);
    });

    test("TC-03-01: one-sided greater z-test reference parity", () => {
      const result = zTestProportions({
        controlSuccesses: 50,
        controlTotal: 1000,
        treatmentSuccesses: 65,
        treatmentTotal: 1000,
        alternative: "greater",
      });

      expect(result.pValue).toBeCloseTo(0.0748, 3);
    });

    test("one-sided less returns complementary tail probability", () => {
      const result = zTestProportions({
        controlSuccesses: 50,
        controlTotal: 1000,
        treatmentSuccesses: 65,
        treatmentTotal: 1000,
        alternative: "less",
      });

      expect(result.pValue).toBeCloseTo(0.9252, 3);
    });

    test("isSignificant only appears when alpha is provided", () => {
      const withoutAlpha = zTestProportions({
        controlSuccesses: 50,
        controlTotal: 1000,
        treatmentSuccesses: 65,
        treatmentTotal: 1000,
      });
      expect(withoutAlpha.isSignificant).toBeUndefined();

      const withAlpha = zTestProportions({
        controlSuccesses: 50,
        controlTotal: 1000,
        treatmentSuccesses: 65,
        treatmentTotal: 1000,
        alpha: 0.1,
      });
      expect(withAlpha.isSignificant).toBe(false);
    });

    test("degenerate pooled variance returns warning and non-significant p-value", () => {
      const result = zTestProportions({
        controlSuccesses: 0,
        controlTotal: 20,
        treatmentSuccesses: 0,
        treatmentTotal: 20,
        alpha: 0.05,
      });

      expect(result.pValue).toBe(1);
      expect(result.isSignificant).toBe(false);
      expect(result.warnings[0]).toMatch(/Pooled variance is zero/i);
    });

    test("invalid totals and success counts throw RangeError", () => {
      expect(() =>
        zTestProportions({
          controlSuccesses: -1,
          controlTotal: 100,
          treatmentSuccesses: 1,
          treatmentTotal: 100,
        })
      ).toThrow(RangeError);

      expect(() =>
        zTestProportions({
          controlSuccesses: 101,
          controlTotal: 100,
          treatmentSuccesses: 1,
          treatmentTotal: 100,
        })
      ).toThrow(RangeError);

      expect(() =>
        zTestProportions({
          controlSuccesses: 1,
          controlTotal: 100,
          treatmentSuccesses: 101,
          treatmentTotal: 100,
        })
      ).toThrow(RangeError);
    });

    test("invalid alternative or alpha throws RangeError", () => {
      expect(() =>
        zTestProportions({
          controlSuccesses: 1,
          controlTotal: 100,
          treatmentSuccesses: 2,
          treatmentTotal: 100,
          alternative: "invalid" as "two-sided",
        })
      ).toThrow(RangeError);

      expect(() =>
        zTestProportions({
          controlSuccesses: 1,
          controlTotal: 100,
          treatmentSuccesses: 2,
          treatmentTotal: 100,
          alpha: 1,
        })
      ).toThrow(RangeError);
    });
  });

  describe("welchTTest", () => {
    test("TC-03-02: Welch t-test reference parity", () => {
      const result = welchTTest({
        mean1: 100,
        stddev1: 15,
        n1: 30,
        mean2: 104,
        stddev2: 20,
        n2: 35,
      });

      expect(result.tStatistic).toBeCloseTo(-0.919, 3);
      expect(result.degreesOfFreedom).toBeCloseTo(61.98, 1);
      expect(result.pValue).toBeCloseTo(0.361, 3);
      expect(result.isSignificant).toBeUndefined();
    });

    test("greater/less alternatives produce directional tails", () => {
      const greater = welchTTest({
        mean1: 100,
        stddev1: 15,
        n1: 30,
        mean2: 104,
        stddev2: 20,
        n2: 35,
        alternative: "greater",
      });
      const less = welchTTest({
        mean1: 100,
        stddev1: 15,
        n1: 30,
        mean2: 104,
        stddev2: 20,
        n2: 35,
        alternative: "less",
      });

      expect(greater.pValue).toBeCloseTo(0.819, 2);
      expect(less.pValue).toBeCloseTo(0.181, 2);
    });

    test("alpha controls isSignificant explicitly", () => {
      const significant = welchTTest({
        mean1: 120,
        stddev1: 10,
        n1: 100,
        mean2: 100,
        stddev2: 10,
        n2: 100,
        alpha: 0.05,
      });
      expect(significant.isSignificant).toBe(true);
    });

    test("invalid stddev, sample sizes, or alpha throw RangeError", () => {
      expect(() =>
        welchTTest({
          mean1: 1,
          stddev1: -1,
          n1: 10,
          mean2: 1,
          stddev2: 1,
          n2: 10,
        })
      ).toThrow(RangeError);

      expect(() =>
        welchTTest({
          mean1: 1,
          stddev1: 1,
          n1: 1,
          mean2: 1,
          stddev2: 1,
          n2: 10,
        })
      ).toThrow(RangeError);

      expect(() =>
        welchTTest({
          mean1: 1,
          stddev1: 1,
          n1: 10,
          mean2: 1,
          stddev2: 1,
          n2: 10,
          alpha: 0,
        })
      ).toThrow(RangeError);
    });

    test("zero variance in both samples throws RangeError", () => {
      expect(() =>
        welchTTest({
          mean1: 1,
          stddev1: 0,
          n1: 10,
          mean2: 1,
          stddev2: 0,
          n2: 10,
        })
      ).toThrow(RangeError);
    });
  });

  describe("chiSquareGoodnessOfFit", () => {
    test("TC-03-03: chi-square GOF reference parity", () => {
      const result = chiSquareGoodnessOfFit([10, 20, 30], [20, 20, 20]);

      expect(result.chiSquare).toBeCloseTo(10, 10);
      expect(result.degreesOfFreedom).toBe(2);
      expect(result.pValue).toBeCloseTo(0.00674, 4);
      expect(result.alternative).toBe("greater");
    });

    test("TC-03-04: expected counts < 5 include warning", () => {
      const result = chiSquareGoodnessOfFit([1, 4, 5], [2, 3, 5]);
      expect(result.warnings.some((warning) => /below 5/i.test(warning))).toBe(true);
    });

    test("sum mismatch includes warning", () => {
      const result = chiSquareGoodnessOfFit([10, 20, 30], [10, 20, 50]);
      expect(result.warnings.some((warning) => /totals differ/i.test(warning))).toBe(true);
    });

    test("two-sided and less alternatives are accepted explicitly", () => {
      const twoSided = chiSquareGoodnessOfFit(
        [10, 20, 30],
        [20, 20, 20],
        { alternative: "two-sided" }
      );
      const less = chiSquareGoodnessOfFit([10, 20, 30], [20, 20, 20], {
        alternative: "less",
      });

      expect(twoSided.pValue).toBeCloseTo(0.0135, 3);
      expect(less.pValue).toBeGreaterThan(0.99);
    });

    test("alpha controls significance flags", () => {
      const significant = chiSquareGoodnessOfFit([10, 20, 30], [20, 20, 20], {
        alpha: 0.05,
      });
      expect(significant.isSignificant).toBe(true);

      const notSignificant = chiSquareGoodnessOfFit([18, 20, 22], [20, 20, 20], {
        alpha: 0.05,
      });
      expect(notSignificant.isSignificant).toBe(false);
    });

    test("invalid shape and values throw RangeError", () => {
      expect(() => chiSquareGoodnessOfFit([1], [1])).toThrow(RangeError);
      expect(() => chiSquareGoodnessOfFit([1, 2], [1])).toThrow(RangeError);
      expect(() => chiSquareGoodnessOfFit([1, -2], [1, 2])).toThrow(RangeError);
      expect(() => chiSquareGoodnessOfFit([1, 2], [0, 2])).toThrow(RangeError);
      expect(() => chiSquareGoodnessOfFit([1, 2], [1, 2], { alpha: 1 })).toThrow(
        RangeError
      );
    });
  });
});

import {
  assertFiniteArray,
  assertSeasonalPeriod,
  finiteResiduals,
  normalizeSeasonalAdditive,
  normalizeSeasonalMultiplicative,
  scoreModel,
  seasonAtHorizon,
  seasonIndex,
  sumSquaredError,
} from "../../../src/math/forecasting/utils";

describe("assertFiniteArray", () => {
  it("passes for valid finite array", () => {
    expect(() => assertFiniteArray([1, 2, 3, 4.5])).not.toThrow();
  });

  it("throws for array containing NaN", () => {
    expect(() => assertFiniteArray([1, 2, NaN, 4])).toThrow(
      "Data contains non-finite values"
    );
  });

  it("throws for array containing Infinity", () => {
    expect(() => assertFiniteArray([1, Infinity, 3])).toThrow(
      "Data contains non-finite values"
    );
  });

  it("throws for array containing -Infinity", () => {
    expect(() => assertFiniteArray([1, -Infinity, 3])).toThrow(
      "Data contains non-finite values"
    );
  });

  it("passes for empty array", () => {
    expect(() => assertFiniteArray([])).not.toThrow();
  });
});

describe("assertSeasonalPeriod", () => {
  // VC-HW-00-01: rejects non-integer, <2, and insufficient-length inputs
  it("passes for valid seasonal period and data length", () => {
    expect(() => assertSeasonalPeriod(4, 8)).not.toThrow();
    expect(() => assertSeasonalPeriod(12, 24)).not.toThrow();
  });

  it("throws for non-integer seasonal period", () => {
    expect(() => assertSeasonalPeriod(3.5, 10)).toThrow(
      "Seasonal period must be an integer"
    );
    expect(() => assertSeasonalPeriod(2.1, 6)).toThrow(
      "Seasonal period must be an integer"
    );
  });

  it("throws for seasonal period < 2", () => {
    expect(() => assertSeasonalPeriod(1, 10)).toThrow(
      "Seasonal period must be at least 2"
    );
    expect(() => assertSeasonalPeriod(0, 10)).toThrow(
      "Seasonal period must be at least 2"
    );
    expect(() => assertSeasonalPeriod(-1, 10)).toThrow(
      "Seasonal period must be at least 2"
    );
  });

  it("throws for insufficient data length (n < 2*m)", () => {
    expect(() => assertSeasonalPeriod(4, 7)).toThrow(
      "Data length (7) must be at least 2 * seasonal period (4)"
    );
    expect(() => assertSeasonalPeriod(12, 20)).toThrow(
      "Data length (20) must be at least 2 * seasonal period (12)"
    );
  });

  it("accepts exact minimum length (n = 2*m)", () => {
    expect(() => assertSeasonalPeriod(4, 8)).not.toThrow();
    expect(() => assertSeasonalPeriod(12, 24)).not.toThrow();
  });
});

describe("normalizeSeasonalAdditive", () => {
  // VC-HW-00-02: additive mean ≈ 0
  it("normalizes to mean approximately 0", () => {
    const input = [5, -3, 2, -1, 4, -7];
    const normalized = normalizeSeasonalAdditive(input);

    const mean = normalized.reduce((a, b) => a + b, 0) / normalized.length;
    expect(mean).toBeCloseTo(0, 10);
  });

  it("preserves shape (differences)", () => {
    const input = [10, 5, 15];
    const normalized = normalizeSeasonalAdditive(input);

    // Differences should be preserved
    expect(normalized[1] - normalized[0]).toBeCloseTo(
      input[1] - input[0],
      10
    );
    expect(normalized[2] - normalized[1]).toBeCloseTo(
      input[2] - input[1],
      10
    );
  });

  it("handles single element", () => {
    const normalized = normalizeSeasonalAdditive([42]);
    expect(normalized).toEqual([0]);
  });

  it("handles empty array", () => {
    const normalized = normalizeSeasonalAdditive([]);
    expect(normalized).toEqual([]);
  });
});

describe("normalizeSeasonalMultiplicative", () => {
  // VC-HW-00-02: multiplicative mean ≈ 1
  it("normalizes to mean approximately 1", () => {
    const input = [0.8, 1.2, 0.9, 1.1, 1.05, 0.95];
    const normalized = normalizeSeasonalMultiplicative(input);

    const mean = normalized.reduce((a, b) => a + b, 0) / normalized.length;
    expect(mean).toBeCloseTo(1, 10);
  });

  it("preserves relative shape (ratios)", () => {
    const input = [2, 4, 1];
    const normalized = normalizeSeasonalMultiplicative(input);

    // Ratios should be preserved
    expect(normalized[1] / normalized[0]).toBeCloseTo(input[1] / input[0], 10);
    expect(normalized[2] / normalized[1]).toBeCloseTo(input[2] / input[1], 10);
  });

  it("handles single element", () => {
    const normalized = normalizeSeasonalMultiplicative([42]);
    expect(normalized).toEqual([1]);
  });

  it("handles empty array", () => {
    const normalized = normalizeSeasonalMultiplicative([]);
    expect(normalized).toEqual([]);
  });
});

describe("seasonIndex", () => {
  // VC-HW-00-03: periodicity for h = 1..3m
  it("wraps correctly for seasonal period 4", () => {
    const m = 4;
    expect(seasonIndex(0, m)).toBe(0);
    expect(seasonIndex(1, m)).toBe(1);
    expect(seasonIndex(2, m)).toBe(2);
    expect(seasonIndex(3, m)).toBe(3);
    expect(seasonIndex(4, m)).toBe(0); // Wrap
    expect(seasonIndex(5, m)).toBe(1);
    expect(seasonIndex(7, m)).toBe(3);
    expect(seasonIndex(8, m)).toBe(0); // Wrap again
  });

  it("wraps correctly for seasonal period 12", () => {
    const m = 12;
    expect(seasonIndex(0, m)).toBe(0);
    expect(seasonIndex(11, m)).toBe(11);
    expect(seasonIndex(12, m)).toBe(0); // Wrap
    expect(seasonIndex(23, m)).toBe(11);
    expect(seasonIndex(24, m)).toBe(0); // Wrap again
  });

  it("confirms periodicity for h = 1..3m", () => {
    const m = 7;
    for (let h = 1; h <= 3 * m; h++) {
      expect(seasonIndex(h, m)).toBe(h % m);
    }
  });
});

describe("seasonAtHorizon", () => {
  // VC-HW-00-03: forecast season lookup
  it("calculates season at forecast horizon", () => {
    const m = 4;
    const lastIndex = 15; // Season 15 % 4 = 3

    expect(seasonAtHorizon(lastIndex, 1, m)).toBe(0); // Next is 16 % 4 = 0
    expect(seasonAtHorizon(lastIndex, 2, m)).toBe(1); // 17 % 4 = 1
    expect(seasonAtHorizon(lastIndex, 3, m)).toBe(2); // 18 % 4 = 2
    expect(seasonAtHorizon(lastIndex, 4, m)).toBe(3); // 19 % 4 = 3
    expect(seasonAtHorizon(lastIndex, 5, m)).toBe(0); // 20 % 4 = 0
  });

  it("confirms periodicity for horizons 1..3m", () => {
    const m = 6;
    const lastIndex = 23;

    for (let h = 1; h <= 3 * m; h++) {
      const expectedSeason = (lastIndex + h) % m;
      expect(seasonAtHorizon(lastIndex, h, m)).toBe(expectedSeason);
    }
  });
});

describe("finiteResiduals", () => {
  it("filters out non-finite values", () => {
    const input = [1, 2, NaN, 4, Infinity, 6, -Infinity, 8];
    const result = finiteResiduals(input);

    expect(result).toEqual([1, 2, 4, 6, 8]);
  });

  it("returns empty array when all values are non-finite", () => {
    const input = [NaN, Infinity, -Infinity];
    const result = finiteResiduals(input);

    expect(result).toEqual([]);
  });

  it("returns all values when all are finite", () => {
    const input = [1, 2, 3, 4, 5];
    const result = finiteResiduals(input);

    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it("handles empty array", () => {
    const result = finiteResiduals([]);
    expect(result).toEqual([]);
  });
});

describe("sumSquaredError", () => {
  it("calculates SSE for finite values", () => {
    const values = [1, 2, 3];
    // SSE = 1^2 + 2^2 + 3^2 = 1 + 4 + 9 = 14
    expect(sumSquaredError(values)).toBe(14);
  });

  it("ignores non-finite values", () => {
    const values = [1, NaN, 2, Infinity, 3, -Infinity];
    // Only 1, 2, 3 are finite: SSE = 1 + 4 + 9 = 14
    expect(sumSquaredError(values)).toBe(14);
  });

  it("returns 0 for empty array", () => {
    expect(sumSquaredError([])).toBe(0);
  });

  it("returns 0 when all values are non-finite", () => {
    expect(sumSquaredError([NaN, Infinity, -Infinity])).toBe(0);
  });

  it("handles negative residuals", () => {
    const values = [-2, -3];
    // SSE = (-2)^2 + (-3)^2 = 4 + 9 = 13
    expect(sumSquaredError(values)).toBe(13);
  });
});

describe("scoreModel", () => {
  // VC-HW-00-04: comparison window helper aligns residual series
  it("calculates model scores correctly", () => {
    // Residuals: [NaN, 1, 2, 3, 4, 5]
    // Start index: 1, numParams: 2
    // Finite residuals from index 1: [1, 2, 3, 4, 5]
    const residuals = [NaN, 1, 2, 3, 4, 5];
    const result = scoreModel(residuals, 1, 2);

    expect(result.n).toBe(6); // Total length
    expect(result.nEffective).toBe(5); // Finite count from startIndex
    expect(result.sse).toBe(1 + 4 + 9 + 16 + 25); // 55

    const sigma2MLE = 55 / 5; // 11
    expect(result.sigma2MLE).toBeCloseTo(sigma2MLE, 10);

    // logLik = -nEffective/2 * (log(2*PI) + log(sigma2MLE) + 1)
    const expectedLogLik =
      (-5 / 2) * (Math.log(2 * Math.PI) + Math.log(sigma2MLE) + 1);
    expect(result.logLik).toBeCloseTo(expectedLogLik, 10);

    // AIC = -2*logLik + 2*numParams
    const expectedAIC = -2 * expectedLogLik + 2 * 2;
    expect(result.aic).toBeCloseTo(expectedAIC, 10);

    // BIC = -2*logLik + numParams*log(nEffective)
    const expectedBIC = -2 * expectedLogLik + 2 * Math.log(5);
    expect(result.bic).toBeCloseTo(expectedBIC, 10);
  });

  it("uses only finite residuals from startIndex", () => {
    // Residuals: [1, 2, NaN, 4, Infinity, 6, 7]
    // Start index: 2
    // From index 2: [NaN, 4, Infinity, 6, 7] -> finite: [4, 6, 7]
    const residuals = [1, 2, NaN, 4, Infinity, 6, 7];
    const result = scoreModel(residuals, 2, 1);

    expect(result.n).toBe(7);
    expect(result.nEffective).toBe(3); // [4, 6, 7]
    expect(result.sse).toBe(16 + 36 + 49); // 101
  });

  it("floors sigma2MLE to Number.EPSILON when SSE is 0", () => {
    const residuals = [NaN, 0, 0, 0];
    const result = scoreModel(residuals, 1, 1);

    expect(result.nEffective).toBe(3);
    expect(result.sse).toBe(0);
    expect(result.sigma2MLE).toBe(Number.EPSILON);
    expect(Number.isFinite(result.logLik)).toBe(true);
    expect(Number.isFinite(result.aic)).toBe(true);
    expect(Number.isFinite(result.bic)).toBe(true);
  });

  it("handles case where all residuals from startIndex are non-finite", () => {
    const residuals = [1, 2, NaN, Infinity, -Infinity];
    const result = scoreModel(residuals, 2, 1);

    expect(result.nEffective).toBe(0);
    expect(result.sse).toBe(0);
    expect(result.sigma2MLE).toBe(Number.EPSILON);
    expect(Number.isFinite(result.logLik)).toBe(true);
  });

  it("aligns two residual series with different warm-up starts", () => {
    // Model A: warm-up at index 0, residuals: [NaN, 1, 2, 3, 4]
    // Model B: warm-up at index 1, residuals: [NaN, NaN, 2.5, 3.5, 4.5]
    // Comparison window should start at max(0, 1) = 1
    const residualsA = [NaN, 1, 2, 3, 4];
    const residualsB = [NaN, NaN, 2.5, 3.5, 4.5];

    const startIndex = Math.max(0, 1); // = 1

    const scoreA = scoreModel(residualsA, startIndex, 1);
    const scoreB = scoreModel(residualsB, startIndex, 2);

    // Both should use residuals from index 1 onward
    // A: [1, 2, 3, 4] -> nEffective = 4
    // B: [NaN, 2.5, 3.5, 4.5] -> nEffective = 3
    expect(scoreA.nEffective).toBe(4);
    expect(scoreB.nEffective).toBe(3);
  });

  it("returns correct parameter count in formula", () => {
    const residuals = [NaN, 1, 2, 3];
    const numParams = 3;
    const result = scoreModel(residuals, 1, numParams);

    // nEffective = 3 (residuals [1, 2, 3])
    const expectedAIC = -2 * result.logLik + 2 * numParams;
    const expectedBIC = -2 * result.logLik + numParams * Math.log(3);

    expect(result.aic).toBeCloseTo(expectedAIC, 10);
    expect(result.bic).toBeCloseTo(expectedBIC, 10);
  });
});

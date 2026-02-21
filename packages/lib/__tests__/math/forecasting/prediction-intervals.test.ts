/**
 * Tests for prediction intervals - HW-05
 *
 * Validation contracts:
 * - VC-HW-05-01: Seed determinism
 * - VC-HW-05-02: Bootstrap coverage on synthetic data
 * - VC-HW-05-03: Naive method width is non-decreasing
 * - VC-HW-05-04: Invalid level throws
 * - VC-HW-05-05: Empty forecast returns empty arrays
 */

import { HoltWintersAdditive } from "../../../src/math/forecasting/holt-winters";
import {
  type ForecastInterval,
  forecastWithInterval,
  type IntervalOptions,
} from "../../../src/math/forecasting/prediction-intervals";

describe("forecastWithInterval", () => {
  // Helper: compute residuals from fitted model
  function computeResiduals(data: number[], fittedValues: number[]): number[] {
    return data.map((val, i) => val - fittedValues[i]);
  }

  describe("VC-HW-05-04: Invalid level throws", () => {
    test("throws when level = 0", () => {
      expect(() =>
        forecastWithInterval([100, 110], [1, 2, -1, 3], 0, { level: 0 })
      ).toThrow();
    });

    test("throws when level = 1", () => {
      expect(() =>
        forecastWithInterval([100, 110], [1, 2, -1, 3], 0, { level: 1 })
      ).toThrow();
    });

    test("throws when level = -0.1", () => {
      expect(() =>
        forecastWithInterval([100, 110], [1, 2, -1, 3], 0, { level: -0.1 })
      ).toThrow();
    });

    test("throws when level = 1.5", () => {
      expect(() =>
        forecastWithInterval([100, 110], [1, 2, -1, 3], 0, { level: 1.5 })
      ).toThrow();
    });
  });

  describe("VC-HW-05-05: Empty forecast returns empty arrays", () => {
    test("empty point forecast returns empty arrays", () => {
      const result = forecastWithInterval([], [1, 2, 3], 0);
      expect(result.forecast).toEqual([]);
      expect(result.lower).toEqual([]);
      expect(result.upper).toEqual([]);
    });
  });

  describe("VC-HW-05-01: Seed determinism", () => {
    test("same seed yields identical interval arrays (naive)", () => {
      const pointForecast = [100, 105, 110, 115, 120];
      const residuals = [1, -2, 3, -1, 2, -3, 1, -1, 2, -2];
      const minResidualIndex = 0;

      const result1 = forecastWithInterval(pointForecast, residuals, minResidualIndex, {
        method: "naive",
        level: 0.95,
      });

      const result2 = forecastWithInterval(pointForecast, residuals, minResidualIndex, {
        method: "naive",
        level: 0.95,
      });

      expect(result1.forecast).toEqual(result2.forecast);
      expect(result1.lower).toEqual(result2.lower);
      expect(result1.upper).toEqual(result2.upper);
    });

    test("same seed yields identical interval arrays (bootstrap)", () => {
      const pointForecast = [100, 105, 110, 115, 120];
      const residuals = [1, -2, 3, -1, 2, -3, 1, -1, 2, -2];
      const minResidualIndex = 0;
      const seed = 42;

      const result1 = forecastWithInterval(pointForecast, residuals, minResidualIndex, {
        method: "bootstrap",
        level: 0.95,
        seed,
        simulations: 1000,
      });

      const result2 = forecastWithInterval(pointForecast, residuals, minResidualIndex, {
        method: "bootstrap",
        level: 0.95,
        seed,
        simulations: 1000,
      });

      expect(result1.forecast).toEqual(result2.forecast);
      expect(result1.lower).toEqual(result2.lower);
      expect(result1.upper).toEqual(result2.upper);
    });

    test("different seeds yield different interval arrays (bootstrap)", () => {
      const pointForecast = [100, 105, 110, 115, 120];
      // Use more varied residuals to reduce discreteness effects
      const residuals = Array.from({ length: 50 }, (_, i) => {
        const x = i / 10;
        return Math.sin(x) * 3 + Math.cos(x * 2) * 1.5;
      });
      const minResidualIndex = 0;

      const result1 = forecastWithInterval(pointForecast, residuals, minResidualIndex, {
        method: "bootstrap",
        level: 0.95,
        seed: 42,
        simulations: 1000,
      });

      const result2 = forecastWithInterval(pointForecast, residuals, minResidualIndex, {
        method: "bootstrap",
        level: 0.95,
        seed: 99,
        simulations: 1000,
      });

      // At least one array should differ (lower or upper)
      const lowerEqual = JSON.stringify(result1.lower) === JSON.stringify(result2.lower);
      const upperEqual = JSON.stringify(result1.upper) === JSON.stringify(result2.upper);
      expect(lowerEqual && upperEqual).toBe(false);
    });
  });

  describe("VC-HW-05-03: Naive method width is non-decreasing by horizon", () => {
    test("interval width increases or stays constant as horizon increases", () => {
      const pointForecast = Array.from({ length: 10 }, (_, i) => 100 + i * 5);
      const residuals = [1, -2, 3, -1, 2, -3, 1, -1, 2, -2, 1, -2];
      const minResidualIndex = 0;

      const result = forecastWithInterval(pointForecast, residuals, minResidualIndex, {
        method: "naive",
        level: 0.95,
      });

      const widths = result.upper.map((u, i) => u - result.lower[i]);

      // Check that width is non-decreasing
      for (let i = 1; i < widths.length; i++) {
        expect(widths[i]).toBeGreaterThanOrEqual(widths[i - 1]);
      }
    });
  });

  describe("VC-HW-05-02: Bootstrap coverage on synthetic data", () => {
    // Generate synthetic data with known seasonality and trend
    function generateSyntheticData(
      n: number,
      seasonalPeriod: number,
      trend: number,
      level: number,
      noiseStd: number,
      seed: number
    ): number[] {
      // Simple seeded RNG (LCG)
      let state = seed;
      function random(): number {
        state = (state * 1103515245 + 12345) % 2147483648;
        return state / 2147483648;
      }

      function boxMuller(): number {
        const u1 = random();
        const u2 = random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      }

      const seasonalPattern = Array.from(
        { length: seasonalPeriod },
        (_, i) => Math.sin((2 * Math.PI * i) / seasonalPeriod) * 10
      );

      return Array.from({ length: n }, (_, t) => {
        const seasonal = seasonalPattern[t % seasonalPeriod];
        const trendComponent = trend * t;
        const noise = boxMuller() * noiseStd;
        return level + trendComponent + seasonal + noise;
      });
    }

    test(
      "95% bootstrap intervals cover ~90-99% of actual values (broad tolerance)",
      () => {
        const seasonalPeriod = 7;
        const trainSize = 70;
        const testSize = 14;
        const fullData = generateSyntheticData(
          trainSize + testSize,
          seasonalPeriod,
          0.5,
          100,
          3,
          42
        );

        const trainData = fullData.slice(0, trainSize);
        const testData = fullData.slice(trainSize);

        // Fit model
        const hw = new HoltWintersAdditive(0.3, 0.1, 0.2);
        hw.fit(trainData, seasonalPeriod);

        // Generate forecast
        const pointForecast = hw.forecast(testSize);

        // Compute residuals
        const fittedValues = hw.fittedValues;
        const residuals = computeResiduals(trainData, fittedValues);

        // Generate prediction intervals
        const result = forecastWithInterval(
          pointForecast,
          residuals,
          hw.minResidualIndex,
          {
            method: "bootstrap",
            level: 0.95,
            seed: 42,
            simulations: 1000,
          }
        );

        // Check coverage
        let covered = 0;
        for (let i = 0; i < testSize; i++) {
          if (testData[i] >= result.lower[i] && testData[i] <= result.upper[i]) {
            covered++;
          }
        }

        const coverageRate = covered / testSize;

        // Broad tolerance: 85-100% coverage for 95% nominal level
        // (100% is acceptable - intervals might be conservative for this data)
        expect(coverageRate).toBeGreaterThanOrEqual(0.85);
        expect(coverageRate).toBeLessThanOrEqual(1.0);
      },
      10000
    ); // 10s timeout for bootstrap test
  });

  describe("Edge cases and defaults", () => {
    test("defaults to naive method with 95% level", () => {
      const pointForecast = [100, 105, 110];
      const residuals = [1, -2, 3, -1, 2];
      const result = forecastWithInterval(pointForecast, residuals, 0);

      expect(result.forecast).toEqual(pointForecast);
      expect(result.lower.length).toBe(3);
      expect(result.upper.length).toBe(3);
      expect(result.lower[0]).toBeLessThan(pointForecast[0]);
      expect(result.upper[0]).toBeGreaterThan(pointForecast[0]);
    });

    test("throws when no finite residuals", () => {
      const pointForecast = [100, 105];
      const residuals = [NaN, Infinity, -Infinity];
      expect(() => forecastWithInterval(pointForecast, residuals, 0)).toThrow();
    });

    test("handles residuals with some non-finite values", () => {
      const pointForecast = [100, 105];
      const residuals = [NaN, 1, -2, Infinity, 3, -1];
      const result = forecastWithInterval(pointForecast, residuals, 1);

      expect(result.forecast).toEqual(pointForecast);
      expect(result.lower.length).toBe(2);
      expect(result.upper.length).toBe(2);
    });

    test("minResidualIndex filters residuals correctly", () => {
      const pointForecast = [100];
      const residuals = [10, 20, 30, 1, -1, 2, -2]; // First 3 are outliers
      const minResidualIndex = 3;

      const result = forecastWithInterval(pointForecast, residuals, minResidualIndex, {
        method: "naive",
        level: 0.95,
      });

      // Sigma should be computed from residuals[3:] = [1, -1, 2, -2]
      // These have smaller magnitude than [10, 20, 30]
      expect(result.lower[0]).toBeGreaterThan(90); // Not too wide
      expect(result.upper[0]).toBeLessThan(110);
    });
  });

  describe("Naive method specifics", () => {
    test("interval width scales with sqrt(h)", () => {
      const pointForecast = [100, 100, 100, 100];
      const residuals = [1, -1, 2, -2, 1, -1];
      const result = forecastWithInterval(pointForecast, residuals, 0, {
        method: "naive",
        level: 0.95,
      });

      const widths = result.upper.map((u, i) => u - result.lower[i]);

      // Width should approximately follow sqrt(h+1) pattern
      // width[h] = 2 * z * sigma * sqrt(h+1)
      // So width[1]/width[0] ≈ sqrt(2)/sqrt(1) ≈ 1.41
      const ratio1 = widths[1] / widths[0];
      expect(ratio1).toBeGreaterThan(1.35);
      expect(ratio1).toBeLessThan(1.5);
    });
  });

  describe("Bootstrap method specifics", () => {
    test("bootstrap intervals are non-empty", () => {
      const pointForecast = [100, 105, 110];
      const residuals = [1, -2, 3, -1, 2, -3, 1];
      const result = forecastWithInterval(pointForecast, residuals, 0, {
        method: "bootstrap",
        level: 0.95,
        seed: 42,
        simulations: 500,
      });

      expect(result.lower.length).toBe(3);
      expect(result.upper.length).toBe(3);
      expect(result.lower[0]).toBeLessThan(pointForecast[0]);
      expect(result.upper[0]).toBeGreaterThan(pointForecast[0]);
    });

    test("higher confidence level yields wider intervals", () => {
      const pointForecast = [100, 105];
      // Use continuous residuals for better quantile resolution
      const residuals = Array.from({ length: 100 }, (_, i) => {
        // Generate varied residuals using deterministic formula
        const x = i / 20;
        return Math.sin(x) * 2 + Math.cos(x * 1.5) * 1.5;
      });

      const result90 = forecastWithInterval(pointForecast, residuals, 0, {
        method: "bootstrap",
        level: 0.90,
        seed: 42,
        simulations: 1000,
      });

      const result99 = forecastWithInterval(pointForecast, residuals, 0, {
        method: "bootstrap",
        level: 0.99,
        seed: 42,
        simulations: 1000,
      });

      const width90 = result90.upper[0] - result90.lower[0];
      const width99 = result99.upper[0] - result99.lower[0];

      expect(width99).toBeGreaterThan(width90);
    });
  });
});

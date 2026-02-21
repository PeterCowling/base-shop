/**
 * Holt-Winters Additive Model Tests
 *
 * TDD validation for HoltWintersAdditive class implementing triple exponential
 * smoothing with additive seasonal component.
 */

import { HoltSmoothing } from "../../../src/math/forecasting/ewma";
import { HoltWintersAdditive } from "../../../src/math/forecasting/holt-winters";

describe("HoltWintersAdditive", () => {
  describe("Constructor and parameter validation", () => {
    it("should create instance with valid parameters", () => {
      const hw = new HoltWintersAdditive(0.3, 0.1, 0.2);
      expect(hw).toBeDefined();
      expect(hw.alpha).toBe(0.3);
      expect(hw.beta).toBe(0.1);
      expect(hw.gamma).toBe(0.2);
    });

    it("should throw if alpha is out of range", () => {
      expect(() => new HoltWintersAdditive(0, 0.1, 0.2)).toThrow(
        "Alpha must be in (0, 1]"
      );
      expect(() => new HoltWintersAdditive(1.1, 0.1, 0.2)).toThrow(
        "Alpha must be in (0, 1]"
      );
    });

    it("should throw if beta is out of range", () => {
      expect(() => new HoltWintersAdditive(0.3, 0, 0.2)).toThrow(
        "Beta must be in (0, 1]"
      );
      expect(() => new HoltWintersAdditive(0.3, 1.1, 0.2)).toThrow(
        "Beta must be in (0, 1]"
      );
    });

    it("should throw if gamma is out of range", () => {
      expect(() => new HoltWintersAdditive(0.3, 0.1, 0)).toThrow(
        "Gamma must be in (0, 1]"
      );
      expect(() => new HoltWintersAdditive(0.3, 0.1, 1.1)).toThrow(
        "Gamma must be in (0, 1]"
      );
    });
  });

  describe("fit() validation", () => {
    it("should throw if seasonal period is not an integer", () => {
      const hw = new HoltWintersAdditive(0.3, 0.1, 0.2);
      const data = Array(20).fill(10);
      expect(() => hw.fit(data, 4.5)).toThrow(
        "Seasonal period must be an integer"
      );
    });

    it("should throw if seasonal period is less than 2", () => {
      const hw = new HoltWintersAdditive(0.3, 0.1, 0.2);
      const data = Array(20).fill(10);
      expect(() => hw.fit(data, 1)).toThrow(
        "Seasonal period must be at least 2"
      );
    });

    it("should throw if data length is insufficient", () => {
      const hw = new HoltWintersAdditive(0.3, 0.1, 0.2);
      const data = Array(10).fill(10);
      expect(() => hw.fit(data, 8)).toThrow(
        "Data length (10) must be at least 2 * seasonal period (8)"
      );
    });
  });

  describe("VC-HW-02-01: Additive synthetic pattern recovery", () => {
    it("should recover phase and amplitude within tolerance", () => {
      // Generate synthetic: Y_t = 100 + 2*t + seasonal
      const seasonalPattern = [10, -5, -3, 8, -10, 5, -3, -2];
      const m = seasonalPattern.length;
      const n = 5 * m; // 5 full periods

      const data: number[] = [];
      for (let t = 0; t < n; t++) {
        data.push(100 + 2 * t + seasonalPattern[t % m]);
      }

      const hw = new HoltWintersAdditive(0.3, 0.1, 0.2);
      hw.fit(data, m);

      const fitted = hw.fittedValues;

      // Calculate MAE on last 2 periods (last 16 observations)
      const lastTwoPeriods = 2 * m;
      let errorSum = 0;
      let count = 0;

      for (let t = n - lastTwoPeriods; t < n; t++) {
        if (Number.isFinite(fitted[t])) {
          errorSum += Math.abs(data[t] - fitted[t]);
          count++;
        }
      }

      const mae = errorSum / count;
      expect(mae).toBeLessThan(5.0);
    });
  });

  describe("VC-HW-02-02: One-step-ahead MAE comparison with Holt", () => {
    it("should beat HoltSmoothing on seasonal data", () => {
      // Same synthetic data
      const seasonalPattern = [10, -5, -3, 8, -10, 5, -3, -2];
      const m = seasonalPattern.length;
      const n = 5 * m;

      const data: number[] = [];
      for (let t = 0; t < n; t++) {
        data.push(100 + 2 * t + seasonalPattern[t % m]);
      }

      // Fit Holt-Winters
      const hw = new HoltWintersAdditive(0.3, 0.1, 0.2);
      hw.fit(data, m);
      const hwFitted = hw.fittedValues;

      // Fit Holt (no seasonality)
      const holt = new HoltSmoothing(0.3, 0.1);
      holt.fit(data);
      const holtFitted = holt.fittedValues;

      // Compare MAE on last period
      const lastPeriod = m;
      let hwErrorSum = 0;
      let holtErrorSum = 0;
      let count = 0;

      for (let t = n - lastPeriod; t < n; t++) {
        if (Number.isFinite(hwFitted[t]) && Number.isFinite(holtFitted[t])) {
          hwErrorSum += Math.abs(data[t] - hwFitted[t]);
          holtErrorSum += Math.abs(data[t] - holtFitted[t]);
          count++;
        }
      }

      const hwMAE = hwErrorSum / count;
      const holtMAE = holtErrorSum / count;

      expect(hwMAE).toBeLessThan(holtMAE);
    });
  });

  describe("VC-HW-02-03: Forecast wraparound is periodic", () => {
    it("should have periodic seasonal pattern in forecast", () => {
      const seasonalPattern = [10, -5, -3, 8, -10, 5, -3, -2];
      const m = seasonalPattern.length;
      const n = 3 * m;

      const data: number[] = [];
      for (let t = 0; t < n; t++) {
        data.push(100 + 2 * t + seasonalPattern[t % m]);
      }

      const hw = new HoltWintersAdditive(0.3, 0.1, 0.2);
      hw.fit(data, m);

      // Forecast for 3*m steps
      const forecast = hw.forecast(3 * m);

      // Verify periodic pattern: forecast[h] - forecast[h+m] should be approximately constant
      // (Approximately constant = trend * m, since forecast[h] = L + h*T + S[h%m])
      const differences: number[] = [];
      for (let h = 0; h < 2 * m; h++) {
        differences.push(forecast[h + m] - forecast[h]);
      }

      // All differences should be approximately equal (trend * m)
      const meanDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
      for (const diff of differences) {
        expect(Math.abs(diff - meanDiff)).toBeLessThan(0.01);
      }
    });
  });

  describe("VC-HW-02-04: Fitted values structure", () => {
    it("should have only fittedValues[0] as NaN, rest finite", () => {
      const seasonalPattern = [10, -5, -3, 8, -10, 5, -3, -2];
      const m = seasonalPattern.length;
      const n = 3 * m;

      const data: number[] = [];
      for (let t = 0; t < n; t++) {
        data.push(100 + 2 * t + seasonalPattern[t % m]);
      }

      const hw = new HoltWintersAdditive(0.3, 0.1, 0.2);
      hw.fit(data, m);

      const fitted = hw.fittedValues;

      // First value should be NaN
      expect(Number.isNaN(fitted[0])).toBe(true);

      // All others should be finite
      for (let t = 1; t < fitted.length; t++) {
        expect(Number.isFinite(fitted[t])).toBe(true);
      }
    });
  });

  describe("VC-HW-02-05: minResidualIndex exposed", () => {
    it("should expose minResidualIndex equal to seasonalPeriod", () => {
      const seasonalPattern = [10, -5, -3, 8, -10, 5, -3, -2];
      const m = seasonalPattern.length;
      const n = 3 * m;

      const data: number[] = [];
      for (let t = 0; t < n; t++) {
        data.push(100 + 2 * t + seasonalPattern[t % m]);
      }

      const hw = new HoltWintersAdditive(0.3, 0.1, 0.2);
      hw.fit(data, m);

      expect(hw.minResidualIndex).toBe(m);
    });
  });

  describe("forecast() edge cases", () => {
    it("should return empty array for steps <= 0", () => {
      const hw = new HoltWintersAdditive(0.3, 0.1, 0.2);
      const data = [100, 110, 95, 105, 102, 112, 98, 108, 101, 111, 96, 106];
      hw.fit(data, 4);

      expect(hw.forecast(0)).toEqual([]);
      expect(hw.forecast(-5)).toEqual([]);
    });

    it("should throw if forecast called before fit", () => {
      const hw = new HoltWintersAdditive(0.3, 0.1, 0.2);
      expect(() => hw.forecast(5)).toThrow("Model must be fitted before forecasting");
    });
  });

  describe("getters", () => {
    it("should return current level, trend, and seasonal state", () => {
      const hw = new HoltWintersAdditive(0.3, 0.1, 0.2);
      const data = [100, 110, 95, 105, 102, 112, 98, 108, 101, 111, 96, 106];
      hw.fit(data, 4);

      expect(hw.level).not.toBeNull();
      expect(hw.trend).not.toBeNull();
      expect(hw.seasonalIndices).toHaveLength(4);

      expect(Number.isFinite(hw.level!)).toBe(true);
      expect(Number.isFinite(hw.trend!)).toBe(true);
      for (const s of hw.seasonalIndices) {
        expect(Number.isFinite(s)).toBe(true);
      }
    });
  });
});

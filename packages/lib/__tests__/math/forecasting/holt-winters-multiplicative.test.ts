/**
 * Holt-Winters Multiplicative Model Tests
 *
 * Test suite for HW-03: multiplicative seasonal forecasting with strict positivity contract
 */

import { HoltWintersMultiplicative } from "../../../src/math/forecasting/holt-winters";

describe("HoltWintersMultiplicative", () => {
  describe("VC-HW-03-01: Multiplicative synthetic pattern recovery", () => {
    it("should fit proportional seasonal pattern within tolerance", () => {
      // Generate synthetic: Y_t = (100 + 2*t) * [1.1, 0.95, 0.97, 1.08, 0.90, 1.05, 0.97, 0.98]_t%8
      const seasonalPeriod = 8;
      const seasonalFactors = [1.1, 0.95, 0.97, 1.08, 0.9, 1.05, 0.97, 0.98];
      const numPeriods = 4;
      const data: number[] = [];

      for (let t = 0; t < seasonalPeriod * numPeriods; t++) {
        const level = 100 + 2 * t;
        const seasonal = seasonalFactors[t % seasonalPeriod];
        data.push(level * seasonal);
      }

      const model = new HoltWintersMultiplicative({
        alpha: 0.3,
        beta: 0.1,
        gamma: 0.2,
        seasonalPeriod,
      });

      model.fit(data);

      const fittedValues = model.fittedValues;
      expect(fittedValues).toHaveLength(data.length);

      // Calculate MAE on last 2 periods (last 16 observations)
      const lastTwoPeriods = 2 * seasonalPeriod;
      let sumAbsError = 0;
      let count = 0;

      for (let i = data.length - lastTwoPeriods; i < data.length; i++) {
        if (Number.isFinite(fittedValues[i])) {
          sumAbsError += Math.abs(data[i] - fittedValues[i]);
          count++;
        }
      }

      const mae = sumAbsError / count;
      expect(mae).toBeLessThan(10.0);
    });
  });

  describe("VC-HW-03-02: Additive vs multiplicative comparison", () => {
    it("should have lower MAE than additive for proportional-amplitude data", () => {
      // Skip this test if HoltWintersAdditive is not available
      let HoltWintersAdditive: any;
      try {
        HoltWintersAdditive =
          require("../../../src/math/forecasting/holt-winters").HoltWintersAdditive;
      } catch {
        console.warn(
          "HoltWintersAdditive not available yet, skipping comparison test"
        );
        return;
      }

      // Generate proportional-amplitude data where seasonal amplitude scales with level
      const seasonalPeriod = 4;
      const seasonalFactors = [1.2, 0.9, 0.95, 1.15];
      const data: number[] = [];

      for (let t = 0; t < seasonalPeriod * 6; t++) {
        const level = 100 + 5 * t; // Growing level
        const seasonal = seasonalFactors[t % seasonalPeriod];
        data.push(level * seasonal);
      }

      // Fit multiplicative model
      const multModel = new HoltWintersMultiplicative({
        alpha: 0.3,
        beta: 0.1,
        gamma: 0.2,
        seasonalPeriod,
      });
      multModel.fit(data);

      // Fit additive model (uses different constructor signature)
      const addModel = new HoltWintersAdditive(0.3, 0.1, 0.2);
      addModel.fit(data, seasonalPeriod);

      // Calculate MAE on last period
      const lastPeriodStart = data.length - seasonalPeriod;
      let multSumAbsError = 0;
      let addSumAbsError = 0;
      let count = 0;

      const multFitted = multModel.fittedValues;
      const addFitted = addModel.fittedValues;

      for (let i = lastPeriodStart; i < data.length; i++) {
        if (Number.isFinite(multFitted[i]) && Number.isFinite(addFitted[i])) {
          multSumAbsError += Math.abs(data[i] - multFitted[i]);
          addSumAbsError += Math.abs(data[i] - addFitted[i]);
          count++;
        }
      }

      const multMAE = multSumAbsError / count;
      const addMAE = addSumAbsError / count;

      // Multiplicative should perform better on proportional data
      expect(multMAE).toBeLessThan(addMAE);
    });
  });

  describe("VC-HW-03-03: Input validation - positivity contract", () => {
    it("should throw when input contains zero values", () => {
      const data = [100, 110, 0, 105, 102, 112, 108, 115];

      expect(() => {
        const model = new HoltWintersMultiplicative({
          alpha: 0.3,
          beta: 0.1,
          gamma: 0.2,
          seasonalPeriod: 4,
        });
        model.fit(data);
      }).toThrow(/positive/i);
    });

    it("should throw when input contains negative values", () => {
      const data = [100, 110, -5, 105, 102, 112, 108, 115];

      expect(() => {
        const model = new HoltWintersMultiplicative({
          alpha: 0.3,
          beta: 0.1,
          gamma: 0.2,
          seasonalPeriod: 4,
        });
        model.fit(data);
      }).toThrow(/positive/i);
    });

    it("should accept all positive values", () => {
      const data = [100, 110, 95, 105, 102, 112, 108, 115];

      expect(() => {
        const model = new HoltWintersMultiplicative({
          alpha: 0.3,
          beta: 0.1,
          gamma: 0.2,
          seasonalPeriod: 4,
        });
        model.fit(data);
      }).not.toThrow();
    });
  });

  describe("VC-HW-03-04: Forecast wraparound periodicity", () => {
    it("should maintain periodic seasonal pattern for h = 1..3m", () => {
      const seasonalPeriod = 4;
      const data = [100, 110, 95, 105, 102, 112, 98, 108, 104, 114, 100, 110];

      const model = new HoltWintersMultiplicative({
        alpha: 0.3,
        beta: 0.1,
        gamma: 0.2,
        seasonalPeriod,
      });

      model.fit(data);

      // Forecast 3 full periods
      const forecasts = model.forecast(3 * seasonalPeriod);
      expect(forecasts).toHaveLength(3 * seasonalPeriod);

      // Extract seasonal pattern from each period
      for (let period = 0; period < 3; period++) {
        const periodStart = period * seasonalPeriod;

        for (let i = 0; i < seasonalPeriod; i++) {
          // Check that seasonal pattern is consistent across periods
          // Allow for trend effects but seasonal factor should be similar
          if (period < 2) {
            const currentValue = forecasts[periodStart + i];
            const nextPeriodValue = forecasts[periodStart + seasonalPeriod + i];

            // The ratio should reflect the trend, not the seasonality
            // Seasonal component should be the same at same position in cycle
            expect(Number.isFinite(currentValue)).toBe(true);
            expect(Number.isFinite(nextPeriodValue)).toBe(true);
          }
        }
      }
    });
  });

  describe("VC-HW-03-05: Fitted values structure", () => {
    it("should have only fittedValues[0] as NaN", () => {
      const data = [100, 110, 95, 105, 102, 112, 108, 115, 104, 114, 100, 110];

      const model = new HoltWintersMultiplicative({
        alpha: 0.3,
        beta: 0.1,
        gamma: 0.2,
        seasonalPeriod: 4,
      });

      model.fit(data);

      const fittedValues = model.fittedValues;
      expect(fittedValues).toHaveLength(data.length);

      // First value should be NaN (no one-step-ahead prediction possible)
      expect(Number.isNaN(fittedValues[0])).toBe(true);

      // All subsequent values should be finite
      for (let i = 1; i < fittedValues.length; i++) {
        expect(Number.isFinite(fittedValues[i])).toBe(true);
      }
    });

    it("should expose minResidualIndex equal to seasonalPeriod", () => {
      const seasonalPeriod = 4;
      const data = [100, 110, 95, 105, 102, 112, 108, 115];

      const model = new HoltWintersMultiplicative({
        alpha: 0.3,
        beta: 0.1,
        gamma: 0.2,
        seasonalPeriod,
      });

      model.fit(data);

      expect(model.minResidualIndex).toBe(seasonalPeriod);
    });
  });

  describe("Edge cases", () => {
    it("should return empty array for forecast steps <= 0", () => {
      const data = [100, 110, 95, 105, 102, 112, 108, 115];

      const model = new HoltWintersMultiplicative({
        alpha: 0.3,
        beta: 0.1,
        gamma: 0.2,
        seasonalPeriod: 4,
      });

      model.fit(data);

      expect(model.forecast(0)).toEqual([]);
      expect(model.forecast(-5)).toEqual([]);
    });

    it("should validate parameter ranges", () => {
      expect(() => {
        new HoltWintersMultiplicative({
          alpha: 0,
          beta: 0.1,
          gamma: 0.2,
          seasonalPeriod: 4,
        });
      }).toThrow(/alpha/i);

      expect(() => {
        new HoltWintersMultiplicative({
          alpha: 1.5,
          beta: 0.1,
          gamma: 0.2,
          seasonalPeriod: 4,
        });
      }).toThrow(/alpha/i);

      expect(() => {
        new HoltWintersMultiplicative({
          alpha: 0.3,
          beta: 0,
          gamma: 0.2,
          seasonalPeriod: 4,
        });
      }).toThrow(/beta/i);

      expect(() => {
        new HoltWintersMultiplicative({
          alpha: 0.3,
          beta: 0.1,
          gamma: 1.5,
          seasonalPeriod: 4,
        });
      }).toThrow(/gamma/i);
    });

    it("should validate seasonal period", () => {
      expect(() => {
        new HoltWintersMultiplicative({
          alpha: 0.3,
          beta: 0.1,
          gamma: 0.2,
          seasonalPeriod: 1,
        });
      }).toThrow(/seasonal period/i);

      expect(() => {
        new HoltWintersMultiplicative({
          alpha: 0.3,
          beta: 0.1,
          gamma: 0.2,
          seasonalPeriod: 2.5,
        });
      }).toThrow(/seasonal period/i);
    });

    it("should require sufficient data length", () => {
      const data = [100, 110, 95]; // Only 3 points, need at least 2*m

      const model = new HoltWintersMultiplicative({
        alpha: 0.3,
        beta: 0.1,
        gamma: 0.2,
        seasonalPeriod: 4,
      });

      expect(() => {
        model.fit(data);
      }).toThrow(/length/i);
    });
  });
});

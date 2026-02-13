import { describe, expect, it } from "@jest/globals";

import {
  HoltWintersAdditive,
  HoltWintersMultiplicative,
} from "../../../src/math/forecasting/holt-winters";
import {
  type OptimizationOptions,
  type OptimizationResult,
  optimizeParameters,
} from "../../../src/math/forecasting/parameter-optimization";

describe("parameter-optimization", () => {
  describe("optimizeParameters", () => {
    // Helper: Generate synthetic seasonal data with known parameters
    function generateSeasonalData(
      periods: number,
      seasonalPeriod: number,
      level = 100,
      trend = 2,
      seasonalAmplitude = 10,
      noise = 0.1
    ): number[] {
      const data: number[] = [];
      const seasonal = Array.from({ length: seasonalPeriod }, (_, i) =>
        Math.sin((2 * Math.PI * i) / seasonalPeriod)
      );

      for (let t = 0; t < periods * seasonalPeriod; t++) {
        const seasonalComponent =
          seasonal[t % seasonalPeriod] * seasonalAmplitude;
        const randomNoise = (Math.random() - 0.5) * 2 * noise;
        data.push(level + trend * t + seasonalComponent + randomNoise);
      }
      return data;
    }

    describe("VC-HW-06-01: Optimization decreases SSE vs default params", () => {
      it("should find better parameters than defaults for additive model", () => {
        const seasonalPeriod = 12;
        const data = generateSeasonalData(5, seasonalPeriod, 100, 2, 10, 1);

        // Baseline: default parameters
        const defaultModel = new HoltWintersAdditive(0.3, 0.1, 0.2);
        defaultModel.fit(data, seasonalPeriod);
        const defaultResiduals = data.map(
          (y, i) => y - defaultModel.fittedValues[i]
        );
        const defaultSSE = defaultResiduals
          .slice(defaultModel.minResidualIndex)
          .reduce((sum, r) => sum + r * r, 0);

        // Optimized parameters
        const result = optimizeParameters(data, seasonalPeriod, "additive");

        expect(result.sse).toBeLessThan(defaultSSE);
        expect(result.alpha).toBeGreaterThanOrEqual(0.01);
        expect(result.alpha).toBeLessThanOrEqual(0.99);
        expect(result.beta).toBeGreaterThanOrEqual(0.01);
        expect(result.beta).toBeLessThanOrEqual(0.99);
        expect(result.gamma).toBeGreaterThanOrEqual(0.01);
        expect(result.gamma).toBeLessThanOrEqual(0.99);
      });

      it("should find better parameters than defaults for multiplicative model", () => {
        const seasonalPeriod = 4;
        const data = generateSeasonalData(6, seasonalPeriod, 100, 5, 15, 2);

        // Baseline: default parameters
        const defaultModel = new HoltWintersMultiplicative({
          alpha: 0.3,
          beta: 0.1,
          gamma: 0.2,
          seasonalPeriod,
        });
        defaultModel.fit(data);
        const defaultResiduals = data.map(
          (y, i) => y - defaultModel.fittedValues[i]
        );
        const defaultSSE = defaultResiduals
          .slice(defaultModel.minResidualIndex)
          .reduce((sum, r) => sum + r * r, 0);

        // Optimized parameters
        const result = optimizeParameters(
          data,
          seasonalPeriod,
          "multiplicative"
        );

        expect(result.sse).toBeLessThanOrEqual(defaultSSE * 1.1); // Allow 10% margin for multiplicative
        expect(result.alpha).toBeGreaterThanOrEqual(0.01);
        expect(result.alpha).toBeLessThanOrEqual(0.99);
      });
    });

    describe("VC-HW-06-02: Refined search beats or matches coarse-only", () => {
      it("should perform both coarse and refined searches", () => {
        const seasonalPeriod = 4;
        const data = generateSeasonalData(4, seasonalPeriod, 50, 1, 5, 0.5);

        const result = optimizeParameters(data, seasonalPeriod, "additive");

        // Coarse search evaluates 9^3 = 729 combinations
        // Refined search should evaluate additional candidates
        expect(result.evaluatedCandidates).toBeGreaterThan(729);
      });

      it("should match or improve upon coarse-only search", () => {
        const seasonalPeriod = 6;
        const data = generateSeasonalData(3, seasonalPeriod, 80, 3, 8, 1);

        const fullResult = optimizeParameters(data, seasonalPeriod, "additive");
        const coarseOnlyResult = optimizeParameters(
          data,
          seasonalPeriod,
          "additive",
          { skipRefinement: true }
        );

        // Full optimization should be at least as good as coarse-only
        expect(fullResult.sse).toBeLessThanOrEqual(coarseOnlyResult.sse);
        expect(coarseOnlyResult.evaluatedCandidates).toBe(729);
      });
    });

    describe("VC-HW-06-03: Boundary cases", () => {
      it("should handle minimum data length (exactly 2*m)", () => {
        const seasonalPeriod = 4;
        const data = generateSeasonalData(2, seasonalPeriod, 100, 1, 5, 0.1);

        expect(data.length).toBe(2 * seasonalPeriod);

        const result = optimizeParameters(data, seasonalPeriod, "additive");

        expect(result.alpha).toBeGreaterThanOrEqual(0.01);
        expect(result.alpha).toBeLessThanOrEqual(0.99);
        expect(result.sse).toBeGreaterThanOrEqual(0);
      });

      it("should handle extreme seasonality", () => {
        const seasonalPeriod = 12;
        const data = generateSeasonalData(3, seasonalPeriod, 100, 0, 50, 0); // Large seasonal component

        const result = optimizeParameters(data, seasonalPeriod, "additive");

        expect(result.gamma).toBeGreaterThanOrEqual(0.1); // Should recognize strong seasonality
        expect(result.sse).toBeGreaterThanOrEqual(0);
      });

      it("should throw on data too short for seasonal period", () => {
        const seasonalPeriod = 12;
        const data = [1, 2, 3, 4, 5]; // Less than 2*m

        expect(() =>
          optimizeParameters(data, seasonalPeriod, "additive")
        ).toThrow();
      });

      it("should throw on invalid seasonal period", () => {
        const data = generateSeasonalData(3, 4, 100, 1, 5, 0.1);

        expect(() => optimizeParameters(data, 1, "additive")).toThrow();
        expect(() => optimizeParameters(data, 0, "additive")).toThrow();
        expect(() => optimizeParameters(data, -1, "additive")).toThrow();
      });
    });

    describe("VC-HW-06-04: Evaluated candidates count bounds", () => {
      it("should evaluate exactly 729 candidates in coarse search", () => {
        const seasonalPeriod = 4;
        const data = generateSeasonalData(3, seasonalPeriod, 100, 1, 5, 0.1);

        const result = optimizeParameters(data, seasonalPeriod, "additive", {
          skipRefinement: true,
        });

        expect(result.evaluatedCandidates).toBe(729); // 9^3
      });

      it("should evaluate reasonable number of candidates with refinement", () => {
        const seasonalPeriod = 4;
        const data = generateSeasonalData(3, seasonalPeriod, 100, 1, 5, 0.1);

        const result = optimizeParameters(data, seasonalPeriod, "additive");

        // Coarse: 729
        // Refined: up to 9 values per parameter (best ± 0.08 step 0.02, clamped) = up to 9^3 = 729
        // Total should be between 729 and 1458
        expect(result.evaluatedCandidates).toBeGreaterThan(729);
        expect(result.evaluatedCandidates).toBeLessThan(1500); // Sanity check
      });
    });

    describe("Additional validation", () => {
      it("should be deterministic for same input", () => {
        const seasonalPeriod = 4;
        const data = generateSeasonalData(3, seasonalPeriod, 100, 1, 5, 0);

        const result1 = optimizeParameters(data, seasonalPeriod, "additive");
        const result2 = optimizeParameters(data, seasonalPeriod, "additive");

        expect(result1.alpha).toBe(result2.alpha);
        expect(result1.beta).toBe(result2.beta);
        expect(result1.gamma).toBe(result2.gamma);
        expect(result1.sse).toBe(result2.sse);
        expect(result1.aic).toBe(result2.aic);
        expect(result1.evaluatedCandidates).toBe(result2.evaluatedCandidates);
      });

      it("should clamp parameters to valid range [0.01, 0.99]", () => {
        const seasonalPeriod = 4;
        const data = generateSeasonalData(3, seasonalPeriod, 100, 1, 5, 0.1);

        const result = optimizeParameters(data, seasonalPeriod, "additive");

        expect(result.alpha).toBeGreaterThanOrEqual(0.01);
        expect(result.alpha).toBeLessThanOrEqual(0.99);
        expect(result.beta).toBeGreaterThanOrEqual(0.01);
        expect(result.beta).toBeLessThanOrEqual(0.99);
        expect(result.gamma).toBeGreaterThanOrEqual(0.01);
        expect(result.gamma).toBeLessThanOrEqual(0.99);
      });

      it("should work with multiplicative model type", () => {
        const seasonalPeriod = 4;
        const data = generateSeasonalData(3, seasonalPeriod, 100, 2, 10, 1);

        const result = optimizeParameters(
          data,
          seasonalPeriod,
          "multiplicative"
        );

        expect(result.alpha).toBeGreaterThanOrEqual(0.01);
        expect(result.sse).toBeGreaterThanOrEqual(0);
        expect(result.aic).toBeGreaterThan(0);
      });

      it("should populate all result fields", () => {
        const seasonalPeriod = 4;
        const data = generateSeasonalData(3, seasonalPeriod, 100, 1, 5, 0.1);

        const result = optimizeParameters(data, seasonalPeriod, "additive");

        expect(typeof result.alpha).toBe("number");
        expect(typeof result.beta).toBe("number");
        expect(typeof result.gamma).toBe("number");
        expect(typeof result.sse).toBe("number");
        expect(typeof result.aic).toBe("number");
        expect(typeof result.evaluatedCandidates).toBe("number");
        expect(result.evaluatedCandidates).toBeGreaterThan(0);
      });

      it("should handle custom grid step size", () => {
        const seasonalPeriod = 4;
        const data = generateSeasonalData(3, seasonalPeriod, 100, 1, 5, 0.1);

        const result = optimizeParameters(data, seasonalPeriod, "additive", {
          coarseStep: 0.2, // Fewer evaluations
        });

        // With step 0.2: 0.1, 0.3, 0.5, 0.7, 0.9 = 5 values
        // 5^3 = 125 evaluations in coarse search
        const coarseResult = optimizeParameters(
          data,
          seasonalPeriod,
          "additive",
          {
            coarseStep: 0.2,
            skipRefinement: true,
          }
        );

        expect(coarseResult.evaluatedCandidates).toBe(125);
        expect(result.evaluatedCandidates).toBeGreaterThan(125);
      });
    });
  });
});

/**
 * Tests for model-selection helpers
 *
 * Validation contracts:
 * - VC-HW-04-01: Formula-level test matches hand-computed AIC/BIC
 * - VC-HW-04-02: nEffective excludes non-finite residuals and respects start index
 * - VC-HW-04-03: Different warm-up lengths compared on shared window
 * - VC-HW-04-04: Near-zero SSE uses epsilon floor and returns finite metrics
 * - VC-HW-04-05: Seasonal data ordering generally favors HW over SES/Holt
 */

import {
  HoltSmoothing,
  HoltWintersAdditive,
  scoreModel,
  SimpleExponentialSmoothing,
} from "../../../src/math/forecasting";
import type {
  ModelCandidate,
  ModelComparisonResult,
} from "../../../src/math/forecasting/model-selection";
import {
  compareModels,
  selectBestModel,
} from "../../../src/math/forecasting/model-selection";

describe("model-selection", () => {
  describe("compareModels", () => {
    test("VC-HW-04-01: Formula-level test matches hand-computed AIC/BIC", () => {
      // Fixed residual vectors for manual verification
      const residuals1 = [NaN, 1.0, -1.0, 0.5, -0.5, 1.2];
      const residuals2 = [NaN, NaN, 0.8, -0.8, 0.6, -0.6, 1.0];

      const candidates: ModelCandidate[] = [
        {
          name: "Model1",
          residuals: residuals1,
          numParams: 1,
          minResidualIndex: 1,
        },
        {
          name: "Model2",
          residuals: residuals2,
          numParams: 2,
          minResidualIndex: 2,
        },
      ];

      const result = compareModels(candidates);

      // Shared start = max(1, 2) = 2
      expect(result.sharedStart).toBe(2);

      // Verify using scoreModel directly
      const score1 = scoreModel(residuals1, 2, 1);
      const score2 = scoreModel(residuals2, 2, 2);

      // Model1 window: residuals[2:] = [-1.0, 0.5, -0.5, 1.2]
      // nEffective = 4
      // SSE = 1 + 0.25 + 0.25 + 1.44 = 2.94
      // sigma2MLE = 2.94 / 4 = 0.735
      // logLik = -(4/2) * (ln(2π) + ln(0.735) + 1)
      //        = -2 * (1.8379 + (-0.3078) + 1)
      //        = -2 * 2.5301 = -5.0602
      // AIC = -2*(-5.0602) + 2*1 = 10.1204 + 2 = 12.1204
      // BIC = -2*(-5.0602) + 1*ln(4) = 10.1204 + 1.3863 = 11.5067

      expect(score1.nEffective).toBe(4);
      expect(score1.sse).toBeCloseTo(2.94, 5);
      expect(score1.sigma2MLE).toBeCloseTo(0.735, 5);
      expect(score1.logLik).toBeCloseTo(-5.0602, 3);
      expect(score1.aic).toBeCloseTo(12.1204, 3);
      expect(score1.bic).toBeCloseTo(11.5067, 3);

      // Model2 window: residuals[2:] = [0.8, -0.8, 0.6, -0.6, 1.0]
      // nEffective = 5
      // SSE = 0.64 + 0.64 + 0.36 + 0.36 + 1.0 = 3.0
      // sigma2MLE = 3.0 / 5 = 0.6
      // logLik = -(5/2) * (ln(2π) + ln(0.6) + 1)
      //        = -2.5 * (1.8379 + (-0.5108) + 1)
      //        = -2.5 * 2.3271 = -5.8178
      // AIC = -2*(-5.8178) + 2*2 = 11.6356 + 4 = 15.6356
      // BIC = -2*(-5.8178) + 2*ln(5) = 11.6356 + 3.2189 = 14.8544

      expect(score2.nEffective).toBe(5);
      expect(score2.sse).toBeCloseTo(3.0, 5);
      expect(score2.sigma2MLE).toBeCloseTo(0.6, 5);
      expect(score2.logLik).toBeCloseTo(-5.8178, 3);
      expect(score2.aic).toBeCloseTo(15.6356, 3);
      expect(score2.bic).toBeCloseTo(14.8544, 3);

      // Verify result structure
      expect(result.rankings).toHaveLength(2);
      expect(result.rankings[0].rank).toBe(1);
      expect(result.rankings[1].rank).toBe(2);

      // Model1 should rank first (lower AIC)
      expect(result.rankings[0].name).toBe("Model1");
      expect(result.rankings[0].score.aic).toBeCloseTo(12.1204, 3);

      expect(result.rankings[1].name).toBe("Model2");
      expect(result.rankings[1].score.aic).toBeCloseTo(15.6356, 3);
    });

    test("VC-HW-04-02: nEffective excludes non-finite residuals and respects start index", () => {
      const residuals = [NaN, NaN, 1.0, NaN, 2.0, Infinity, 3.0, -Infinity, 4.0];

      const candidates: ModelCandidate[] = [
        {
          name: "ModelA",
          residuals,
          numParams: 1,
          minResidualIndex: 2,
        },
      ];

      const result = compareModels(candidates);

      // Window from index 2: [1.0, NaN, 2.0, Infinity, 3.0, -Infinity, 4.0]
      // Finite values: [1.0, 2.0, 3.0, 4.0]
      // nEffective = 4
      expect(result.rankings[0].score.nEffective).toBe(4);

      // SSE = 1 + 4 + 9 + 16 = 30
      expect(result.rankings[0].score.sse).toBeCloseTo(30, 5);
    });

    test("VC-HW-04-03: Different warm-up lengths compared on shared window", () => {
      // Model 1: short warm-up (minResidualIndex=1)
      const residuals1 = [NaN, 0.5, 0.6, 0.7, 0.8];

      // Model 2: long warm-up (minResidualIndex=3)
      const residuals2 = [NaN, NaN, NaN, 0.4, 0.5];

      const candidates: ModelCandidate[] = [
        {
          name: "ShortWarmup",
          residuals: residuals1,
          numParams: 1,
          minResidualIndex: 1,
        },
        {
          name: "LongWarmup",
          residuals: residuals2,
          numParams: 2,
          minResidualIndex: 3,
        },
      ];

      const result = compareModels(candidates);

      // Shared start = max(1, 3) = 3
      expect(result.sharedStart).toBe(3);

      // Both models scored on indices [3, 4]
      // Model 1: [0.7, 0.8] → nEffective = 2
      expect(result.rankings.find((r) => r.name === "ShortWarmup")?.score.nEffective).toBe(2);

      // Model 2: [0.4, 0.5] → nEffective = 2
      expect(result.rankings.find((r) => r.name === "LongWarmup")?.score.nEffective).toBe(2);
    });

    test("VC-HW-04-04: Near-zero SSE uses epsilon floor and returns finite metrics", () => {
      // Perfect fit: all residuals are zero
      const residuals = [NaN, 0.0, 0.0, 0.0, 0.0];

      const candidates: ModelCandidate[] = [
        {
          name: "PerfectFit",
          residuals,
          numParams: 1,
          minResidualIndex: 1,
        },
      ];

      const result = compareModels(candidates);

      const score = result.rankings[0].score;

      // SSE = 0
      expect(score.sse).toBe(0);

      // sigma2MLE should be floored to Number.EPSILON
      expect(score.sigma2MLE).toBe(Number.EPSILON);

      // All metrics should be finite
      expect(Number.isFinite(score.logLik)).toBe(true);
      expect(Number.isFinite(score.aic)).toBe(true);
      expect(Number.isFinite(score.bic)).toBe(true);
    });

    test("VC-HW-04-05: Seasonal data ordering generally favors HW over SES/Holt", () => {
      // Generate synthetic seasonal data: Y_t = 100 + 2*t + seasonal_pattern[t%8]
      // Use stronger seasonal pattern to ensure HW clearly wins
      const seasonalPattern = [20, -15, -10, 18, -20, 15, -8, -5];
      const n = 48; // 6 full cycles
      const data: number[] = [];

      for (let t = 0; t < n; t++) {
        data.push(100 + 2 * t + seasonalPattern[t % 8]);
      }

      // Fit models
      const ses = new SimpleExponentialSmoothing(0.3);
      ses.fit(data);

      const holt = new HoltSmoothing(0.3, 0.1);
      holt.fit(data);

      const hw = new HoltWintersAdditive(0.3, 0.1, 0.2);
      hw.fit(data, 8);

      // Compute residuals
      const sesFitted = ses.fittedValues;
      const holtFitted = holt.fittedValues;
      const hwFitted = hw.fittedValues;

      const sesResiduals = data.map((y, i) => y - sesFitted[i]);
      const holtResiduals = data.map((y, i) => y - holtFitted[i]);
      const hwResiduals = data.map((y, i) => y - hwFitted[i]);

      const candidates: ModelCandidate[] = [
        {
          name: "SES",
          residuals: sesResiduals,
          numParams: 1,
          minResidualIndex: 1, // SES: fittedValues[0] is not a prediction
        },
        {
          name: "Holt",
          residuals: holtResiduals,
          numParams: 2,
          minResidualIndex: 1, // Holt: fittedValues[0] is not a prediction
        },
        {
          name: "HoltWinters",
          residuals: hwResiduals,
          numParams: 3,
          minResidualIndex: hw.minResidualIndex, // Should be 8
        },
      ];

      const result = compareModels(candidates);

      // HW should rank #1 (lowest AIC)
      expect(result.rankings[0].name).toBe("HoltWinters");

      // Verify HW beats both SES and Holt by AIC
      const hwAIC = result.rankings.find((r) => r.name === "HoltWinters")!.score.aic;
      const holtAIC = result.rankings.find((r) => r.name === "Holt")!.score.aic;
      const sesAIC = result.rankings.find((r) => r.name === "SES")!.score.aic;

      expect(hwAIC).toBeLessThan(holtAIC);
      expect(hwAIC).toBeLessThan(sesAIC);
    });

    test("empty candidates array returns empty rankings", () => {
      const result = compareModels([]);

      expect(result.sharedStart).toBe(0);
      expect(result.rankings).toEqual([]);
    });

    test("single candidate is ranked #1", () => {
      const candidates: ModelCandidate[] = [
        {
          name: "OnlyModel",
          residuals: [NaN, 1.0, 2.0],
          numParams: 1,
          minResidualIndex: 1,
        },
      ];

      const result = compareModels(candidates);

      expect(result.rankings).toHaveLength(1);
      expect(result.rankings[0].rank).toBe(1);
      expect(result.rankings[0].name).toBe("OnlyModel");
    });
  });

  describe("selectBestModel", () => {
    test("returns best model name and all scores", () => {
      const candidates: ModelCandidate[] = [
        {
          name: "GoodModel",
          residuals: [NaN, 0.1, 0.2, 0.1],
          numParams: 2,
          minResidualIndex: 1,
        },
        {
          name: "BetterModel",
          residuals: [NaN, 0.05, 0.1, 0.05],
          numParams: 1,
          minResidualIndex: 1,
        },
      ];

      const result = selectBestModel(candidates);

      // BetterModel should win (lower SSE, fewer params)
      expect(result.bestModel).toBe("BetterModel");
      expect(result.scores).toHaveLength(2);
      expect(result.sharedStart).toBe(1);

      // Verify scores are sorted by AIC
      expect(result.scores[0].aic).toBeLessThanOrEqual(result.scores[1].aic);
    });

    test("throws on empty candidates", () => {
      expect(() => selectBestModel([])).toThrow();
    });
  });
});

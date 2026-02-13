/**
 * Experimentation Module - Statistical primitives for A/B testing workflows.
 *
 * This module hosts sample-size planning, frequentist tests, Bayesian updates,
 * and sequential decision helpers for controlled experiments.
 *
 * @example
 * ```typescript
 * import { sampleSizeForProportions } from "@acme/lib/math/experimentation";
 *
 * const plan = sampleSizeForProportions({
 *   baselineRate: 0.05,
 *   minimumDetectableEffect: 0.01,
 *   alpha: 0.05,
 *   power: 0.8,
 * });
 * ```
 *
 * @example
 * ```typescript
 * import { zTestProportions } from "@acme/lib/math/experimentation";
 *
 * const test = zTestProportions({
 *   controlSuccesses: 50,
 *   controlTotal: 1000,
 *   treatmentSuccesses: 65,
 *   treatmentTotal: 1000,
 *   alternative: "greater",
 * });
 * ```
 *
 * @example
 * ```typescript
 * import { betaBinomialPosterior } from "@acme/lib/math/experimentation";
 *
 * const posterior = betaBinomialPosterior({
 *   priorAlpha: 1,
 *   priorBeta: 1,
 *   successes: 120,
 *   failures: 1880,
 * });
 * ```
 *
 * Note: APIs are introduced incrementally by ABT plan tasks.
 */
export type {
  BayesianABTestOptions,
  BayesianABTestResult,
  BetaPosteriorSummary,
} from "./bayesian";
export { bayesianABTest } from "./bayesian";
export type { ConfidenceIntervalResult } from "./confidence-intervals";
export {
  meanConfidenceInterval,
  meanDifferenceCI,
  proportionConfidenceInterval,
  proportionDifferenceCI,
} from "./confidence-intervals";
export type {
  ChiSquareGoodnessOfFitOptions,
  ChiSquareGoodnessOfFitResult,
  WelchTTestOptions,
  WelchTTestResult,
  ZTestProportionsOptions,
  ZTestProportionsResult,
} from "./hypothesis-tests";
export {
  chiSquareGoodnessOfFit,
  welchTTest,
  zTestProportions,
} from "./hypothesis-tests";
export type {
  AlternativeHypothesis,
  SampleSizeForProportionsOptions,
  SampleSizeForProportionsResult,
} from "./sample-size";
export { sampleSizeForProportions } from "./sample-size";
export type {
  ThompsonSamplingArm,
  ThompsonSamplingOptions,
  ThompsonSamplingResult,
  ThompsonSamplingSimulationOptions,
  ThompsonSamplingSimulationResult,
} from "./thompson-sampling";
export {
  thompsonSampling,
  thompsonSamplingSimulation,
} from "./thompson-sampling";

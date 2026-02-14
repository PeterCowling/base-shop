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
  AlwaysValidMixturePrior,
  AlwaysValidPowerSimulationOptions,
  AlwaysValidPowerSimulationResult,
  AlwaysValidPValueOptions,
  AlwaysValidPValueResult,
  AlwaysValidType1SimulationOptions,
  AlwaysValidType1SimulationResult,
} from "./always-valid-inference.js";
export {
  alwaysValidPValue,
  simulateAlwaysValidPower,
  simulateAlwaysValidType1,
} from "./always-valid-inference.js";
export type {
  BayesianABTestOptions,
  BayesianABTestResult,
  BetaPosteriorSummary,
} from "./bayesian.js";
export { bayesianABTest } from "./bayesian.js";
export type { ConfidenceIntervalResult } from "./confidence-intervals.js";
export {
  meanConfidenceInterval,
  meanDifferenceCI,
  proportionConfidenceInterval,
  proportionDifferenceCI,
} from "./confidence-intervals.js";
export type {
  GroupSequentialTestOptions,
  GroupSequentialTestResult,
} from "./group-sequential.js";
export { groupSequentialTest } from "./group-sequential.js";
export type {
  ChiSquareGoodnessOfFitOptions,
  ChiSquareGoodnessOfFitResult,
  WelchTTestOptions,
  WelchTTestResult,
  ZTestProportionsOptions,
  ZTestProportionsResult,
} from "./hypothesis-tests.js";
export {
  chiSquareGoodnessOfFit,
  welchTTest,
  zTestProportions,
} from "./hypothesis-tests.js";
export type {
  AlternativeHypothesis,
  SampleSizeForProportionsOptions,
  SampleSizeForProportionsResult,
} from "./sample-size.js";
export { sampleSizeForProportions } from "./sample-size.js";
export type {
  ThompsonSamplingArm,
  ThompsonSamplingOptions,
  ThompsonSamplingResult,
  ThompsonSamplingSimulationOptions,
  ThompsonSamplingSimulationResult,
} from "./thompson-sampling.js";
export {
  thompsonSampling,
  thompsonSamplingSimulation,
} from "./thompson-sampling.js";

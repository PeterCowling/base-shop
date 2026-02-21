export type { EWMAOptions } from "./ewma.js";
export {
  EWMA,
  exponentialMovingAverage,
  HoltSmoothing,
  movingAverage,
  SimpleExponentialSmoothing,
  weightedMovingAverage,
} from "./ewma.js";
export type { HoltWintersOptions } from "./holt-winters.js";
export { HoltWintersAdditive, HoltWintersMultiplicative } from "./holt-winters.js";
export type { ModelCandidate, ModelComparisonResult } from "./model-selection.js";
export { compareModels, selectBestModel } from "./model-selection.js";
export type {
  OptimizationOptions,
  OptimizationResult,
} from "./parameter-optimization.js";
export { optimizeParameters } from "./parameter-optimization.js";
export type {
  ForecastInterval,
  IntervalOptions,
} from "./prediction-intervals.js";
export { forecastWithInterval } from "./prediction-intervals.js";
export type { DecompositionResult } from "./seasonal-decomposition.js";
export {
  decomposeAdditive,
  decomposeMultiplicative,
} from "./seasonal-decomposition.js";
export type { ModelScore } from "./utils.js";
export {
  assertFiniteArray,
  assertSeasonalPeriod,
  finiteResiduals,
  normalizeSeasonalAdditive,
  normalizeSeasonalMultiplicative,
  scoreModel,
  seasonAtHorizon,
  seasonIndex,
  sumSquaredError,
} from "./utils.js";

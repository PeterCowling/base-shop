export type { EWMAOptions } from "./ewma";
export {
  EWMA,
  exponentialMovingAverage,
  HoltSmoothing,
  movingAverage,
  SimpleExponentialSmoothing,
  weightedMovingAverage,
} from "./ewma";
export type { ModelScore } from "./utils";
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
} from "./utils";

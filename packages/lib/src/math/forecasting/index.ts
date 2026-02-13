export type { EWMAOptions } from "./ewma";
export {
  EWMA,
  exponentialMovingAverage,
  HoltSmoothing,
  movingAverage,
  SimpleExponentialSmoothing,
  weightedMovingAverage,
} from "./ewma";
export type { HoltWintersOptions } from "./holt-winters";
export { HoltWintersAdditive, HoltWintersMultiplicative } from "./holt-winters";
export type { DecompositionResult } from "./seasonal-decomposition";
export {
  decomposeAdditive,
  decomposeMultiplicative,
} from "./seasonal-decomposition";
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

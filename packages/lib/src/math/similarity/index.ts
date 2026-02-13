/**
 * Similarity Module - Advanced dependence and similarity metrics.
 *
 * This module exposes shared validation contracts first. Metric
 * implementations are added incrementally as separate task slices.
 */

export {
  handleSimilarityValidationFailure,
  type PairInputRequirements,
  type SimilarityValidationOptions,
  validateNumericPairInputs,
} from "./common";
export {
  distanceCorrelation,
  type DistanceCorrelationOptions,
} from "./distance-correlation";
export { hoeffding, type HoeffdingOptions } from "./hoeffding";
export {
  jensenShannonDistance,
  jensenShannonDivergence,
  type JensenShannonOptions,
} from "./jensen-shannon";
export { type KendallOptions,kendallTau } from "./kendall";
export {
  normalizedMutualInformationBinned,
  type NormalizedMutualInformationBinnedOptions,
  normalizedMutualInformationDiscrete,
  type NormalizedMutualInformationDiscreteOptions,
} from "./mutual-information";

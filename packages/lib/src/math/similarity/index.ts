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
} from "./common.js";
export {
  distanceCorrelation,
  type DistanceCorrelationOptions,
} from "./distance-correlation.js";
export { hoeffding, type HoeffdingOptions } from "./hoeffding.js";
export {
  jensenShannonDistance,
  jensenShannonDivergence,
  type JensenShannonOptions,
} from "./jensen-shannon.js";
export { type KendallOptions,kendallTau } from "./kendall.js";
export {
  normalizedMutualInformationBinned,
  type NormalizedMutualInformationBinnedOptions,
  normalizedMutualInformationDiscrete,
  type NormalizedMutualInformationDiscreteOptions,
} from "./mutual-information.js";

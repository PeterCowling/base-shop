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

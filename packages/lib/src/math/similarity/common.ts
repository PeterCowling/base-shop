/**
 * Shared input-validation helpers for similarity/dependence metrics.
 */

export interface SimilarityValidationOptions {
  strict?: boolean;
}

export interface PairInputRequirements {
  minLength?: number;
}

/**
 * Handles invalid-input behavior for similarity metrics.
 *
 * Default mode returns `NaN` for composition-friendly numeric workflows.
 * Strict mode throws `RangeError` with a clear diagnostic message.
 */
export function handleSimilarityValidationFailure(
  message: string,
  options?: SimilarityValidationOptions
): number {
  if (options?.strict === true) {
    throw new RangeError(message);
  }

  return Number.NaN;
}

/**
 * Validate paired numeric inputs used by pairwise similarity metrics.
 *
 * @returns Input length when valid, otherwise `NaN` (or throws in strict mode).
 */
export function validateNumericPairInputs(
  xs: ReadonlyArray<number>,
  ys: ReadonlyArray<number>,
  options?: SimilarityValidationOptions,
  requirements: PairInputRequirements = {}
): number {
  const minLength = requirements.minLength ?? 1;

  if (xs.length === 0 || ys.length === 0) {
    return handleSimilarityValidationFailure(
      "Input arrays must be non-empty",
      options
    );
  }

  if (xs.length !== ys.length) {
    return handleSimilarityValidationFailure(
      "Input arrays must have the same length",
      options
    );
  }

  if (xs.length < minLength) {
    return handleSimilarityValidationFailure(
      `Input arrays must contain at least ${minLength} values`,
      options
    );
  }

  for (let i = 0; i < xs.length; i++) {
    if (!Number.isFinite(xs[i]) || !Number.isFinite(ys[i])) {
      return handleSimilarityValidationFailure(
        "Input arrays must contain only finite numbers",
        options
      );
    }
  }

  return xs.length;
}

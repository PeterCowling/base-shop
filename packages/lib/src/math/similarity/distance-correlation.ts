import {
  handleSimilarityValidationFailure,
  type SimilarityValidationOptions,
  validateNumericPairInputs,
} from "./common";

export type DistanceCorrelationOptions = SimilarityValidationOptions;

/**
 * Distance correlation (biased estimator, 1/n^2 scaling).
 *
 * Two-pass O(n^2)-time/O(n)-memory implementation:
 * 1) row/grand means for distance matrices
 * 2) centered distance accumulation for covariance/variance terms
 */
export function distanceCorrelation(
  xs: ReadonlyArray<number>,
  ys: ReadonlyArray<number>,
  options?: DistanceCorrelationOptions
): number {
  const n = validateNumericPairInputs(xs, ys, options, { minLength: 2 });
  if (Number.isNaN(n)) {
    return Number.NaN;
  }

  const xRowSums = new Array<number>(n).fill(0);
  const yRowSums = new Array<number>(n).fill(0);
  let xGrandSum = 0;
  let yGrandSum = 0;

  for (let i = 0; i < n; i++) {
    const xi = xs[i];
    const yi = ys[i];
    for (let j = 0; j < n; j++) {
      const xDistance = Math.abs(xi - xs[j]);
      const yDistance = Math.abs(yi - ys[j]);
      xRowSums[i] += xDistance;
      yRowSums[i] += yDistance;
      xGrandSum += xDistance;
      yGrandSum += yDistance;
    }
  }

  const divisor = n * n;
  const xRowMeans = xRowSums.map((sum) => sum / n);
  const yRowMeans = yRowSums.map((sum) => sum / n);
  const xGrandMean = xGrandSum / divisor;
  const yGrandMean = yGrandSum / divisor;

  let covarianceSum = 0;
  let xVarianceSum = 0;
  let yVarianceSum = 0;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const centeredX =
        Math.abs(xs[i] - xs[j]) - xRowMeans[i] - xRowMeans[j] + xGrandMean;
      const centeredY =
        Math.abs(ys[i] - ys[j]) - yRowMeans[i] - yRowMeans[j] + yGrandMean;

      covarianceSum += centeredX * centeredY;
      xVarianceSum += centeredX * centeredX;
      yVarianceSum += centeredY * centeredY;
    }
  }

  const covarianceSquared = covarianceSum / divisor;
  const xVarianceSquared = xVarianceSum / divisor;
  const yVarianceSquared = yVarianceSum / divisor;

  if (xVarianceSquared <= Number.EPSILON || yVarianceSquared <= Number.EPSILON) {
    return handleSimilarityValidationFailure(
      "Distance variance collapsed (constant input)",
      options
    );
  }

  const denominator = Math.sqrt(xVarianceSquared * yVarianceSquared);
  if (denominator <= Number.EPSILON) {
    return handleSimilarityValidationFailure(
      "Distance correlation denominator is zero",
      options
    );
  }

  const dCorSquared = Math.max(0, covarianceSquared) / denominator;
  const dCor = Math.sqrt(Math.max(0, dCorSquared));

  return Math.min(1, dCor);
}

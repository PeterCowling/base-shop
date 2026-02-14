import {
  type SimilarityValidationOptions,
  validateNumericPairInputs,
} from "./common.js";

export type HoeffdingOptions = SimilarityValidationOptions;

/**
 * Compute Hoeffding's D dependence measure using rank statistics.
 *
 * Implementation notes:
 * - Uses deterministic midranks for ties.
 * - Uses strict `<` comparisons for Q_i counts.
 * - Reports the scaled convention `D* = 30 * D`.
 */
export function hoeffding(
  xs: ReadonlyArray<number>,
  ys: ReadonlyArray<number>,
  options?: HoeffdingOptions
): number {
  const n = validateNumericPairInputs(xs, ys, options, { minLength: 5 });
  if (Number.isNaN(n)) {
    return Number.NaN;
  }

  const xRanks = computeMidranks(xs);
  const yRanks = computeMidranks(ys);
  const qValues = computeStrictLowerLeftCounts(xs, ys);

  let d1 = 0;
  let d2 = 0;
  let d3 = 0;

  for (let i = 0; i < n; i++) {
    const r = xRanks[i];
    const s = yRanks[i];
    const q = qValues[i];

    d1 += (q - 1) * (q - 2);
    d2 += (r - 1) * (r - 2) * (s - 1) * (s - 2);
    d3 += (r - 2) * (s - 2) * (q - 1);
  }

  const numerator = (n - 2) * (n - 3) * d1 + d2 - 2 * (n - 2) * d3;
  const denominator = n * (n - 1) * (n - 2) * (n - 3) * (n - 4);

  return (30 * numerator) / denominator;
}

function computeMidranks(values: ReadonlyArray<number>): number[] {
  const indexed = values.map((value, index) => ({ index, value }));
  indexed.sort((left, right) => {
    if (left.value === right.value) {
      return left.index - right.index;
    }

    return left.value - right.value;
  });

  const ranks = new Array<number>(values.length);
  let i = 0;

  while (i < indexed.length) {
    let j = i + 1;
    while (j < indexed.length && indexed[j].value === indexed[i].value) {
      j++;
    }

    const averageRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      ranks[indexed[k].index] = averageRank;
    }

    i = j;
  }

  return ranks;
}

function computeStrictLowerLeftCounts(
  xs: ReadonlyArray<number>,
  ys: ReadonlyArray<number>
): number[] {
  const n = xs.length;
  const qValues = new Array<number>(n);

  for (let i = 0; i < n; i++) {
    let count = 0;
    for (let j = 0; j < n; j++) {
      if (xs[j] < xs[i] && ys[j] < ys[i]) {
        count++;
      }
    }

    qValues[i] = count + 1;
  }

  return qValues;
}

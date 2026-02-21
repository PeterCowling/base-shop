import {
  handleSimilarityValidationFailure,
  type SimilarityValidationOptions,
  validateNumericPairInputs,
} from "./common.js";

export type KendallOptions = SimilarityValidationOptions;

type Pair = {
  x: number;
  y: number;
};

/**
 * Kendall's tau-b rank correlation.
 *
 * O(n log n) implementation using grouped-x processing with a Fenwick tree
 * over compressed y ranks. Tie corrections follow tau-b denominator terms.
 */
export function kendallTau(
  xs: ReadonlyArray<number>,
  ys: ReadonlyArray<number>,
  options?: KendallOptions
): number {
  const n = validateNumericPairInputs(xs, ys, options, { minLength: 2 });
  if (Number.isNaN(n)) {
    return Number.NaN;
  }

  const pairs: Pair[] = xs.map((x, i) => ({ x, y: ys[i] }));
  pairs.sort((left, right) => {
    if (left.x === right.x) {
      return left.y - right.y;
    }

    return left.x - right.x;
  });

  const yRanks = compressRanks(ys);
  const yIndexByValue = new Map<number, number>();
  yRanks.forEach((value, idx) => yIndexByValue.set(value, idx + 1));

  const fenwick = new FenwickTree(yRanks.length + 2);

  let processed = 0;
  let s = 0;

  let i = 0;
  while (i < n) {
    let j = i + 1;
    while (j < n && pairs[j].x === pairs[i].x) {
      j++;
    }

    for (let k = i; k < j; k++) {
      const y = pairs[k].y;
      const rank = yIndexByValue.get(y);
      if (rank === undefined) {
        return handleSimilarityValidationFailure(
          "Unexpected y-rank compression failure",
          options
        );
      }

      const less = fenwick.query(rank - 1);
      const lessOrEqual = fenwick.query(rank);
      const greater = processed - lessOrEqual;
      s += less - greater;
    }

    for (let k = i; k < j; k++) {
      const rank = yIndexByValue.get(pairs[k].y);
      if (rank === undefined) {
        return handleSimilarityValidationFailure(
          "Unexpected y-rank compression failure",
          options
        );
      }

      fenwick.add(rank, 1);
      processed++;
    }

    i = j;
  }

  const n0 = (n * (n - 1)) / 2;
  const tieX = tiePairCount(xs);
  const tieY = tiePairCount(ys);

  const denominator = Math.sqrt((n0 - tieX) * (n0 - tieY));
  if (denominator <= Number.EPSILON) {
    return handleSimilarityValidationFailure(
      "Tau-b denominator collapsed (ties/variance issue)",
      options
    );
  }

  return s / denominator;
}

function compressRanks(values: ReadonlyArray<number>): number[] {
  const unique = Array.from(new Set(values));
  unique.sort((a, b) => a - b);
  return unique;
}

function tiePairCount(values: ReadonlyArray<number>): number {
  const counts = new Map<number, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  let pairs = 0;
  for (const count of counts.values()) {
    pairs += (count * (count - 1)) / 2;
  }

  return pairs;
}

class FenwickTree {
  private readonly tree: number[];

  constructor(size: number) {
    this.tree = new Array<number>(size).fill(0);
  }

  add(index: number, delta: number): void {
    let idx = index;
    while (idx < this.tree.length) {
      this.tree[idx] += delta;
      idx += idx & -idx;
    }
  }

  query(index: number): number {
    let idx = index;
    let sum = 0;
    while (idx > 0) {
      sum += this.tree[idx];
      idx -= idx & -idx;
    }

    return sum;
  }
}

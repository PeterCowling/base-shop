import {
  handleSimilarityValidationFailure,
  type SimilarityValidationOptions,
} from "./common";

export type JensenShannonOptions = SimilarityValidationOptions;

export function jensenShannonDivergence(
  p: ReadonlyArray<number>,
  q: ReadonlyArray<number>,
  options?: JensenShannonOptions
): number {
  const normalized = normalizeDistributions(p, q, options);
  if (normalized === null) {
    return Number.NaN;
  }

  const [pn, qn] = normalized;
  const n = pn.length;

  let divergence = 0;
  for (let i = 0; i < n; i++) {
    const m = 0.5 * (pn[i] + qn[i]);
    divergence += 0.5 * klTerm(pn[i], m) + 0.5 * klTerm(qn[i], m);
  }

  return Math.min(1, Math.max(0, divergence));
}

export function jensenShannonDistance(
  p: ReadonlyArray<number>,
  q: ReadonlyArray<number>,
  options?: JensenShannonOptions
): number {
  const divergence = jensenShannonDivergence(p, q, options);
  return Number.isNaN(divergence) ? Number.NaN : Math.sqrt(divergence);
}

function normalizeDistributions(
  p: ReadonlyArray<number>,
  q: ReadonlyArray<number>,
  options?: JensenShannonOptions
): [number[], number[]] | null {
  if (p.length === 0 || q.length === 0) {
    handleSimilarityValidationFailure(
      "Distributions must be non-empty",
      options
    );
    return null;
  }

  if (p.length !== q.length) {
    handleSimilarityValidationFailure(
      "Distributions must have the same length",
      options
    );
    return null;
  }

  let pTotal = 0;
  let qTotal = 0;

  for (let i = 0; i < p.length; i++) {
    const pv = p[i];
    const qv = q[i];

    if (!Number.isFinite(pv) || !Number.isFinite(qv)) {
      handleSimilarityValidationFailure(
        "Distributions must contain only finite numbers",
        options
      );
      return null;
    }

    if (pv < 0 || qv < 0) {
      handleSimilarityValidationFailure(
        "Distributions must not contain negative values",
        options
      );
      return null;
    }

    pTotal += pv;
    qTotal += qv;
  }

  if (pTotal <= Number.EPSILON || qTotal <= Number.EPSILON) {
    handleSimilarityValidationFailure(
      "Distribution totals must be greater than zero",
      options
    );
    return null;
  }

  const pn = p.map((value) => value / pTotal);
  const qn = q.map((value) => value / qTotal);
  return [pn, qn];
}

function klTerm(value: number, mean: number): number {
  if (value <= 0) {
    return 0;
  }

  return value * log2(value / mean);
}

function log2(value: number): number {
  return Math.log(value) / Math.LN2;
}

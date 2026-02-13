import {
  handleSimilarityValidationFailure,
  type SimilarityValidationOptions,
  validateNumericPairInputs,
} from "./common";

type DiscreteLabel = string | number | boolean;
type BinningStrategy = "equalWidth" | "quantile";

const DEFAULT_MIN_BINS = 4;
const DEFAULT_MAX_BINS = 16;
const DEFAULT_EPSILON = 1e-12;

export interface NormalizedMutualInformationDiscreteOptions
  extends SimilarityValidationOptions {
  epsilon?: number;
}

export interface NormalizedMutualInformationBinnedOptions
  extends SimilarityValidationOptions {
  bins?: number;
  binning?: BinningStrategy;
  epsilon?: number;
}

export function normalizedMutualInformationDiscrete(
  xs: ReadonlyArray<DiscreteLabel>,
  ys: ReadonlyArray<DiscreteLabel>,
  options?: NormalizedMutualInformationDiscreteOptions
): number {
  const n = validateDiscretePairInputs(xs, ys, options);
  if (Number.isNaN(n)) {
    return Number.NaN;
  }

  const xCounts = new Map<string, number>();
  const yCounts = new Map<string, number>();
  const jointCounts = new Map<string, number>();

  for (let i = 0; i < n; i++) {
    const xKey = toDiscreteKey(xs[i]);
    const yKey = toDiscreteKey(ys[i]);
    const jointKey = `${xKey}|${yKey}`;

    xCounts.set(xKey, (xCounts.get(xKey) ?? 0) + 1);
    yCounts.set(yKey, (yCounts.get(yKey) ?? 0) + 1);
    jointCounts.set(jointKey, (jointCounts.get(jointKey) ?? 0) + 1);
  }

  const hx = entropyFromCounts(xCounts, n);
  const hy = entropyFromCounts(yCounts, n);
  const mi = mutualInformationFromCounts(xCounts, yCounts, jointCounts, n);

  return normalizeMutualInformation(
    mi,
    hx,
    hy,
    xCounts.size === 1,
    yCounts.size === 1,
    options?.epsilon ?? DEFAULT_EPSILON
  );
}

export function normalizedMutualInformationBinned(
  xs: ReadonlyArray<number>,
  ys: ReadonlyArray<number>,
  options?: NormalizedMutualInformationBinnedOptions
): number {
  const n = validateNumericPairInputs(xs, ys, options, { minLength: 2 });
  if (Number.isNaN(n)) {
    return Number.NaN;
  }

  const binCount = resolveBinCount(n, options);
  if (Number.isNaN(binCount)) {
    return Number.NaN;
  }

  const strategy = options?.binning ?? "quantile";
  if (strategy !== "equalWidth" && strategy !== "quantile") {
    return handleSimilarityValidationFailure(
      "Binning strategy must be 'equalWidth' or 'quantile'",
      options
    );
  }

  const bucketizer =
    strategy === "quantile" ? bucketizeQuantile : bucketizeEqualWidth;
  const binnedXs = bucketizer(xs, binCount);
  const binnedYs = bucketizer(ys, binCount);

  return normalizedMutualInformationDiscrete(binnedXs, binnedYs, options);
}

function validateDiscretePairInputs(
  xs: ReadonlyArray<DiscreteLabel>,
  ys: ReadonlyArray<DiscreteLabel>,
  options?: SimilarityValidationOptions
): number {
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

  if (xs.length < 2) {
    return handleSimilarityValidationFailure(
      "Input arrays must contain at least 2 values",
      options
    );
  }

  for (let i = 0; i < xs.length; i++) {
    if (!isSupportedLabel(xs[i]) || !isSupportedLabel(ys[i])) {
      return handleSimilarityValidationFailure(
        "Input arrays must contain only finite numbers, strings, or booleans",
        options
      );
    }
  }

  return xs.length;
}

function isSupportedLabel(value: unknown): value is DiscreteLabel {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return typeof value === "string" || typeof value === "boolean";
}

function toDiscreteKey(value: DiscreteLabel): string {
  if (typeof value === "number") {
    return `number:${Object.is(value, -0) ? 0 : value}`;
  }

  return `${typeof value}:${value}`;
}

function entropyFromCounts(counts: Map<string, number>, total: number): number {
  let entropy = 0;
  for (const count of counts.values()) {
    if (count <= 0) {
      continue;
    }

    const p = count / total;
    entropy -= p * Math.log(p);
  }

  return entropy;
}

function mutualInformationFromCounts(
  xCounts: Map<string, number>,
  yCounts: Map<string, number>,
  jointCounts: Map<string, number>,
  total: number
): number {
  let value = 0;
  for (const [jointKey, jointCount] of jointCounts.entries()) {
    const delimiter = jointKey.indexOf("|");
    const xKey = jointKey.slice(0, delimiter);
    const yKey = jointKey.slice(delimiter + 1);

    const pxy = jointCount / total;
    const px = (xCounts.get(xKey) ?? 0) / total;
    const py = (yCounts.get(yKey) ?? 0) / total;

    if (pxy <= 0 || px <= 0 || py <= 0) {
      continue;
    }

    value += pxy * Math.log(pxy / (px * py));
  }

  return Math.max(0, value);
}

function normalizeMutualInformation(
  mi: number,
  hx: number,
  hy: number,
  xConstant: boolean,
  yConstant: boolean,
  epsilon: number
): number {
  if (hx <= epsilon && hy <= epsilon) {
    return xConstant && yConstant ? 1 : 0;
  }

  if (hx <= epsilon || hy <= epsilon) {
    return 0;
  }

  const denominator = Math.sqrt(hx * hy);
  if (denominator <= epsilon) {
    return 0;
  }

  return clamp01(mi / denominator);
}

function clamp01(value: number): number {
  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}

function resolveBinCount(
  sampleSize: number,
  options?: NormalizedMutualInformationBinnedOptions
): number {
  const requested = options?.bins;
  if (requested === undefined) {
    return clampInt(
      Math.round(Math.sqrt(sampleSize)),
      DEFAULT_MIN_BINS,
      DEFAULT_MAX_BINS
    );
  }

  if (!Number.isInteger(requested) || requested < 2) {
    return handleSimilarityValidationFailure(
      "bins must be an integer >= 2",
      options
    );
  }

  return requested;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function bucketizeEqualWidth(
  values: ReadonlyArray<number>,
  binCount: number
): number[] {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  if (!(max > min)) {
    return new Array<number>(values.length).fill(0);
  }

  const width = (max - min) / binCount;
  return values.map((value) => {
    if (value === max) {
      return binCount - 1;
    }

    const index = Math.floor((value - min) / width);
    return Math.max(0, Math.min(binCount - 1, index));
  });
}

function bucketizeQuantile(
  values: ReadonlyArray<number>,
  binCount: number
): number[] {
  if (values.length === 0) {
    return [];
  }

  const sorted = [...values].sort((a, b) => a - b);
  const edges: number[] = [];

  for (let i = 1; i < binCount; i++) {
    const rawIndex = Math.floor((i * sorted.length) / binCount);
    const edgeIndex = Math.min(sorted.length - 1, Math.max(0, rawIndex));
    edges.push(sorted[edgeIndex]);
  }

  return values.map((value) => {
    let bucket = 0;
    while (bucket < edges.length && value > edges[bucket]) {
      bucket++;
    }

    return bucket;
  });
}

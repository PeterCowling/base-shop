import { normalSample, SeededRandom } from "../random";

export interface ThompsonSamplingArm {
  alpha: number;
  beta: number;
}

export interface ThompsonSamplingOptions {
  seed?: number;
  rng?: SeededRandom;
}

export interface ThompsonSamplingResult {
  selectedArmIndex: number;
  sampledProbabilities: number[];
}

export interface ThompsonSamplingSimulationOptions {
  trueRates: readonly number[];
  trials: number;
  priorAlpha?: number;
  priorBeta?: number;
  seed?: number;
}

export interface ThompsonSamplingSimulationResult {
  bestArmIndex: number;
  bestTrueRate: number;
  posteriorArms: ThompsonSamplingArm[];
  selectionCounts: number[];
  selections: number[];
  rewards: number[];
  cumulativeRewards: number[];
  cumulativeRegret: number[];
  totalReward: number;
  finalRegret: number;
}

const DEFAULT_SEED = 42;
const DEFAULT_PRIOR_ALPHA = 1;
const DEFAULT_PRIOR_BETA = 1;

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite`);
  }
}

function assertPositive(value: number, name: string): void {
  assertFinite(value, name);
  if (value <= 0) {
    throw new RangeError(`${name} must be > 0`);
  }
}

function assertPositiveInteger(value: number, name: string): void {
  assertFinite(value, name);
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer`);
  }
}

function assertProbability(value: number, name: string): void {
  assertFinite(value, name);
  if (value < 0 || value > 1) {
    throw new RangeError(`${name} must be in [0, 1]`);
  }
}

function validateArms(arms: readonly ThompsonSamplingArm[]): void {
  if (arms.length === 0) {
    throw new RangeError("arms must contain at least one arm");
  }

  for (let i = 0; i < arms.length; i++) {
    const arm = arms[i];
    assertPositive(arm.alpha, `arms[${i}].alpha`);
    assertPositive(arm.beta, `arms[${i}].beta`);
  }
}

function sampleGamma(shape: number, rng: SeededRandom): number {
  if (shape <= 0) {
    throw new RangeError("Gamma shape must be > 0");
  }

  if (shape < 1) {
    // Boosting method: Gamma(a) = Gamma(a+1) * U^(1/a), for a < 1.
    const boosted = sampleGamma(shape + 1, rng);
    const u = Math.max(rng.next(), Number.EPSILON);
    return boosted * Math.pow(u, 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    const x = normalSample(0, 1, () => rng.next());
    const vBase = 1 + c * x;

    if (vBase <= 0) {
      continue;
    }

    const v = vBase * vBase * vBase;
    const u = rng.next();
    const x2 = x * x;

    if (u < 1 - 0.0331 * x2 * x2) {
      return d * v;
    }

    if (Math.log(Math.max(u, Number.EPSILON)) < 0.5 * x2 + d * (1 - v + Math.log(v))) {
      return d * v;
    }
  }
}

function sampleBeta(alpha: number, beta: number, rng: SeededRandom): number {
  const x = sampleGamma(alpha, rng);
  const y = sampleGamma(beta, rng);
  return x / (x + y);
}

function resolveRng(options?: ThompsonSamplingOptions): SeededRandom {
  if (!options) {
    return new SeededRandom(DEFAULT_SEED);
  }

  const { seed, rng } = options;

  if (seed !== undefined) {
    assertFinite(seed, "seed");
  }

  if (seed !== undefined && rng !== undefined) {
    throw new RangeError("Provide either seed or rng, not both");
  }

  if (rng) {
    return rng;
  }

  return new SeededRandom(seed ?? DEFAULT_SEED);
}

function selectArmWithSamples(
  arms: readonly ThompsonSamplingArm[],
  rng: SeededRandom
): ThompsonSamplingResult {
  const sampledProbabilities = arms.map((arm) => sampleBeta(arm.alpha, arm.beta, rng));
  let selectedArmIndex = 0;
  let selectedSample = sampledProbabilities[0];

  for (let i = 1; i < sampledProbabilities.length; i++) {
    if (sampledProbabilities[i] > selectedSample) {
      selectedSample = sampledProbabilities[i];
      selectedArmIndex = i;
    }
  }

  return { selectedArmIndex, sampledProbabilities };
}

export function thompsonSampling(
  arms: readonly ThompsonSamplingArm[],
  options?: ThompsonSamplingOptions
): ThompsonSamplingResult {
  validateArms(arms);
  return selectArmWithSamples(arms, resolveRng(options));
}

export function thompsonSamplingSimulation(
  options: ThompsonSamplingSimulationOptions
): ThompsonSamplingSimulationResult {
  const {
    trueRates,
    trials,
    priorAlpha = DEFAULT_PRIOR_ALPHA,
    priorBeta = DEFAULT_PRIOR_BETA,
    seed = DEFAULT_SEED,
  } = options;

  if (trueRates.length === 0) {
    throw new RangeError("trueRates must contain at least one arm");
  }

  assertPositiveInteger(trials, "trials");
  assertPositive(priorAlpha, "priorAlpha");
  assertPositive(priorBeta, "priorBeta");
  assertFinite(seed, "seed");

  for (let i = 0; i < trueRates.length; i++) {
    assertProbability(trueRates[i], `trueRates[${i}]`);
  }

  const bestTrueRate = Math.max(...trueRates);
  const bestArmIndex = trueRates.indexOf(bestTrueRate);
  const posteriorArms: ThompsonSamplingArm[] = trueRates.map(() => ({
    alpha: priorAlpha,
    beta: priorBeta,
  }));
  const selectionCounts = new Array(trueRates.length).fill(0);
  const selections: number[] = [];
  const rewards: number[] = [];
  const cumulativeRewards: number[] = [];
  const cumulativeRegret: number[] = [];
  const rng = new SeededRandom(seed);
  let totalReward = 0;
  let runningRegret = 0;

  for (let trial = 0; trial < trials; trial++) {
    const { selectedArmIndex } = selectArmWithSamples(posteriorArms, rng);
    const reward = rng.next() < trueRates[selectedArmIndex] ? 1 : 0;
    const chosenRate = trueRates[selectedArmIndex];

    posteriorArms[selectedArmIndex].alpha += reward;
    posteriorArms[selectedArmIndex].beta += 1 - reward;

    selectionCounts[selectedArmIndex] += 1;
    selections.push(selectedArmIndex);
    rewards.push(reward);

    totalReward += reward;
    runningRegret += bestTrueRate - chosenRate;
    cumulativeRewards.push(totalReward);
    cumulativeRegret.push(runningRegret);
  }

  return {
    bestArmIndex,
    bestTrueRate,
    posteriorArms,
    selectionCounts,
    selections,
    rewards,
    cumulativeRewards,
    cumulativeRegret,
    totalReward,
    finalRegret: runningRegret,
  };
}

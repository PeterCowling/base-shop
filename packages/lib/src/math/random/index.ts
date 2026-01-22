/**
 * Random - Seeded PRNG and sampling utilities
 *
 * Provides deterministic random number generation for reproducible tests,
 * weighted sampling for A/B experiments, and streaming reservoir sampling.
 *
 * Use cases:
 * - Deterministic testing (same seed = same sequence)
 * - A/B test bucket assignment (weighted random)
 * - Feature flag rollouts (consistent per-user randomization)
 * - Data sampling for analytics
 * - Shuffling for UI (e.g., carousel randomization)
 */

/**
 * Serialized state of SeededRandom for persistence.
 */
export interface SeededRandomState {
  s0: number;
  s1: number;
  s2: number;
  s3: number;
}

/**
 * Seeded pseudo-random number generator using the xoshiro128** algorithm.
 *
 * xoshiro128** is a fast, high-quality 32-bit PRNG with:
 * - Period of 2^128 - 1
 * - Excellent statistical properties
 * - Fast execution (single-cycle operations)
 *
 * Given the same seed, produces identical sequences every time.
 *
 * @see Blackman, D. & Vigna, S. (2021). "Scrambled Linear Pseudorandom Number Generators"
 *
 * @example
 * ```typescript
 * const rng = new SeededRandom(12345);
 *
 * rng.next(); // 0.7098... (always the same for seed 12345)
 * rng.next(); // 0.4312...
 *
 * rng.nextInt(1, 6); // Random integer 1-6 (like a dice roll)
 * rng.nextFloat(0, 100); // Random float 0-100
 *
 * rng.choice(['a', 'b', 'c']); // Random element
 * rng.shuffle(['a', 'b', 'c', 'd']); // In-place shuffle
 * ```
 */
export class SeededRandom {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;

  /**
   * Create a new seeded random number generator.
   *
   * @param seed - Initial seed value (will be converted to 32-bit state)
   */
  constructor(seed: number) {
    // Initialize state using a simple mixing function from the seed
    // We use multiple rounds to ensure good state distribution
    let s = seed >>> 0;

    // Use splitmix32 to initialize state from a single seed
    // This ensures good initial distribution even for sequential seeds
    s = (s + 0x9e3779b9) >>> 0;
    s = ((s ^ (s >>> 16)) * 0x85ebca6b) >>> 0;
    s = ((s ^ (s >>> 13)) * 0xc2b2ae35) >>> 0;
    this.s0 = (s ^ (s >>> 16)) >>> 0;

    s = (this.s0 + 0x9e3779b9) >>> 0;
    s = ((s ^ (s >>> 16)) * 0x85ebca6b) >>> 0;
    s = ((s ^ (s >>> 13)) * 0xc2b2ae35) >>> 0;
    this.s1 = (s ^ (s >>> 16)) >>> 0;

    s = (this.s1 + 0x9e3779b9) >>> 0;
    s = ((s ^ (s >>> 16)) * 0x85ebca6b) >>> 0;
    s = ((s ^ (s >>> 13)) * 0xc2b2ae35) >>> 0;
    this.s2 = (s ^ (s >>> 16)) >>> 0;

    s = (this.s2 + 0x9e3779b9) >>> 0;
    s = ((s ^ (s >>> 16)) * 0x85ebca6b) >>> 0;
    s = ((s ^ (s >>> 13)) * 0xc2b2ae35) >>> 0;
    this.s3 = (s ^ (s >>> 16)) >>> 0;

    // Ensure state is not all zeros (would be a fixed point)
    if (this.s0 === 0 && this.s1 === 0 && this.s2 === 0 && this.s3 === 0) {
      this.s0 = 1;
    }
  }

  /**
   * Generate the next random number in [0, 1).
   *
   * @returns A random number between 0 (inclusive) and 1 (exclusive)
   *
   * @example
   * ```typescript
   * const rng = new SeededRandom(42);
   * const value = rng.next(); // 0.0 <= value < 1.0
   * ```
   */
  next(): number {
    // xoshiro128** algorithm
    const result = Math.imul(rotl(Math.imul(this.s1, 5), 7), 9) >>> 0;

    const t = (this.s1 << 9) >>> 0;

    this.s2 ^= this.s0;
    this.s3 ^= this.s1;
    this.s1 ^= this.s2;
    this.s0 ^= this.s3;

    this.s2 ^= t;
    this.s3 = rotl(this.s3, 11);

    // Convert to [0, 1) range
    return result / 4294967296;
  }

  /**
   * Generate a random integer in [min, max] (inclusive).
   *
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   * @returns A random integer between min and max
   *
   * @example
   * ```typescript
   * const rng = new SeededRandom(42);
   * const dice = rng.nextInt(1, 6); // 1, 2, 3, 4, 5, or 6
   * const coin = rng.nextInt(0, 1); // 0 or 1
   * ```
   */
  nextInt(min: number, max: number): number {
    min = Math.floor(min);
    max = Math.floor(max);
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate a random float in [min, max).
   *
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (exclusive)
   * @returns A random float between min and max
   *
   * @example
   * ```typescript
   * const rng = new SeededRandom(42);
   * const temp = rng.nextFloat(20.0, 30.0); // Temperature between 20 and 30
   * ```
   */
  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Generate a random boolean.
   *
   * @param probability - Probability of returning true (default: 0.5)
   * @returns true with the given probability
   *
   * @example
   * ```typescript
   * const rng = new SeededRandom(42);
   * const coin = rng.nextBoolean(); // 50% chance of true
   * const biased = rng.nextBoolean(0.7); // 70% chance of true
   * ```
   */
  nextBoolean(probability = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Shuffle an array in-place using Fisher-Yates algorithm.
   *
   * @param array - The array to shuffle (modified in-place)
   * @returns The same array, shuffled
   *
   * @example
   * ```typescript
   * const rng = new SeededRandom(42);
   * const deck = [1, 2, 3, 4, 5];
   * rng.shuffle(deck); // deck is now shuffled
   * ```
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  /**
   * Return a shuffled copy of an array (original unchanged).
   *
   * @param array - The array to shuffle
   * @returns A new shuffled array
   *
   * @example
   * ```typescript
   * const rng = new SeededRandom(42);
   * const original = [1, 2, 3, 4, 5];
   * const shuffled = rng.shuffled(original);
   * // original is unchanged, shuffled is a new array
   * ```
   */
  shuffled<T>(array: readonly T[]): T[] {
    return this.shuffle([...array]);
  }

  /**
   * Sample n elements from an array without replacement.
   *
   * Uses Fisher-Yates partial shuffle for efficiency when n << array.length.
   *
   * @param array - The array to sample from
   * @param n - Number of elements to sample
   * @returns Array of n randomly selected elements
   * @throws Error if n > array.length
   *
   * @example
   * ```typescript
   * const rng = new SeededRandom(42);
   * const winners = rng.sample(['Alice', 'Bob', 'Carol', 'Dave', 'Eve'], 3);
   * // winners contains 3 random unique names
   * ```
   */
  sample<T>(array: readonly T[], n: number): T[] {
    if (n > array.length) {
      throw new Error("Sample size cannot exceed array length");
    }
    if (n <= 0) return [];

    // Copy array for partial shuffle
    const copy = [...array];
    const result: T[] = [];

    for (let i = 0; i < n; i++) {
      const j = this.nextInt(i, copy.length - 1);
      // Swap
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
      result.push(copy[i]);
    }

    return result;
  }

  /**
   * Choose a random element from an array.
   *
   * @param array - The array to choose from
   * @returns A random element
   * @throws Error if array is empty
   *
   * @example
   * ```typescript
   * const rng = new SeededRandom(42);
   * const color = rng.choice(['red', 'green', 'blue']);
   * ```
   */
  choice<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error("Cannot choose from empty array");
    }
    return array[this.nextInt(0, array.length - 1)];
  }

  /**
   * Choose a random element based on weights.
   *
   * @param items - Array of items to choose from
   * @param weights - Array of weights (must be same length as items, all non-negative)
   * @returns A random item, with probability proportional to its weight
   * @throws Error if arrays are empty or have different lengths, or if all weights are zero
   *
   * @example
   * ```typescript
   * const rng = new SeededRandom(42);
   *
   * // 'common' is 10x more likely than 'rare'
   * const item = rng.weightedChoice(
   *   ['common', 'uncommon', 'rare'],
   *   [10, 5, 1]
   * );
   * ```
   */
  weightedChoice<T>(items: readonly T[], weights: number[]): T {
    if (items.length === 0) {
      throw new Error("Cannot choose from empty array");
    }
    if (items.length !== weights.length) {
      throw new Error("Items and weights must have the same length");
    }

    const totalWeight = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
    if (totalWeight === 0) {
      throw new Error("Total weight must be positive");
    }

    let target = this.next() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      target -= Math.max(0, weights[i]);
      if (target <= 0) {
        return items[i];
      }
    }

    // Fallback (should not happen with valid weights)
    return items[items.length - 1];
  }

  /**
   * Create an independent child RNG (fork).
   *
   * Useful for creating separate random streams that don't affect each other.
   *
   * @returns A new SeededRandom instance with state derived from this one
   *
   * @example
   * ```typescript
   * const rng = new SeededRandom(42);
   * const childRng = rng.fork();
   * // rng and childRng now have independent state
   * ```
   */
  fork(): SeededRandom {
    // Use next values to seed a new generator
    const seed = Math.floor(this.next() * 4294967296);
    return new SeededRandom(seed);
  }

  /**
   * Serialize the RNG state for persistence.
   *
   * @returns State object that can be JSON serialized
   */
  serialize(): SeededRandomState {
    return {
      s0: this.s0,
      s1: this.s1,
      s2: this.s2,
      s3: this.s3,
    };
  }

  /**
   * Deserialize a previously saved RNG state.
   *
   * @param state - State object from serialize()
   * @returns Restored SeededRandom instance
   */
  static deserialize(state: SeededRandomState): SeededRandom {
    const rng = Object.create(SeededRandom.prototype) as SeededRandom;
    rng.s0 = state.s0 >>> 0;
    rng.s1 = state.s1 >>> 0;
    rng.s2 = state.s2 >>> 0;
    rng.s3 = state.s3 >>> 0;
    return rng;
  }
}

/**
 * Rotate left (circular shift) for 32-bit integer.
 */
function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

/**
 * Reservoir sampler for streaming uniform sampling.
 *
 * Maintains a fixed-size random sample from a stream of unknown length.
 * Each item has an equal probability of being in the final sample.
 *
 * Uses Algorithm R (Vitter, 1985) for O(1) time per item.
 *
 * @example
 * ```typescript
 * // Sample 5 items from a stream of unknown length
 * const sampler = new ReservoirSampler<string>(5, 42);
 *
 * for (const line of readLines(largeFile)) {
 *   sampler.push(line);
 * }
 *
 * const sample = sampler.getSample(); // 5 random lines
 * ```
 */
export class ReservoirSampler<T> {
  private readonly reservoir: T[] = [];
  private readonly k: number;
  private readonly rng: SeededRandom;
  private n: number = 0;

  /**
   * Create a new reservoir sampler.
   *
   * @param k - Maximum sample size
   * @param seed - Optional seed for reproducibility
   */
  constructor(k: number, seed?: number) {
    if (k < 1 || !Number.isInteger(k)) {
      throw new Error("Sample size k must be a positive integer");
    }
    this.k = k;
    this.rng = new SeededRandom(seed ?? Date.now());
  }

  /**
   * Add an item to the stream.
   *
   * If the reservoir is not full, the item is always added.
   * Otherwise, the item replaces a random existing item with probability k/n.
   *
   * @param item - The item to potentially include in the sample
   */
  push(item: T): void {
    this.n++;

    if (this.reservoir.length < this.k) {
      // Reservoir not full, add directly
      this.reservoir.push(item);
    } else {
      // Reservoir full, replace with probability k/n
      const j = this.rng.nextInt(0, this.n - 1);
      if (j < this.k) {
        this.reservoir[j] = item;
      }
    }
  }

  /**
   * Get the current sample.
   *
   * @returns Copy of the current reservoir contents
   */
  getSample(): T[] {
    return [...this.reservoir];
  }

  /**
   * Number of items seen so far.
   */
  get count(): number {
    return this.n;
  }

  /**
   * Current size of the reservoir (may be less than k if fewer items seen).
   */
  get size(): number {
    return this.reservoir.length;
  }

  /**
   * Reset the sampler, clearing the reservoir.
   */
  reset(): void {
    this.reservoir.length = 0;
    this.n = 0;
  }
}

/**
 * Hash a string to a 32-bit unsigned integer using FNV-1a algorithm.
 *
 * FNV-1a (Fowler-Noll-Vo) is a fast, non-cryptographic hash function with
 * good distribution properties. Useful for generating seeds from strings.
 *
 * @param input - String to hash
 * @returns 32-bit unsigned integer hash
 *
 * @example
 * ```typescript
 * // Create deterministic RNG from a user ID
 * const userSeed = hashSeed('user-123');
 * const rng = new SeededRandom(userSeed);
 *
 * // Same user always gets the same "random" experience
 * const variant = rng.choice(['A', 'B', 'C']);
 * ```
 */
export function hashSeed(input: string): number {
  // FNV-1a 32-bit constants
  let hash = 2166136261; // FNV offset basis

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime
  }

  return hash >>> 0; // Ensure unsigned 32-bit
}

/**
 * Generate a random sample from a normal (Gaussian) distribution.
 *
 * Uses the Box-Muller transform for generating normally-distributed values.
 *
 * @param avg - Mean of the distribution (default: 0)
 * @param std - Standard deviation of the distribution (default: 1)
 * @param rng - Optional random number generator function returning [0, 1)
 * @returns A normally-distributed random value
 *
 * @example
 * ```typescript
 * const rng = new SeededRandom(42);
 *
 * // Generate heights with mean 170cm and stddev 10cm
 * const height = normalSample(170, 10, () => rng.next());
 * ```
 */
export function normalSample(
  avg = 0,
  std = 1,
  rng: () => number = Math.random
): number {
  // Box-Muller transform
  let u1 = 0;
  let u2 = 0;

  // Avoid log(0)
  do {
    u1 = rng();
  } while (u1 === 0);
  u2 = rng();

  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * std + avg;
}

/**
 * Generate a random sample from an exponential distribution.
 *
 * @param lambda - Rate parameter (1/mean)
 * @param rng - Optional random number generator function returning [0, 1)
 * @returns An exponentially-distributed random value
 *
 * @example
 * ```typescript
 * const rng = new SeededRandom(42);
 *
 * // Generate inter-arrival times with mean of 5 seconds
 * const waitTime = exponentialSample(1/5, () => rng.next());
 * ```
 */
export function exponentialSample(
  lambda: number,
  rng: () => number = Math.random
): number {
  if (lambda <= 0) {
    throw new Error("Lambda must be positive");
  }

  let u = 0;
  // Avoid log(0)
  do {
    u = rng();
  } while (u === 0);

  return -Math.log(u) / lambda;
}

/**
 * Generate a random sample from a Poisson distribution.
 *
 * Uses the inverse transform method for small lambda, and the
 * normal approximation for large lambda.
 *
 * @param lambda - Mean (and variance) of the distribution
 * @param rng - Optional random number generator function returning [0, 1)
 * @returns A Poisson-distributed random integer
 *
 * @example
 * ```typescript
 * const rng = new SeededRandom(42);
 *
 * // Generate number of customer arrivals per hour (mean = 10)
 * const arrivals = poissonSample(10, () => rng.next());
 * ```
 */
export function poissonSample(
  lambda: number,
  rng: () => number = Math.random
): number {
  if (lambda <= 0) {
    throw new Error("Lambda must be positive");
  }

  // For large lambda, use normal approximation
  if (lambda > 30) {
    return Math.max(0, Math.round(normalSample(lambda, Math.sqrt(lambda), rng)));
  }

  // For small lambda, use inverse transform method
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;

  do {
    k++;
    p *= rng();
  } while (p > L);

  return k - 1;
}

/**
 * Generate a random sample from a uniform distribution.
 *
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 * @param rng - Optional random number generator function returning [0, 1)
 * @returns A uniformly-distributed random value in [min, max)
 *
 * @example
 * ```typescript
 * const rng = new SeededRandom(42);
 *
 * // Generate a random angle in radians
 * const angle = uniformSample(0, 2 * Math.PI, () => rng.next());
 * ```
 */
export function uniformSample(
  min: number,
  max: number,
  rng: () => number = Math.random
): number {
  return min + rng() * (max - min);
}

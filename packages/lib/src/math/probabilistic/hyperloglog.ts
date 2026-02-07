/**
 * HyperLogLog - Probabilistic cardinality estimation
 *
 * HyperLogLog is a probabilistic algorithm for estimating the number of
 * distinct elements (cardinality) in a multiset. It uses very little memory
 * while providing accurate estimates with known error bounds.
 *
 * Use cases:
 * - Unique visitor counts without storing all IDs
 * - Distinct product views per session
 * - Approximate set union size across shards
 *
 * @see Flajolet et al., "HyperLogLog: the analysis of a near-optimal cardinality estimation algorithm"
 */

/**
 * Configuration options for HyperLogLog
 */
export interface HyperLogLogOptions {
  /**
   * Precision parameter (4-18). Higher precision = more accuracy but more memory.
   * - 4: 16 registers, ~26% error
   * - 10: 1024 registers, ~3.25% error
   * - 14: 16384 registers, ~0.81% error (default)
   * - 18: 262144 registers, ~0.2% error
   *
   * Memory usage: 2^precision bytes (using 8-bit registers for simplicity)
   * @default 14
   */
  precision?: number;
}

/**
 * MurmurHash3 32-bit implementation
 * Fast, non-cryptographic hash function with good distribution
 */
function murmurHash3(key: string, seed: number = 0): number {
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  const r1 = 15;
  const r2 = 13;
  const m = 5;
  const n = 0xe6546b64;

  let hash = seed >>> 0;
  const len = key.length;

  const nblocks = Math.floor(len / 4);
  for (let i = 0; i < nblocks; i++) {
    let k =
      (key.charCodeAt(i * 4) & 0xff) |
      ((key.charCodeAt(i * 4 + 1) & 0xff) << 8) |
      ((key.charCodeAt(i * 4 + 2) & 0xff) << 16) |
      ((key.charCodeAt(i * 4 + 3) & 0xff) << 24);

    k = Math.imul(k, c1);
    k = (k << r1) | (k >>> (32 - r1));
    k = Math.imul(k, c2);

    hash ^= k;
    hash = (hash << r2) | (hash >>> (32 - r2));
    hash = Math.imul(hash, m) + n;
  }

  let k = 0;
  const remainder = len & 3;
  const tailIndex = nblocks * 4;

  if (remainder >= 3) k ^= (key.charCodeAt(tailIndex + 2) & 0xff) << 16;
  if (remainder >= 2) k ^= (key.charCodeAt(tailIndex + 1) & 0xff) << 8;
  if (remainder >= 1) {
    k ^= key.charCodeAt(tailIndex) & 0xff;
    k = Math.imul(k, c1);
    k = (k << r1) | (k >>> (32 - r1));
    k = Math.imul(k, c2);
    hash ^= k;
  }

  hash ^= len;
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;

  return hash >>> 0;
}

/**
 * Generate a 64-bit hash using two 32-bit hashes
 * Returns as two 32-bit numbers [high, low]
 */
function hash64(key: string): [number, number] {
  const h1 = murmurHash3(key, 0);
  const h2 = murmurHash3(key, h1);
  return [h1, h2];
}

/**
 * Count leading zeros in the low 32 bits, starting from bit position `startBit`
 * @param hash The hash value
 * @param startBit The bit position to start counting from (0-31)
 * @returns Number of leading zeros + 1 (rho function)
 */
function countLeadingZeros(hashLow: number, hashHigh: number, bitsUsed: number): number {
  // We use bits after the index bits for the rho calculation
  // Combine remaining bits from both hash parts
  const remainingBits = 64 - bitsUsed;

  // Create a mask for the bits we care about
  let zeros = 1;

  // Check bits from hashLow first (after index bits)
  const lowBitsToCheck = Math.min(32 - bitsUsed, remainingBits);
  for (let i = 0; i < lowBitsToCheck; i++) {
    const bitPos = bitsUsed + i;
    if ((hashLow & (1 << bitPos)) !== 0) {
      return zeros;
    }
    zeros++;
  }

  // Then check bits from hashHigh
  const highBitsToCheck = remainingBits - lowBitsToCheck;
  for (let i = 0; i < highBitsToCheck; i++) {
    if ((hashHigh & (1 << i)) !== 0) {
      return zeros;
    }
    zeros++;
  }

  return zeros;
}

/**
 * Alpha constant for bias correction based on register count
 */
function getAlpha(m: number): number {
  if (m === 16) return 0.673;
  if (m === 32) return 0.697;
  if (m === 64) return 0.709;
  return 0.7213 / (1 + 1.079 / m);
}

/**
 * HyperLogLog cardinality estimator
 *
 * @example
 * ```typescript
 * const hll = new HyperLogLog({ precision: 14 });
 *
 * // Add items
 * hll.add('user-123');
 * hll.add('user-456');
 * hll.add('user-123'); // Duplicates don't increase count
 *
 * // Get estimated count
 * console.log(hll.count()); // ~2
 *
 * // Merge from multiple sources
 * const hll2 = new HyperLogLog({ precision: 14 });
 * hll2.add('user-789');
 * const merged = hll.merge(hll2);
 * console.log(merged.count()); // ~3
 * ```
 */
export class HyperLogLog {
  private readonly _precision: number;
  private readonly _registerCount: number;
  private readonly registers: Uint8Array;

  /**
   * Creates a new HyperLogLog estimator
   *
   * @param options Configuration options
   * @throws Error if precision is outside valid range [4, 18]
   */
  constructor(options?: HyperLogLogOptions) {
    const precision = options?.precision ?? 14;

    if (precision < 4 || precision > 18) {
      throw new Error("Precision must be between 4 and 18");
    }

    this._precision = precision;
    this._registerCount = 1 << precision; // 2^precision
    this.registers = new Uint8Array(this._registerCount);
  }

  /**
   * Private constructor for deserialization and merging
   */
  private static fromRegisters(
    precision: number,
    registers: Uint8Array
  ): HyperLogLog {
    const hll = Object.create(HyperLogLog.prototype) as HyperLogLog;
    (hll as unknown as { _precision: number })._precision = precision;
    (hll as unknown as { _registerCount: number })._registerCount = 1 << precision;
    (hll as unknown as { registers: Uint8Array }).registers = registers;
    return hll;
  }

  /**
   * Adds an item to the HyperLogLog
   *
   * @param item The item to add (will be hashed)
   */
  add(item: string): void {
    const [hashLow, hashHigh] = hash64(item);

    // Use first `precision` bits as register index
    const index = hashLow & (this._registerCount - 1);

    // Count leading zeros in remaining bits (rho function)
    const rho = countLeadingZeros(hashLow, hashHigh, this._precision);

    // Update register if new value is larger
    if (rho > this.registers[index]) {
      this.registers[index] = rho;
    }
  }

  /**
   * Estimates the cardinality (number of distinct items)
   *
   * Uses the HyperLogLog++ algorithm with bias correction for small
   * and large cardinalities.
   *
   * @returns Estimated number of distinct items added
   */
  count(): number {
    const m = this._registerCount;
    const alpha = getAlpha(m);

    // Calculate harmonic mean
    let sum = 0;
    let zeros = 0;

    for (let i = 0; i < m; i++) {
      sum += Math.pow(2, -this.registers[i]);
      if (this.registers[i] === 0) {
        zeros++;
      }
    }

    // Raw estimate
    let estimate = (alpha * m * m) / sum;

    // 2^32 as a constant (can't use bit shift for 32 bits in JS)
    const TWO_POW_32 = 4294967296;

    // Small range correction (linear counting)
    if (estimate <= 2.5 * m && zeros > 0) {
      estimate = m * Math.log(m / zeros);
    }
    // Large range correction (for 32-bit hash space)
    // Only apply if estimate is very large relative to hash space
    else if (estimate > TWO_POW_32 / 30) {
      const ratio = estimate / TWO_POW_32;
      if (ratio < 1) {
        estimate = -TWO_POW_32 * Math.log(1 - ratio);
      }
      // If ratio >= 1, keep the raw estimate (saturated)
    }

    return Math.round(estimate);
  }

  /**
   * Merges another HyperLogLog into this one and returns a new instance
   *
   * Both HLLs must have the same precision.
   *
   * @param other The HyperLogLog to merge with
   * @returns A new HyperLogLog containing the union
   * @throws Error if precisions don't match
   */
  merge(other: HyperLogLog): HyperLogLog {
    if (this._precision !== other._precision) {
      throw new Error(
        `Cannot merge HyperLogLogs with different precisions: ${this._precision} vs ${other._precision}`
      );
    }

    const merged = new Uint8Array(this._registerCount);
    for (let i = 0; i < this._registerCount; i++) {
      merged[i] = Math.max(this.registers[i], other.registers[i]);
    }

    return HyperLogLog.fromRegisters(this._precision, merged);
  }

  /**
   * Merges multiple HyperLogLogs into one
   *
   * All HLLs must have the same precision.
   *
   * @param hlls Array of HyperLogLogs to merge
   * @returns A new HyperLogLog containing the union of all inputs
   * @throws Error if array is empty or precisions don't match
   */
  static union(hlls: HyperLogLog[]): HyperLogLog {
    if (hlls.length === 0) {
      throw new Error("Cannot create union of empty array");
    }

    const precision = hlls[0]._precision;
    const registerCount = hlls[0]._registerCount;

    for (let i = 1; i < hlls.length; i++) {
      if (hlls[i]._precision !== precision) {
        throw new Error(
          `All HyperLogLogs must have the same precision. Found ${hlls[i]._precision}, expected ${precision}`
        );
      }
    }

    const merged = new Uint8Array(registerCount);
    for (let i = 0; i < registerCount; i++) {
      let max = 0;
      for (const hll of hlls) {
        if (hll.registers[i] > max) {
          max = hll.registers[i];
        }
      }
      merged[i] = max;
    }

    return HyperLogLog.fromRegisters(precision, merged);
  }

  /**
   * Serializes the HyperLogLog to a Uint8Array
   *
   * Format:
   * - Byte 0: precision (uint8)
   * - Bytes 1+: registers
   *
   * @returns Serialized data
   */
  serialize(): Uint8Array {
    const result = new Uint8Array(1 + this._registerCount);
    result[0] = this._precision;
    result.set(this.registers, 1);
    return result;
  }

  /**
   * Deserializes a HyperLogLog from a Uint8Array
   *
   * @param data Serialized data from serialize()
   * @returns Restored HyperLogLog instance
   * @throws Error if data is invalid
   */
  static deserialize(data: Uint8Array): HyperLogLog {
    if (data.length < 2) {
      throw new Error("Invalid serialized data: too short");
    }

    const precision = data[0];
    if (precision < 4 || precision > 18) {
      throw new Error(`Invalid precision in serialized data: ${precision}`);
    }

    const expectedLength = 1 + (1 << precision);
    if (data.length !== expectedLength) {
      throw new Error(
        `Invalid serialized data length: expected ${expectedLength}, got ${data.length}`
      );
    }

    const registers = new Uint8Array(1 << precision);
    registers.set(data.subarray(1));

    return HyperLogLog.fromRegisters(precision, registers);
  }

  /**
   * The precision parameter (4-18)
   */
  get precision(): number {
    return this._precision;
  }

  /**
   * Number of registers (2^precision)
   */
  get registerCount(): number {
    return this._registerCount;
  }

  /**
   * Theoretical standard error: 1.04 / sqrt(registerCount)
   *
   * For precision 14: ~0.81%
   */
  get standardError(): number {
    return 1.04 / Math.sqrt(this._registerCount);
  }
}

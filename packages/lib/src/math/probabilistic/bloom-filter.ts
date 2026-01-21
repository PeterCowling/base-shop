/**
 * Bloom Filter - Probabilistic set membership data structure
 *
 * A Bloom filter is a space-efficient probabilistic data structure that tests
 * whether an element is a member of a set. False positive matches are possible,
 * but false negatives are not.
 *
 * Use cases:
 * - Negative caching: avoid expensive cache-miss lookups
 * - Existence checks across shards without full lookup
 * - Rate limiter pre-check ("has this IP been seen recently?")
 *
 * @see Bloom, B. H. (1970). "Space/Time Trade-offs in Hash Coding with Allowable Errors"
 */

/**
 * Configuration options for creating a Bloom filter
 */
export interface BloomFilterOptions {
  /** Expected number of items to be stored */
  expectedItems: number;
  /** Target false positive rate (e.g., 0.01 for 1%) */
  falsePositiveRate: number;
}

/**
 * MurmurHash3 32-bit implementation
 * Fast, non-cryptographic hash function suitable for Bloom filters
 *
 * @param key - String to hash
 * @param seed - Seed value for hash variation
 * @returns 32-bit unsigned integer hash
 */
function murmurHash3(key: string, seed: number): number {
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  const r1 = 15;
  const r2 = 13;
  const m = 5;
  const n = 0xe6546b64;

  let hash = seed >>> 0;
  const len = key.length;

  // Process 4-byte chunks
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

  // Process remaining bytes
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

  // Finalization
  hash ^= len;
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;

  return hash >>> 0;
}

/**
 * Calculate optimal Bloom filter parameters
 *
 * @param n - Expected number of items
 * @param p - Target false positive rate
 * @returns Optimal bit array size and hash count
 */
function calculateOptimalParameters(
  n: number,
  p: number
): { bitSize: number; hashCount: number } {
  // m = -n * ln(p) / (ln(2))^2
  const ln2Squared = Math.LN2 * Math.LN2;
  const bitSize = Math.ceil((-n * Math.log(p)) / ln2Squared);

  // k = (m/n) * ln(2)
  const hashCount = Math.max(1, Math.round((bitSize / n) * Math.LN2));

  return { bitSize, hashCount };
}

/**
 * A space-efficient probabilistic data structure for set membership testing.
 *
 * @example
 * ```typescript
 * const filter = new BloomFilter({ expectedItems: 1000, falsePositiveRate: 0.01 });
 *
 * filter.add('user-123');
 * filter.add('user-456');
 *
 * filter.mightContain('user-123'); // true (definitely or probably in set)
 * filter.mightContain('user-789'); // false (definitely not in set) or true (false positive)
 * ```
 */
export class BloomFilter {
  private readonly bitArray: Uint8Array;
  private readonly _size: number;
  private readonly _hashCount: number;
  private _itemCount: number = 0;
  private _bitsSet: number = 0;

  /**
   * Creates a new Bloom filter with optimal parameters for the given configuration.
   *
   * @param options - Configuration specifying expected items and target false positive rate
   * @throws Error if expectedItems is not positive or falsePositiveRate is not in (0, 1)
   */
  constructor(options: BloomFilterOptions) {
    if (options.expectedItems <= 0) {
      throw new Error("expectedItems must be a positive number");
    }
    if (options.falsePositiveRate <= 0 || options.falsePositiveRate >= 1) {
      throw new Error("falsePositiveRate must be between 0 and 1 (exclusive)");
    }

    const { bitSize, hashCount } = calculateOptimalParameters(
      options.expectedItems,
      options.falsePositiveRate
    );

    this._size = bitSize;
    this._hashCount = hashCount;
    // Allocate byte array (8 bits per byte)
    this.bitArray = new Uint8Array(Math.ceil(bitSize / 8));
  }

  /**
   * Private constructor for deserialization
   */
  private static fromInternal(
    bitArray: Uint8Array,
    size: number,
    hashCount: number,
    itemCount: number,
    bitsSet: number
  ): BloomFilter {
    const filter = Object.create(BloomFilter.prototype) as BloomFilter;
    (filter as unknown as { bitArray: Uint8Array }).bitArray = bitArray;
    (filter as unknown as { _size: number })._size = size;
    (filter as unknown as { _hashCount: number })._hashCount = hashCount;
    (filter as unknown as { _itemCount: number })._itemCount = itemCount;
    (filter as unknown as { _bitsSet: number })._bitsSet = bitsSet;
    return filter;
  }

  /**
   * Adds an item to the Bloom filter.
   *
   * @param item - The item to add
   */
  add(item: string): void {
    const positions = this.getHashPositions(item);
    let newBitsSet = false;

    for (const pos of positions) {
      const byteIndex = Math.floor(pos / 8);
      const bitIndex = pos % 8;
      const mask = 1 << bitIndex;

      if ((this.bitArray[byteIndex] & mask) === 0) {
        this.bitArray[byteIndex] |= mask;
        this._bitsSet++;
        newBitsSet = true;
      }
    }

    // Only increment item count if at least one bit was newly set
    // This is an approximation since we can't know for sure if it's a new item
    if (newBitsSet) {
      this._itemCount++;
    }
  }

  /**
   * Tests whether an item might be in the set.
   *
   * - Returns `false`: The item is **definitely not** in the set.
   * - Returns `true`: The item **might be** in the set (could be a false positive).
   *
   * @param item - The item to test
   * @returns `true` if the item might be in the set, `false` if definitely not
   */
  mightContain(item: string): boolean {
    const positions = this.getHashPositions(item);

    for (const pos of positions) {
      const byteIndex = Math.floor(pos / 8);
      const bitIndex = pos % 8;
      const mask = 1 << bitIndex;

      if ((this.bitArray[byteIndex] & mask) === 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Serializes the Bloom filter to a Uint8Array for persistence.
   *
   * Format:
   * - Bytes 0-3: size (32-bit LE)
   * - Bytes 4-5: hashCount (16-bit LE)
   * - Bytes 6-9: itemCount (32-bit LE)
   * - Bytes 10-13: bitsSet (32-bit LE)
   * - Bytes 14+: bit array
   *
   * @returns Serialized filter data
   */
  serialize(): Uint8Array {
    const headerSize = 14;
    const result = new Uint8Array(headerSize + this.bitArray.length);
    const view = new DataView(result.buffer);

    view.setUint32(0, this._size, true);
    view.setUint16(4, this._hashCount, true);
    view.setUint32(6, this._itemCount, true);
    view.setUint32(10, this._bitsSet, true);
    result.set(this.bitArray, headerSize);

    return result;
  }

  /**
   * Deserializes a Bloom filter from a Uint8Array.
   *
   * @param data - Serialized filter data from `serialize()`
   * @returns Restored BloomFilter instance
   * @throws Error if data is invalid or corrupted
   */
  static deserialize(data: Uint8Array): BloomFilter {
    if (data.length < 14) {
      throw new Error("Invalid serialized data: too short");
    }

    const view = new DataView(
      data.buffer,
      data.byteOffset,
      data.byteLength
    );

    const size = view.getUint32(0, true);
    const hashCount = view.getUint16(4, true);
    const itemCount = view.getUint32(6, true);
    const bitsSet = view.getUint32(10, true);

    const expectedByteLength = Math.ceil(size / 8);
    if (data.length !== 14 + expectedByteLength) {
      throw new Error("Invalid serialized data: incorrect length");
    }

    const bitArray = new Uint8Array(expectedByteLength);
    bitArray.set(data.subarray(14));

    return BloomFilter.fromInternal(bitArray, size, hashCount, itemCount, bitsSet);
  }

  /**
   * Bit array size (total number of bits)
   */
  get size(): number {
    return this._size;
  }

  /**
   * Number of hash functions used
   */
  get hashCount(): number {
    return this._hashCount;
  }

  /**
   * Approximate number of items added
   *
   * Note: This may overcount if items were added multiple times,
   * and undercounts if many hash collisions occurred.
   */
  get itemCount(): number {
    return this._itemCount;
  }

  /**
   * Ratio of bits set to total bits (0 to 1)
   *
   * A filter with fillRatio approaching 1 has degraded false positive performance.
   */
  get fillRatio(): number {
    return this._bitsSet / this._size;
  }

  /**
   * Estimates the current false positive rate based on fill ratio.
   *
   * @returns Estimated false positive probability
   */
  get estimatedFalsePositiveRate(): number {
    // FP rate = (1 - e^(-kn/m))^k ≈ (bitsSet/size)^k
    return Math.pow(this.fillRatio, this._hashCount);
  }

  /**
   * Generate k hash positions using double hashing technique
   * h_i(x) = (h1(x) + i * h2(x)) mod m
   *
   * This is more efficient than computing k independent hashes.
   */
  private getHashPositions(item: string): number[] {
    const h1 = murmurHash3(item, 0);
    const h2 = murmurHash3(item, h1);

    const positions: number[] = [];
    for (let i = 0; i < this._hashCount; i++) {
      // Ensure positive modulo
      const pos = ((h1 + i * h2) % this._size + this._size) % this._size;
      positions.push(pos);
    }

    return positions;
  }
}

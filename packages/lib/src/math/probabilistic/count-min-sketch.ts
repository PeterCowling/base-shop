/**
 * Count-Min Sketch - Probabilistic frequency estimation
 *
 * A Count-Min Sketch is a probabilistic data structure that serves as a
 * frequency table of events in a stream of data. It uses hash functions
 * to map events to frequencies, but unlike a hash table uses only sub-linear
 * space, at the expense of over-counting some events due to collisions.
 *
 * Use cases:
 * - "Trending now" product list
 * - Hot search terms
 * - Real-time popularity scoring
 *
 * @see Cormode & Muthukrishnan, "An Improved Data Stream Summary: The Count-Min Sketch"
 */

/**
 * Configuration options for Count-Min Sketch
 */
export interface CountMinSketchOptions {
  /** Number of columns (higher = more accurate). Determines error rate ε = e/width */
  width: number;
  /** Number of rows/hash functions (higher = lower probability of error). Probability = (1/2)^depth */
  depth: number;
  /** EWMA decay factor applied per decay() call. E.g., 0.99 means 1% decay per interval */
  decayFactor?: number;
}

/**
 * MurmurHash3 32-bit implementation
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
 * Min-heap for efficient top-K tracking
 */
class MinHeap<T> {
  private heap: Array<{ key: T; value: number }> = [];

  get size(): number {
    return this.heap.length;
  }

  peek(): { key: T; value: number } | undefined {
    return this.heap[0];
  }

  push(key: T, value: number): void {
    this.heap.push({ key, value });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): { key: T; value: number } | undefined {
    if (this.heap.length === 0) return undefined;
    const result = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return result;
  }

  replaceMin(key: T, value: number): { key: T; value: number } | undefined {
    if (this.heap.length === 0) return undefined;
    const result = this.heap[0];
    this.heap[0] = { key, value };
    this.bubbleDown(0);
    return result;
  }

  toArray(): Array<{ key: T; value: number }> {
    return [...this.heap].sort((a, b) => b.value - a.value);
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].value <= this.heap[index].value) break;
      [this.heap[parentIndex], this.heap[index]] = [
        this.heap[index],
        this.heap[parentIndex],
      ];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (
        leftChild < this.heap.length &&
        this.heap[leftChild].value < this.heap[smallest].value
      ) {
        smallest = leftChild;
      }
      if (
        rightChild < this.heap.length &&
        this.heap[rightChild].value < this.heap[smallest].value
      ) {
        smallest = rightChild;
      }

      if (smallest === index) break;

      [this.heap[index], this.heap[smallest]] = [
        this.heap[smallest],
        this.heap[index],
      ];
      index = smallest;
    }
  }
}

/**
 * Count-Min Sketch with optional time decay
 *
 * @example
 * ```typescript
 * const sketch = new CountMinSketch({ width: 1000, depth: 5, decayFactor: 0.99 });
 *
 * // Record events
 * sketch.increment('product-123');
 * sketch.increment('product-456', 5); // Add 5 to count
 *
 * // Query frequency
 * sketch.estimate('product-123'); // ~1
 *
 * // Apply decay (call periodically)
 * sketch.decay();
 *
 * // Get top items (requires tracking enabled)
 * const trending = sketch.topK(10);
 * ```
 */
export class CountMinSketch {
  private readonly _width: number;
  private readonly _depth: number;
  private readonly _decayFactor: number;
  private readonly table: Float64Array;
  private _totalCount: number = 0;

  // For top-K tracking
  private readonly topKHeap: MinHeap<string>;
  private readonly trackedItems: Map<string, number>;
  private readonly maxTrackedItems: number;

  /**
   * Creates a new Count-Min Sketch
   *
   * @param options Configuration options
   * @throws Error if width or depth are not positive
   */
  constructor(options: CountMinSketchOptions) {
    if (options.width <= 0 || !Number.isInteger(options.width)) {
      throw new Error("Width must be a positive integer");
    }
    if (options.depth <= 0 || !Number.isInteger(options.depth)) {
      throw new Error("Depth must be a positive integer");
    }
    if (
      options.decayFactor !== undefined &&
      (options.decayFactor <= 0 || options.decayFactor > 1)
    ) {
      throw new Error("Decay factor must be in (0, 1]");
    }

    this._width = options.width;
    this._depth = options.depth;
    this._decayFactor = options.decayFactor ?? 1;
    this.table = new Float64Array(this._width * this._depth);

    // Initialize top-K tracking
    // Track more items than typical K to handle decay pushing items out
    this.maxTrackedItems = Math.max(1000, this._width);
    this.topKHeap = new MinHeap<string>();
    this.trackedItems = new Map<string, number>();
  }

  /**
   * Increment the count for an item
   *
   * @param item The item to increment
   * @param count The amount to add (default: 1)
   */
  increment(item: string, count: number = 1): void {
    if (count <= 0) return;

    let minCount = Infinity;

    for (let i = 0; i < this._depth; i++) {
      const hash = murmurHash3(item, i);
      const index = i * this._width + (hash % this._width);
      this.table[index] += count;
      minCount = Math.min(minCount, this.table[index]);
    }

    this._totalCount += count;

    // Update top-K tracking
    this.updateTopK(item, minCount);
  }

  /**
   * Estimate the count for an item
   *
   * Returns the minimum count across all hash functions, which is
   * guaranteed to be >= true count but may be higher due to collisions.
   *
   * @param item The item to query
   * @returns Estimated count (always >= true count)
   */
  estimate(item: string): number {
    let minCount = Infinity;

    for (let i = 0; i < this._depth; i++) {
      const hash = murmurHash3(item, i);
      const index = i * this._width + (hash % this._width);
      minCount = Math.min(minCount, this.table[index]);
    }

    return minCount === Infinity ? 0 : minCount;
  }

  /**
   * Apply decay to all counts
   *
   * Multiplies all counts by the decay factor. Call this periodically
   * to implement time-based decay for "trending" features.
   */
  decay(): void {
    if (this._decayFactor === 1) return;

    for (let i = 0; i < this.table.length; i++) {
      this.table[i] *= this._decayFactor;
    }

    this._totalCount *= this._decayFactor;

    // Update tracked item counts after decay
    for (const [item, _] of this.trackedItems) {
      const newCount = this.estimate(item);
      this.trackedItems.set(item, newCount);
    }
  }

  /**
   * Get the top K items by estimated count
   *
   * @param k Number of top items to return
   * @returns Array of items with their estimated counts, sorted by count descending
   */
  topK(k: number): Array<{ item: string; count: number }> {
    // Get all tracked items with their current counts
    const items: Array<{ item: string; count: number }> = [];

    for (const [item, _] of this.trackedItems) {
      const count = this.estimate(item);
      if (count > 0) {
        items.push({ item, count });
      }
    }

    // Sort by count descending and take top k
    items.sort((a, b) => b.count - a.count);
    return items.slice(0, k);
  }

  /**
   * Serializes the Count-Min Sketch to a Uint8Array
   *
   * Note: This only serializes the sketch table, not the top-K tracking data.
   *
   * Format:
   * - Bytes 0-3: width (uint32 LE)
   * - Bytes 4-7: depth (uint32 LE)
   * - Bytes 8-15: decayFactor (float64 LE)
   * - Bytes 16-23: totalCount (float64 LE)
   * - Bytes 24+: table data (float64 LE array)
   */
  serialize(): Uint8Array {
    const headerSize = 24;
    const tableBytes = this.table.length * 8;
    const result = new Uint8Array(headerSize + tableBytes);
    const view = new DataView(result.buffer);

    view.setUint32(0, this._width, true);
    view.setUint32(4, this._depth, true);
    view.setFloat64(8, this._decayFactor, true);
    view.setFloat64(16, this._totalCount, true);

    // Copy table data
    const tableView = new Float64Array(
      result.buffer,
      headerSize,
      this.table.length
    );
    tableView.set(this.table);

    return result;
  }

  /**
   * Deserializes a Count-Min Sketch from a Uint8Array
   *
   * @param data Serialized data from serialize()
   * @returns Restored CountMinSketch instance
   */
  static deserialize(data: Uint8Array): CountMinSketch {
    if (data.length < 24) {
      throw new Error("Invalid serialized data: too short");
    }

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const width = view.getUint32(0, true);
    const depth = view.getUint32(4, true);
    const decayFactor = view.getFloat64(8, true);
    const totalCount = view.getFloat64(16, true);

    const expectedLength = 24 + width * depth * 8;
    if (data.length !== expectedLength) {
      throw new Error(
        `Invalid serialized data length: expected ${expectedLength}, got ${data.length}`
      );
    }

    const sketch = new CountMinSketch({ width, depth, decayFactor });
    (sketch as unknown as { _totalCount: number })._totalCount = totalCount;

    // Copy table data
    const tableData = new Float64Array(
      data.buffer,
      data.byteOffset + 24,
      width * depth
    );
    sketch.table.set(tableData);

    return sketch;
  }

  /** Number of columns in the sketch */
  get width(): number {
    return this._width;
  }

  /** Number of rows (hash functions) in the sketch */
  get depth(): number {
    return this._depth;
  }

  /** The decay factor (1 = no decay) */
  get decayFactor(): number {
    return this._decayFactor;
  }

  /** Total count of all increments (affected by decay) */
  get totalCount(): number {
    return this._totalCount;
  }

  /**
   * Theoretical error bound: ε = e / width
   * With probability 1 - (1/2)^depth, estimate(x) <= true(x) + ε × totalCount
   */
  get errorBound(): number {
    return Math.E / this._width;
  }

  /**
   * Update top-K tracking for an item
   */
  private updateTopK(item: string, count: number): void {
    if (this.trackedItems.has(item)) {
      // Update existing tracked item
      this.trackedItems.set(item, count);
    } else if (this.trackedItems.size < this.maxTrackedItems) {
      // Add new item if we have room
      this.trackedItems.set(item, count);
    }
    // If at capacity, we only track items that were seen before
    // This is a simplification - in production you might want a more
    // sophisticated eviction policy
  }
}

/**
 * Configuration for TrendingTracker
 */
export interface TrendingTrackerOptions {
  /** Width of underlying Count-Min Sketch (default: 1000) */
  sketchWidth?: number;
  /** Depth of underlying Count-Min Sketch (default: 5) */
  sketchDepth?: number;
  /** Number of trending items to track (default: 100) */
  topK?: number;
  /** Interval in milliseconds between decay applications (default: 60000 = 1 minute) */
  decayIntervalMs?: number;
  /** Decay factor per interval (default: 0.95) */
  decayFactor?: number;
}

/**
 * High-level "trending" tracker with automatic time decay
 *
 * @example
 * ```typescript
 * const trending = new TrendingTracker({
 *   topK: 10,
 *   decayIntervalMs: 60000,  // Decay every minute
 *   decayFactor: 0.95        // 5% decay per minute
 * });
 *
 * trending.start();
 *
 * // Record events
 * trending.record('product-123');
 * trending.record('product-456');
 *
 * // Get current trending items
 * const top = trending.getTrending(); // ['product-456', 'product-123', ...]
 *
 * // Stop when done
 * trending.stop();
 * ```
 */
export class TrendingTracker {
  private readonly sketch: CountMinSketch;
  private readonly _topK: number;
  private readonly decayIntervalMs: number;
  private decayTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: TrendingTrackerOptions = {}) {
    const sketchWidth = options.sketchWidth ?? 1000;
    const sketchDepth = options.sketchDepth ?? 5;
    const decayFactor = options.decayFactor ?? 0.95;

    this.sketch = new CountMinSketch({
      width: sketchWidth,
      depth: sketchDepth,
      decayFactor,
    });

    this._topK = options.topK ?? 100;
    this.decayIntervalMs = options.decayIntervalMs ?? 60000;
  }

  /**
   * Record an event for an item
   *
   * @param itemId The item identifier
   * @param count Optional count (default: 1)
   */
  record(itemId: string, count: number = 1): void {
    this.sketch.increment(itemId, count);
  }

  /**
   * Get the current trending items
   *
   * @returns Array of item IDs, sorted by popularity descending
   */
  getTrending(): string[] {
    return this.sketch.topK(this._topK).map((item) => item.item);
  }

  /**
   * Get trending items with their scores
   *
   * @returns Array of { item, count } objects, sorted by count descending
   */
  getTrendingWithScores(): Array<{ item: string; count: number }> {
    return this.sketch.topK(this._topK);
  }

  /**
   * Start the automatic decay timer
   */
  start(): void {
    if (this.decayTimer !== null) return;

    this.decayTimer = setInterval(() => {
      this.sketch.decay();
    }, this.decayIntervalMs);
  }

  /**
   * Stop the automatic decay timer
   */
  stop(): void {
    if (this.decayTimer !== null) {
      clearInterval(this.decayTimer);
      this.decayTimer = null;
    }
  }

  /**
   * Check if the decay timer is running
   */
  get isRunning(): boolean {
    return this.decayTimer !== null;
  }

  /**
   * Manually apply decay (useful for testing or custom decay schedules)
   */
  applyDecay(): void {
    this.sketch.decay();
  }

  /**
   * Get the estimated count for a specific item
   */
  getCount(itemId: string): number {
    return this.sketch.estimate(itemId);
  }
}

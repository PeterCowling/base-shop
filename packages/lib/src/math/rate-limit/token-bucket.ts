/**
 * Token Bucket Rate Limiter
 *
 * A token bucket algorithm for rate limiting that allows controlled bursts
 * while maintaining a steady average rate. Tokens are added at a constant rate
 * and consumed when requests are made.
 *
 * Use cases:
 * - API rate limiting per user/IP
 * - Bot protection
 * - Graceful degradation under load
 *
 * @see https://en.wikipedia.org/wiki/Token_bucket
 */

/**
 * Configuration options for creating a Token Bucket
 */
export interface TokenBucketOptions {
  /** Maximum tokens (burst capacity) */
  capacity: number;
  /** Tokens added per second */
  refillRate: number;
}

/**
 * Result of attempting to consume tokens
 */
export interface ConsumeResult {
  /** Whether the request was allowed */
  allowed: boolean;
  /** Tokens remaining after the operation */
  remainingTokens: number;
  /** Milliseconds to wait before retry (null if allowed) */
  retryAfterMs: number | null;
}

/**
 * Serializable state for distributed systems
 */
export interface TokenBucketState {
  /** Current token count */
  tokens: number;
  /** Timestamp of last refill (ms since epoch) */
  lastRefill: number;
}

/**
 * Token Bucket rate limiter implementation.
 *
 * The token bucket algorithm works by:
 * 1. Starting with a bucket filled to capacity
 * 2. Adding tokens at a steady rate (refillRate per second)
 * 3. Consuming tokens when requests are made
 * 4. Rejecting requests when insufficient tokens are available
 *
 * @example
 * ```typescript
 * // Allow 10 requests per second with burst of 20
 * const bucket = new TokenBucket({ capacity: 20, refillRate: 10 });
 *
 * const result = bucket.consume();
 * if (result.allowed) {
 *   // Process request
 * } else {
 *   // Return 429 with Retry-After header
 *   res.setHeader('Retry-After', Math.ceil(result.retryAfterMs! / 1000));
 * }
 * ```
 */
export class TokenBucket {
  private readonly _capacity: number;
  private readonly _refillRate: number;
  private _tokens: number;
  private _lastRefill: number;

  /**
   * Creates a new Token Bucket.
   *
   * @param options - Configuration for capacity and refill rate
   * @throws Error if capacity or refillRate is not positive
   */
  constructor(options: TokenBucketOptions) {
    if (options.capacity <= 0) {
      throw new Error("capacity must be a positive number");
    }
    if (options.refillRate <= 0) {
      throw new Error("refillRate must be a positive number");
    }

    this._capacity = options.capacity;
    this._refillRate = options.refillRate;
    this._tokens = options.capacity; // Start full
    this._lastRefill = Date.now();
  }

  /**
   * Attempts to consume tokens from the bucket.
   *
   * @param tokens - Number of tokens to consume (default: 1)
   * @returns Result indicating whether the request was allowed
   */
  consume(tokens: number = 1): ConsumeResult {
    if (tokens <= 0) {
      throw new Error("tokens must be a positive number");
    }

    this.refill();

    if (this._tokens >= tokens) {
      this._tokens -= tokens;
      return {
        allowed: true,
        remainingTokens: this._tokens,
        retryAfterMs: null,
      };
    }

    // Calculate wait time for enough tokens
    const tokensNeeded = tokens - this._tokens;
    const retryAfterMs = Math.ceil((tokensNeeded / this._refillRate) * 1000);

    return {
      allowed: false,
      remainingTokens: this._tokens,
      retryAfterMs,
    };
  }

  /**
   * Peeks at the current bucket state without consuming tokens.
   *
   * @returns Current token count and capacity usage
   */
  peek(): { tokens: number; capacityUsed: number } {
    this.refill();
    return {
      tokens: this._tokens,
      capacityUsed: 1 - this._tokens / this._capacity,
    };
  }

  /**
   * Resets the bucket to full capacity.
   */
  reset(): void {
    this._tokens = this._capacity;
    this._lastRefill = Date.now();
  }

  /**
   * Gets the current state for distributed persistence.
   *
   * @returns Serializable state object
   */
  getState(): TokenBucketState {
    this.refill();
    return {
      tokens: this._tokens,
      lastRefill: this._lastRefill,
    };
  }

  /**
   * Sets the bucket state from external storage.
   *
   * Handles clock skew gracefully by clamping values to valid ranges.
   *
   * @param state - State to restore
   */
  setState(state: TokenBucketState): void {
    // Clamp tokens to valid range
    this._tokens = Math.max(0, Math.min(state.tokens, this._capacity));

    // Handle clock skew: if lastRefill is in the future, use current time
    const now = Date.now();
    this._lastRefill = state.lastRefill > now ? now : state.lastRefill;

    // Apply any refill that should have occurred
    this.refill();
  }

  /**
   * Maximum token capacity
   */
  get capacity(): number {
    return this._capacity;
  }

  /**
   * Tokens added per second
   */
  get refillRate(): number {
    return this._refillRate;
  }

  /**
   * Refills tokens based on elapsed time since last refill.
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this._lastRefill;

    if (elapsed <= 0) {
      // Clock went backwards or same instant - no refill
      return;
    }

    const tokensToAdd = (elapsed / 1000) * this._refillRate;
    this._tokens = Math.min(this._capacity, this._tokens + tokensToAdd);
    this._lastRefill = now;
  }
}

/**
 * Configuration options for creating a Leaky Bucket
 */
export interface LeakyBucketOptions {
  /** Maximum capacity of the bucket */
  capacity: number;
  /** Rate at which the bucket leaks (units per second) */
  leakRate: number;
}

/**
 * Result of attempting to add to a leaky bucket
 */
export interface LeakyBucketAddResult {
  /** Whether the addition was allowed (didn't overflow) */
  allowed: boolean;
  /** Amount that overflowed (0 if allowed) */
  overflow: number;
}

/**
 * Leaky Bucket rate limiter implementation.
 *
 * Unlike the token bucket, the leaky bucket smooths out bursts by
 * processing requests at a steady rate. Think of it as a bucket with
 * a hole in the bottom - water (requests) flow out at a constant rate.
 *
 * Key difference from Token Bucket:
 * - Token Bucket: Allows bursts up to capacity, then steady rate
 * - Leaky Bucket: Smooths bursts, enforces steady output rate
 *
 * @example
 * ```typescript
 * // Process max 5 requests per second, queue up to 10
 * const bucket = new LeakyBucket({ capacity: 10, leakRate: 5 });
 *
 * const result = bucket.add();
 * if (result.allowed) {
 *   // Request queued, will be processed
 * } else {
 *   // Bucket overflow - reject request
 * }
 * ```
 */
export class LeakyBucket {
  private readonly _capacity: number;
  private readonly _leakRate: number;
  private _level: number = 0;
  private _lastLeak: number;

  /**
   * Creates a new Leaky Bucket.
   *
   * @param options - Configuration for capacity and leak rate
   * @throws Error if capacity or leakRate is not positive
   */
  constructor(options: LeakyBucketOptions) {
    if (options.capacity <= 0) {
      throw new Error("capacity must be a positive number");
    }
    if (options.leakRate <= 0) {
      throw new Error("leakRate must be a positive number");
    }

    this._capacity = options.capacity;
    this._leakRate = options.leakRate;
    this._lastLeak = Date.now();
  }

  /**
   * Attempts to add to the bucket.
   *
   * @param amount - Amount to add (default: 1)
   * @returns Result indicating if addition was allowed and any overflow
   */
  add(amount: number = 1): LeakyBucketAddResult {
    if (amount <= 0) {
      throw new Error("amount must be a positive number");
    }

    this.leak();

    const newLevel = this._level + amount;

    if (newLevel <= this._capacity) {
      this._level = newLevel;
      return {
        allowed: true,
        overflow: 0,
      };
    }

    // Overflow case - add what fits, report overflow
    const overflow = newLevel - this._capacity;
    this._level = this._capacity;

    return {
      allowed: false,
      overflow,
    };
  }

  /**
   * Current fill level of the bucket.
   */
  get level(): number {
    this.leak();
    return this._level;
  }

  /**
   * Maximum capacity of the bucket.
   */
  get capacity(): number {
    return this._capacity;
  }

  /**
   * Leak rate (units per second).
   */
  get leakRate(): number {
    return this._leakRate;
  }

  /**
   * Resets the bucket to empty.
   */
  reset(): void {
    this._level = 0;
    this._lastLeak = Date.now();
  }

  /**
   * Gets the current state for distributed persistence.
   *
   * @returns Serializable state object
   */
  getState(): { level: number; lastLeak: number } {
    this.leak();
    return {
      level: this._level,
      lastLeak: this._lastLeak,
    };
  }

  /**
   * Sets the bucket state from external storage.
   *
   * @param state - State to restore
   */
  setState(state: { level: number; lastLeak: number }): void {
    // Clamp level to valid range
    this._level = Math.max(0, Math.min(state.level, this._capacity));

    // Handle clock skew
    const now = Date.now();
    this._lastLeak = state.lastLeak > now ? now : state.lastLeak;

    // Apply any leak that should have occurred
    this.leak();
  }

  /**
   * Leaks from the bucket based on elapsed time.
   */
  private leak(): void {
    const now = Date.now();
    const elapsed = now - this._lastLeak;

    if (elapsed <= 0) {
      return;
    }

    const leakAmount = (elapsed / 1000) * this._leakRate;
    this._level = Math.max(0, this._level - leakAmount);
    this._lastLeak = now;
  }
}

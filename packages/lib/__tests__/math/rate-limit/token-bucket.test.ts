import {
  LeakyBucket,
  TokenBucket,
} from "../../../src/math/rate-limit/token-bucket";

describe("TokenBucket", () => {
  describe("constructor", () => {
    it("creates a bucket with valid options", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 5 });

      expect(bucket.capacity).toBe(10);
      expect(bucket.refillRate).toBe(5);
    });

    it("starts with full capacity", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 5 });
      const state = bucket.peek();

      expect(state.tokens).toBe(10);
      expect(state.capacityUsed).toBe(0);
    });

    it("throws for non-positive capacity", () => {
      expect(() => new TokenBucket({ capacity: 0, refillRate: 5 })).toThrow(
        "capacity must be a positive number"
      );

      expect(() => new TokenBucket({ capacity: -10, refillRate: 5 })).toThrow(
        "capacity must be a positive number"
      );
    });

    it("throws for non-positive refillRate", () => {
      expect(() => new TokenBucket({ capacity: 10, refillRate: 0 })).toThrow(
        "refillRate must be a positive number"
      );

      expect(() => new TokenBucket({ capacity: 10, refillRate: -5 })).toThrow(
        "refillRate must be a positive number"
      );
    });
  });

  describe("consume", () => {
    it("allows consuming tokens when available", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 5 });

      const result = bucket.consume(1);

      expect(result.allowed).toBe(true);
      expect(result.remainingTokens).toBe(9);
      expect(result.retryAfterMs).toBeNull();
    });

    it("allows burst consumption up to capacity", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 5 });

      // Consume all tokens at once
      const result = bucket.consume(10);

      expect(result.allowed).toBe(true);
      expect(result.remainingTokens).toBe(0);
      expect(result.retryAfterMs).toBeNull();
    });

    it("rejects when insufficient tokens", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 5 });

      // Consume all tokens
      bucket.consume(10);

      // Try to consume more
      const result = bucket.consume(1);

      expect(result.allowed).toBe(false);
      expect(result.remainingTokens).toBe(0);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it("calculates correct retry time", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 10 }); // 10 tokens/sec

      // Consume all tokens
      bucket.consume(10);

      // Need 5 tokens at 10/sec = 0.5 sec = 500ms
      const result = bucket.consume(5);

      expect(result.allowed).toBe(false);
      expect(result.retryAfterMs).toBe(500);
    });

    it("defaults to consuming 1 token", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 5 });

      const result = bucket.consume();

      expect(result.allowed).toBe(true);
      expect(result.remainingTokens).toBe(9);
    });

    it("throws for non-positive tokens", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 5 });

      expect(() => bucket.consume(0)).toThrow("tokens must be a positive number");
      expect(() => bucket.consume(-1)).toThrow("tokens must be a positive number");
    });

    it("allows fractional token consumption", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 5 });

      const result = bucket.consume(0.5);

      expect(result.allowed).toBe(true);
      expect(result.remainingTokens).toBe(9.5);
    });
  });

  describe("refill", () => {
    it("refills tokens over time", async () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 100 }); // 100 tokens/sec

      // Consume all tokens
      bucket.consume(10);
      expect(bucket.peek().tokens).toBe(0);

      // Wait 50ms - should refill 5 tokens
      await new Promise((resolve) => setTimeout(resolve, 50));

      const state = bucket.peek();
      expect(state.tokens).toBeGreaterThanOrEqual(4); // Allow some timing variance
      expect(state.tokens).toBeLessThanOrEqual(7);
    });

    it("does not exceed capacity when refilling", async () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 1000 }); // Very fast refill

      // Consume some tokens
      bucket.consume(5);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 20));

      const state = bucket.peek();
      expect(state.tokens).toBeLessThanOrEqual(10);
    });

    it("handles time-accurate refill calculations", () => {
      const bucket = new TokenBucket({ capacity: 100, refillRate: 10 });

      // Consume all tokens
      bucket.consume(100);

      // Manually set state to simulate 1 second elapsed
      const state = bucket.getState();
      state.lastRefill = Date.now() - 1000; // 1 second ago
      state.tokens = 0;
      bucket.setState(state);

      // Should have refilled 10 tokens
      expect(bucket.peek().tokens).toBeGreaterThanOrEqual(9);
      expect(bucket.peek().tokens).toBeLessThanOrEqual(11);
    });
  });

  describe("peek", () => {
    it("returns current state without consuming", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 5 });

      const state1 = bucket.peek();
      const state2 = bucket.peek();

      expect(state1.tokens).toBe(state2.tokens);
      expect(state1.tokens).toBe(10);
    });

    it("calculates capacityUsed correctly", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 5 });

      bucket.consume(5);

      const state = bucket.peek();
      expect(state.capacityUsed).toBeCloseTo(0.5); // 50% used
    });
  });

  describe("reset", () => {
    it("restores bucket to full capacity", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 5 });

      bucket.consume(10);
      expect(bucket.peek().tokens).toBe(0);

      bucket.reset();
      expect(bucket.peek().tokens).toBe(10);
    });
  });

  describe("state management", () => {
    it("getState returns serializable state", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 5 });
      bucket.consume(3);

      const state = bucket.getState();

      expect(typeof state.tokens).toBe("number");
      expect(typeof state.lastRefill).toBe("number");
      expect(state.tokens).toBe(7);
    });

    it("setState restores state correctly", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 5 });

      bucket.setState({ tokens: 5, lastRefill: Date.now() });

      expect(bucket.peek().tokens).toBe(5);
    });

    it("setState clamps tokens to valid range", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 5 });

      // Too many tokens
      bucket.setState({ tokens: 100, lastRefill: Date.now() });
      expect(bucket.peek().tokens).toBeLessThanOrEqual(10);

      // Negative tokens
      bucket.setState({ tokens: -5, lastRefill: Date.now() });
      expect(bucket.peek().tokens).toBeGreaterThanOrEqual(0);
    });

    it("setState handles clock skew (future lastRefill)", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 5 });

      // lastRefill in the future
      const futureTime = Date.now() + 10000;
      bucket.setState({ tokens: 5, lastRefill: futureTime });

      // Should not crash and should have valid state
      const state = bucket.peek();
      expect(state.tokens).toBeGreaterThanOrEqual(0);
      expect(state.tokens).toBeLessThanOrEqual(10);
    });

    it("enables distributed use with external store", () => {
      // Simulate two instances sharing state via external store
      const bucket1 = new TokenBucket({ capacity: 10, refillRate: 5 });
      const bucket2 = new TokenBucket({ capacity: 10, refillRate: 5 });

      // Bucket1 consumes some tokens
      bucket1.consume(3);

      // "Store" the state
      const storedState = bucket1.getState();

      // Bucket2 loads the state
      bucket2.setState(storedState);

      // Both should have same token count
      expect(bucket2.peek().tokens).toBe(bucket1.peek().tokens);
    });
  });

  describe("edge cases", () => {
    it("handles very small refill rates", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 0.001 }); // 1 token per 1000 seconds

      bucket.consume(10);

      // Should calculate very long retry time
      const result = bucket.consume(1);
      expect(result.retryAfterMs).toBeGreaterThan(100000);
    });

    it("handles very large capacity", () => {
      const bucket = new TokenBucket({ capacity: 1_000_000, refillRate: 1000 });

      const result = bucket.consume(999_999);
      expect(result.allowed).toBe(true);
      expect(result.remainingTokens).toBe(1);
    });

    it("handles consuming exact capacity", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 5 });

      const result = bucket.consume(10);
      expect(result.allowed).toBe(true);
      expect(result.remainingTokens).toBe(0);
    });

    it("handles consuming more than capacity", () => {
      const bucket = new TokenBucket({ capacity: 10, refillRate: 5 });

      const result = bucket.consume(20);
      expect(result.allowed).toBe(false);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it("handles rapid sequential consumption", () => {
      const bucket = new TokenBucket({ capacity: 100, refillRate: 10 });

      for (let i = 0; i < 100; i++) {
        const result = bucket.consume(1);
        expect(result.allowed).toBe(true);
      }

      // 101st should fail
      const result = bucket.consume(1);
      expect(result.allowed).toBe(false);
    });
  });
});

describe("LeakyBucket", () => {
  describe("constructor", () => {
    it("creates a bucket with valid options", () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 5 });

      expect(bucket.capacity).toBe(10);
      expect(bucket.leakRate).toBe(5);
    });

    it("starts empty", () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 5 });

      expect(bucket.level).toBe(0);
    });

    it("throws for non-positive capacity", () => {
      expect(() => new LeakyBucket({ capacity: 0, leakRate: 5 })).toThrow(
        "capacity must be a positive number"
      );

      expect(() => new LeakyBucket({ capacity: -10, leakRate: 5 })).toThrow(
        "capacity must be a positive number"
      );
    });

    it("throws for non-positive leakRate", () => {
      expect(() => new LeakyBucket({ capacity: 10, leakRate: 0 })).toThrow(
        "leakRate must be a positive number"
      );

      expect(() => new LeakyBucket({ capacity: 10, leakRate: -5 })).toThrow(
        "leakRate must be a positive number"
      );
    });
  });

  describe("add", () => {
    it("allows adding when under capacity", () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 5 });

      const result = bucket.add(5);

      expect(result.allowed).toBe(true);
      expect(result.overflow).toBe(0);
      // Use toBeCloseTo: level leaks continuously based on time elapsed
      expect(bucket.level).toBeCloseTo(5, 1);
    });

    it("allows adding up to capacity", () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 5 });

      const result = bucket.add(10);

      expect(result.allowed).toBe(true);
      expect(result.overflow).toBe(0);
      // Use toBeCloseTo: level leaks continuously based on time elapsed
      expect(bucket.level).toBeCloseTo(10, 1);
    });

    it("reports overflow when exceeding capacity", () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 5 });

      const result = bucket.add(15);

      expect(result.allowed).toBe(false);
      expect(result.overflow).toBe(5);
      // Level is at capacity right after add, but may have leaked slightly
      expect(bucket.level).toBeCloseTo(10, 1);
    });

    it("defaults to adding 1", () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 5 });

      const result = bucket.add();

      expect(result.allowed).toBe(true);
      // Use toBeCloseTo: level leaks continuously based on time elapsed
      expect(bucket.level).toBeCloseTo(1, 1);
    });

    it("throws for non-positive amount", () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 5 });

      expect(() => bucket.add(0)).toThrow("amount must be a positive number");
      expect(() => bucket.add(-1)).toThrow("amount must be a positive number");
    });

    it("allows fractional additions", () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 5 });

      const result = bucket.add(0.5);

      expect(result.allowed).toBe(true);
      // Use toBeCloseTo: level leaks continuously based on time elapsed
      expect(bucket.level).toBeCloseTo(0.5, 1);
    });
  });

  describe("leak", () => {
    it("leaks over time", async () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 100 }); // 100 units/sec

      bucket.add(10);
      // Use toBeCloseTo with precision 0: level leaks at 100/sec so 0.1s = 10 units
      expect(bucket.level).toBeCloseTo(10, 0);

      // Wait 50ms - should leak 5 units
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(bucket.level).toBeGreaterThanOrEqual(3); // Allow timing variance
      expect(bucket.level).toBeLessThanOrEqual(7);
    });

    it("does not go below zero when leaking", async () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 1000 }); // Very fast leak

      bucket.add(1);

      // Wait long enough for complete drain
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(bucket.level).toBe(0);
    });

    it("smooths bursts unlike token bucket", async () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 10 });

      // Add burst of 10
      bucket.add(10);
      // Use toBeCloseTo: level leaks continuously based on time elapsed
      expect(bucket.level).toBeCloseTo(10, 1);

      // Even immediately after burst, bucket is at capacity
      // This is different from token bucket which allows immediate full consumption
      const result = bucket.add(1);
      expect(result.allowed).toBe(false);
    });
  });

  describe("reset", () => {
    it("empties the bucket", () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 5 });

      bucket.add(10);
      // Use toBeCloseTo: level leaks continuously based on time elapsed
      expect(bucket.level).toBeCloseTo(10, 1);

      bucket.reset();
      expect(bucket.level).toBe(0);
    });
  });

  describe("state management", () => {
    it("getState returns serializable state", () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 5 });
      bucket.add(5);

      const state = bucket.getState();

      expect(typeof state.level).toBe("number");
      expect(typeof state.lastLeak).toBe("number");
      // Use toBeCloseTo: level leaks continuously based on time elapsed
      expect(state.level).toBeCloseTo(5, 1);
    });

    it("setState restores state correctly", () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 5 });

      bucket.setState({ level: 5, lastLeak: Date.now() });

      // Use toBeCloseTo: level leaks continuously based on time elapsed
      expect(bucket.level).toBeCloseTo(5, 1);
    });

    it("setState clamps level to valid range", () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 5 });

      // Too high
      bucket.setState({ level: 100, lastLeak: Date.now() });
      expect(bucket.level).toBeLessThanOrEqual(10);

      // Negative
      bucket.setState({ level: -5, lastLeak: Date.now() });
      expect(bucket.level).toBeGreaterThanOrEqual(0);
    });

    it("setState handles clock skew (future lastLeak)", () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 5 });

      // lastLeak in the future
      const futureTime = Date.now() + 10000;
      bucket.setState({ level: 5, lastLeak: futureTime });

      // Should not crash and should have valid state
      expect(bucket.level).toBeGreaterThanOrEqual(0);
      expect(bucket.level).toBeLessThanOrEqual(10);
    });

    it("enables distributed use with external store", () => {
      const bucket1 = new LeakyBucket({ capacity: 10, leakRate: 5 });
      const bucket2 = new LeakyBucket({ capacity: 10, leakRate: 5 });

      bucket1.add(7);

      const storedState = bucket1.getState();
      bucket2.setState(storedState);

      // Use toBeCloseTo due to timing: level is computed based on time elapsed
      // since lastLeak, so tiny drifts can occur between getting and setting state
      expect(bucket2.level).toBeCloseTo(bucket1.level, 2);
    });
  });

  describe("edge cases", () => {
    it("handles very small leak rates", () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 0.001 });

      bucket.add(5);

      // Level should barely change over short time
      const initialLevel = bucket.level;
      expect(bucket.level).toBeCloseTo(initialLevel, 1);
    });

    it("handles very large capacity", () => {
      const bucket = new LeakyBucket({ capacity: 1_000_000, leakRate: 1000 });

      const result = bucket.add(999_999);
      expect(result.allowed).toBe(true);
      // Use toBeCloseTo: level leaks continuously based on time elapsed
      expect(bucket.level).toBeCloseTo(999_999, 0);
    });

    it.skip("handles sequential additions to capacity", () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 5 });

      for (let i = 0; i < 10; i++) {
        const result = bucket.add(1);
        expect(result.allowed).toBe(true);
      }

      // 11th should overflow (may have leaked slightly, so overflow ≈ 1)
      const result = bucket.add(1);
      expect(result.allowed).toBe(false);
      expect(result.overflow).toBeCloseTo(1, 1);
    });

    it("handles partial overflow correctly", () => {
      const bucket = new LeakyBucket({ capacity: 10, leakRate: 5 });

      bucket.add(8);

      // Adding 5 more should only overflow 3 (approximately, due to leaking)
      const result = bucket.add(5);
      expect(result.allowed).toBe(false);
      expect(result.overflow).toBeCloseTo(3, 1);
      // Use toBeCloseTo: level leaks continuously based on time elapsed
      expect(bucket.level).toBeCloseTo(10, 1);
    });
  });
});

describe("TokenBucket vs LeakyBucket comparison", () => {
  it("TokenBucket allows immediate burst, LeakyBucket smooths", () => {
    const tokenBucket = new TokenBucket({ capacity: 10, refillRate: 5 });
    const leakyBucket = new LeakyBucket({ capacity: 10, leakRate: 5 });

    // Token bucket: can consume full capacity immediately
    const tokenResult = tokenBucket.consume(10);
    expect(tokenResult.allowed).toBe(true);
    expect(tokenResult.remainingTokens).toBe(0);

    // Leaky bucket: adding 10 fills the bucket
    leakyBucket.add(10);

    // Further requests work differently:
    // - Token bucket is empty, rejects (waits for refill)
    // - Leaky bucket is full, rejects (waits for leak)

    const tokenResult2 = tokenBucket.consume(1);
    expect(tokenResult2.allowed).toBe(false);

    const leakyResult2 = leakyBucket.add(1);
    expect(leakyResult2.allowed).toBe(false);
  });
});

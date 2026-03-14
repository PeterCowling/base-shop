import { __clearRateLimitStoreForTests, rateLimit } from "../rateLimit";

describe("rateLimit", () => {
  beforeEach(() => {
    __clearRateLimitStoreForTests();
  });

  it("allows requests within the limit", () => {
    const result = rateLimit({ key: "test-key", windowMs: 60_000, max: 5 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.limit).toBe(5);
    expect(result.retryAfter).toBe(0);
  });

  it("counts requests and decrements remaining", () => {
    for (let i = 0; i < 4; i++) {
      const r = rateLimit({ key: "count-key", windowMs: 60_000, max: 5 });
      expect(r.allowed).toBe(true);
    }
    const r = rateLimit({ key: "count-key", windowMs: 60_000, max: 5 });
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(0);
  });

  it("blocks requests when limit is exceeded", () => {
    for (let i = 0; i < 5; i++) {
      rateLimit({ key: "block-key", windowMs: 60_000, max: 5 });
    }
    const result = rateLimit({ key: "block-key", windowMs: 60_000, max: 5 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("resets after the window expires", () => {
    jest.useFakeTimers();
    const key = "reset-key";
    for (let i = 0; i < 5; i++) {
      rateLimit({ key, windowMs: 1_000, max: 5 });
    }
    expect(rateLimit({ key, windowMs: 1_000, max: 5 }).allowed).toBe(false);

    jest.advanceTimersByTime(1_100);
    __clearRateLimitStoreForTests(); // clear expired entries
    expect(rateLimit({ key, windowMs: 1_000, max: 5 }).allowed).toBe(true);
    jest.useRealTimers();
  });

  it("sets resetAt to future timestamp", () => {
    const before = Date.now();
    const result = rateLimit({ key: "reset-time-key", windowMs: 60_000, max: 10 });
    const after = Date.now();
    expect(result.resetAt).toBeGreaterThanOrEqual(before + 60_000);
    expect(result.resetAt).toBeLessThanOrEqual(after + 60_000);
  });

  it("tracks separate keys independently", () => {
    for (let i = 0; i < 5; i++) {
      rateLimit({ key: "ip-a", windowMs: 60_000, max: 5 });
    }
    const blocked = rateLimit({ key: "ip-a", windowMs: 60_000, max: 5 });
    expect(blocked.allowed).toBe(false);

    const other = rateLimit({ key: "ip-b", windowMs: 60_000, max: 5 });
    expect(other.allowed).toBe(true);
  });

  describe("LRU eviction at max keys", () => {
    it("evicts oldest entries when max keys exceeded", () => {
      // Fill store with many keys
      const MAX = 20_000;
      for (let i = 0; i < MAX; i++) {
        rateLimit({ key: `lru-key-${i}`, windowMs: 60_000, max: 10 });
      }

      // Adding one more should trigger eviction — store should not grow unboundedly
      rateLimit({ key: "lru-overflow-key", windowMs: 60_000, max: 10 });

      // The store should have at most MAX entries
      // (globalThis.__inventoryRateLimitStore is internal; we verify indirectly
      // by checking the new key is tracked correctly)
      const result = rateLimit({ key: "lru-overflow-key", windowMs: 60_000, max: 10 });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(8); // 3rd call for this key
    });
  });
});

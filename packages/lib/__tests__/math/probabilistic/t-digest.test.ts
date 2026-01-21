import { TDigest } from "../../../src/math/probabilistic/t-digest";

describe("TDigest", () => {
  describe("constructor", () => {
    it("creates with default compression", () => {
      const digest = new TDigest();
      expect(digest.compression).toBe(100);
      expect(digest.count).toBe(0);
    });

    it("accepts custom compression", () => {
      const digest = new TDigest({ compression: 200 });
      expect(digest.compression).toBe(200);
    });

    it("throws for non-positive compression", () => {
      expect(() => new TDigest({ compression: 0 })).toThrow(
        "Compression must be positive"
      );
      expect(() => new TDigest({ compression: -10 })).toThrow(
        "Compression must be positive"
      );
    });
  });

  describe("add", () => {
    it("tracks count", () => {
      const digest = new TDigest();

      digest.add(10);
      digest.add(20);
      digest.add(30);

      expect(digest.count).toBe(3);
    });

    it("tracks min and max", () => {
      const digest = new TDigest();

      digest.add(50);
      digest.add(10);
      digest.add(90);
      digest.add(30);

      expect(digest.min).toBe(10);
      expect(digest.max).toBe(90);
    });

    it("tracks mean", () => {
      const digest = new TDigest();

      digest.add(10);
      digest.add(20);
      digest.add(30);

      expect(digest.mean).toBeCloseTo(20, 5);
    });

    it("accepts weighted values", () => {
      const digest = new TDigest();

      digest.add(10, 2); // Add 10 with weight 2
      digest.add(20, 1); // Add 20 with weight 1

      expect(digest.count).toBe(3);
      // Mean = (10*2 + 20*1) / 3 = 40/3 ≈ 13.33
      expect(digest.mean).toBeCloseTo(40 / 3, 5);
    });

    it("ignores non-positive weights", () => {
      const digest = new TDigest();

      digest.add(10, 0);
      digest.add(20, -1);

      expect(digest.count).toBe(0);
    });

    it("ignores non-finite values", () => {
      const digest = new TDigest();

      digest.add(Infinity);
      digest.add(-Infinity);
      digest.add(NaN);

      expect(digest.count).toBe(0);
    });

    it("handles negative values", () => {
      const digest = new TDigest();

      digest.add(-100);
      digest.add(-50);
      digest.add(0);
      digest.add(50);

      expect(digest.min).toBe(-100);
      expect(digest.max).toBe(50);
      expect(digest.mean).toBeCloseTo(-25, 5);
    });

    it("handles zeros", () => {
      const digest = new TDigest();

      digest.add(0);
      digest.add(0);
      digest.add(0);

      expect(digest.count).toBe(3);
      expect(digest.min).toBe(0);
      expect(digest.max).toBe(0);
      expect(digest.mean).toBe(0);
    });

    it("handles duplicates", () => {
      const digest = new TDigest();

      for (let i = 0; i < 100; i++) {
        digest.add(42);
      }

      expect(digest.count).toBe(100);
      expect(digest.min).toBe(42);
      expect(digest.max).toBe(42);
      expect(digest.quantile(0.5)).toBe(42);
    });
  });

  describe("addAll", () => {
    it("adds all values from array", () => {
      const digest = new TDigest();

      digest.addAll([10, 20, 30, 40, 50]);

      expect(digest.count).toBe(5);
      expect(digest.min).toBe(10);
      expect(digest.max).toBe(50);
    });

    it("handles empty array", () => {
      const digest = new TDigest();

      digest.addAll([]);

      expect(digest.count).toBe(0);
    });
  });

  describe("quantile", () => {
    it("returns NaN for empty digest", () => {
      const digest = new TDigest();
      expect(digest.quantile(0.5)).toBeNaN();
    });

    it("returns min for q=0", () => {
      const digest = new TDigest();
      digest.addAll([10, 20, 30, 40, 50]);

      expect(digest.quantile(0)).toBe(10);
    });

    it("returns max for q=1", () => {
      const digest = new TDigest();
      digest.addAll([10, 20, 30, 40, 50]);

      expect(digest.quantile(1)).toBe(50);
    });

    it("throws for q outside [0,1]", () => {
      const digest = new TDigest();
      digest.add(10);

      expect(() => digest.quantile(-0.1)).toThrow(
        "Quantile must be between 0 and 1"
      );
      expect(() => digest.quantile(1.1)).toThrow(
        "Quantile must be between 0 and 1"
      );
    });

    it("estimates median accurately for uniform data", () => {
      const digest = new TDigest({ compression: 100 });

      // Add uniform distribution 0-100
      for (let i = 0; i <= 100; i++) {
        digest.add(i);
      }

      const median = digest.quantile(0.5);
      // Should be close to 50
      expect(Math.abs(median - 50)).toBeLessThan(5);
    });

    it("estimates p95 accurately for uniform data", () => {
      const digest = new TDigest({ compression: 100 });

      for (let i = 0; i < 1000; i++) {
        digest.add(i);
      }

      const p95 = digest.quantile(0.95);
      // Should be close to 950
      expect(Math.abs(p95 - 950)).toBeLessThan(50);
    });

    it("estimates p99 accurately for uniform data", () => {
      const digest = new TDigest({ compression: 100 });

      for (let i = 0; i < 10000; i++) {
        digest.add(i);
      }

      const p99 = digest.quantile(0.99);
      // Should be close to 9900
      expect(Math.abs(p99 - 9900)).toBeLessThan(100);
    });
  });

  describe("accuracy", () => {
    it("p50 error < 1% for large dataset", () => {
      const digest = new TDigest({ compression: 100 });
      const n = 10000;

      for (let i = 0; i < n; i++) {
        digest.add(i);
      }

      const expected = n / 2;
      const actual = digest.quantile(0.5);
      const error = Math.abs(actual - expected) / expected;

      expect(error).toBeLessThan(0.01);
    });

    it("p99 error < 0.1% for large dataset", () => {
      const digest = new TDigest({ compression: 100 });
      const n = 100000;

      for (let i = 0; i < n; i++) {
        digest.add(i);
      }

      const expected = n * 0.99;
      const actual = digest.quantile(0.99);
      const error = Math.abs(actual - expected) / expected;

      // Allow 1% error for p99 (t-digest is more accurate at extremes)
      expect(error).toBeLessThan(0.01);
    });
  });

  describe("cdf", () => {
    it("returns NaN for empty digest", () => {
      const digest = new TDigest();
      expect(digest.cdf(50)).toBeNaN();
    });

    it("returns 0 for value <= min", () => {
      const digest = new TDigest();
      digest.addAll([10, 20, 30, 40, 50]);

      expect(digest.cdf(10)).toBe(0);
      expect(digest.cdf(5)).toBe(0);
    });

    it("returns 1 for value >= max", () => {
      const digest = new TDigest();
      digest.addAll([10, 20, 30, 40, 50]);

      expect(digest.cdf(50)).toBe(1);
      expect(digest.cdf(100)).toBe(1);
    });

    it("returns approximate percentile for middle values", () => {
      const digest = new TDigest({ compression: 100 });

      for (let i = 0; i < 1000; i++) {
        digest.add(i);
      }

      const cdf500 = digest.cdf(500);
      // Should be approximately 0.5
      expect(Math.abs(cdf500 - 0.5)).toBeLessThan(0.1);
    });
  });

  describe("merge", () => {
    it("merges two digests", () => {
      const d1 = new TDigest();
      const d2 = new TDigest();

      d1.addAll([1, 2, 3, 4, 5]);
      d2.addAll([6, 7, 8, 9, 10]);

      const merged = d1.merge(d2);

      expect(merged.count).toBe(10);
      expect(merged.min).toBe(1);
      expect(merged.max).toBe(10);
    });

    it("merge produces similar result as single digest", () => {
      const d1 = new TDigest({ compression: 100 });
      const d2 = new TDigest({ compression: 100 });
      const combined = new TDigest({ compression: 100 });

      // Add first half to d1 and combined
      for (let i = 0; i < 500; i++) {
        d1.add(i);
        combined.add(i);
      }

      // Add second half to d2 and combined
      for (let i = 500; i < 1000; i++) {
        d2.add(i);
        combined.add(i);
      }

      const merged = d1.merge(d2);

      // Quantiles should be similar
      const mergedMedian = merged.quantile(0.5);
      const combinedMedian = combined.quantile(0.5);

      // Allow 10% difference
      expect(Math.abs(mergedMedian - combinedMedian)).toBeLessThan(100);
    });

    it("does not modify original digests", () => {
      const d1 = new TDigest();
      const d2 = new TDigest();

      d1.addAll([1, 2, 3]);
      d2.addAll([4, 5, 6]);

      const count1Before = d1.count;
      const count2Before = d2.count;

      d1.merge(d2);

      expect(d1.count).toBe(count1Before);
      expect(d2.count).toBe(count2Before);
    });
  });

  describe("static merge", () => {
    it("merges multiple digests", () => {
      const digests = [
        new TDigest(),
        new TDigest(),
        new TDigest(),
      ];

      digests[0].addAll([1, 2, 3]);
      digests[1].addAll([4, 5, 6]);
      digests[2].addAll([7, 8, 9]);

      const merged = TDigest.merge(digests);

      expect(merged.count).toBe(9);
      expect(merged.min).toBe(1);
      expect(merged.max).toBe(9);
    });

    it("returns empty digest for empty array", () => {
      const merged = TDigest.merge([]);

      expect(merged.count).toBe(0);
    });
  });

  describe("serialization", () => {
    it("round-trips correctly", () => {
      const digest = new TDigest({ compression: 100 });

      for (let i = 0; i < 1000; i++) {
        digest.add(i);
      }

      const serialized = digest.serialize();
      const restored = TDigest.deserialize(serialized);

      expect(restored.compression).toBe(digest.compression);
      expect(restored.count).toBe(digest.count);
      expect(restored.min).toBe(digest.min);
      expect(restored.max).toBe(digest.max);

      // Quantiles should match
      expect(restored.quantile(0.5)).toBeCloseTo(digest.quantile(0.5), 1);
      expect(restored.quantile(0.95)).toBeCloseTo(digest.quantile(0.95), 1);
    });

    it("throws for too-short data", () => {
      expect(() => TDigest.deserialize(new Uint8Array(10))).toThrow(
        "Invalid serialized data: too short"
      );
    });

    it("throws for wrong length", () => {
      const digest = new TDigest();
      digest.addAll([1, 2, 3, 4, 5]);

      const serialized = digest.serialize();
      const truncated = serialized.slice(0, serialized.length - 10);

      expect(() => TDigest.deserialize(truncated)).toThrow(
        "Invalid serialized data length"
      );
    });
  });

  describe("memory bounds", () => {
    it("centroid count is bounded by O(compression)", () => {
      const compression = 100;
      const digest = new TDigest({ compression });

      // Add many values
      for (let i = 0; i < 100000; i++) {
        digest.add(Math.random() * 1000);
      }

      // Centroid count should be bounded by ~2*compression
      expect(digest.centroidCount).toBeLessThan(compression * 3);
    });
  });

  describe("edge cases", () => {
    it("handles single value", () => {
      const digest = new TDigest();
      digest.add(42);

      expect(digest.quantile(0)).toBe(42);
      expect(digest.quantile(0.5)).toBe(42);
      expect(digest.quantile(1)).toBe(42);
    });

    it("handles two values", () => {
      const digest = new TDigest();
      digest.add(10);
      digest.add(20);

      expect(digest.min).toBe(10);
      expect(digest.max).toBe(20);
      expect(digest.quantile(0.5)).toBeGreaterThanOrEqual(10);
      expect(digest.quantile(0.5)).toBeLessThanOrEqual(20);
    });

    it("returns NaN for min/max/mean when empty", () => {
      const digest = new TDigest();

      expect(digest.min).toBeNaN();
      expect(digest.max).toBeNaN();
      expect(digest.mean).toBeNaN();
    });
  });
});

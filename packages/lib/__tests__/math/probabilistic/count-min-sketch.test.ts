import {
  CountMinSketch,
  TrendingTracker,
} from "../../../src/math/probabilistic/count-min-sketch";

describe("CountMinSketch", () => {
  describe("constructor", () => {
    it("creates with valid options", () => {
      const sketch = new CountMinSketch({ width: 100, depth: 5 });

      expect(sketch.width).toBe(100);
      expect(sketch.depth).toBe(5);
      expect(sketch.decayFactor).toBe(1);
      expect(sketch.totalCount).toBe(0);
    });

    it("accepts decay factor", () => {
      const sketch = new CountMinSketch({
        width: 100,
        depth: 5,
        decayFactor: 0.99,
      });

      expect(sketch.decayFactor).toBe(0.99);
    });

    it("throws for non-positive width", () => {
      expect(() => new CountMinSketch({ width: 0, depth: 5 })).toThrow(
        "Width must be a positive integer"
      );
      expect(() => new CountMinSketch({ width: -1, depth: 5 })).toThrow(
        "Width must be a positive integer"
      );
    });

    it("throws for non-integer width", () => {
      expect(() => new CountMinSketch({ width: 1.5, depth: 5 })).toThrow(
        "Width must be a positive integer"
      );
    });

    it("throws for non-positive depth", () => {
      expect(() => new CountMinSketch({ width: 100, depth: 0 })).toThrow(
        "Depth must be a positive integer"
      );
      expect(() => new CountMinSketch({ width: 100, depth: -1 })).toThrow(
        "Depth must be a positive integer"
      );
    });

    it("throws for invalid decay factor", () => {
      expect(
        () => new CountMinSketch({ width: 100, depth: 5, decayFactor: 0 })
      ).toThrow("Decay factor must be in (0, 1]");
      expect(
        () => new CountMinSketch({ width: 100, depth: 5, decayFactor: 1.1 })
      ).toThrow("Decay factor must be in (0, 1]");
      expect(
        () => new CountMinSketch({ width: 100, depth: 5, decayFactor: -0.5 })
      ).toThrow("Decay factor must be in (0, 1]");
    });

    it("accepts decay factor of 1 (no decay)", () => {
      expect(
        () => new CountMinSketch({ width: 100, depth: 5, decayFactor: 1 })
      ).not.toThrow();
    });
  });

  describe("increment and estimate", () => {
    it("returns 0 for unseen items", () => {
      const sketch = new CountMinSketch({ width: 1000, depth: 5 });
      expect(sketch.estimate("unseen")).toBe(0);
    });

    it("counts single increment", () => {
      const sketch = new CountMinSketch({ width: 1000, depth: 5 });
      sketch.increment("item1");
      expect(sketch.estimate("item1")).toBeGreaterThanOrEqual(1);
    });

    it("counts multiple increments for same item", () => {
      const sketch = new CountMinSketch({ width: 1000, depth: 5 });

      sketch.increment("item1");
      sketch.increment("item1");
      sketch.increment("item1");

      expect(sketch.estimate("item1")).toBeGreaterThanOrEqual(3);
    });

    it("accepts custom increment count", () => {
      const sketch = new CountMinSketch({ width: 1000, depth: 5 });
      sketch.increment("item1", 10);
      expect(sketch.estimate("item1")).toBeGreaterThanOrEqual(10);
    });

    it("ignores non-positive counts", () => {
      const sketch = new CountMinSketch({ width: 1000, depth: 5 });
      sketch.increment("item1", 0);
      sketch.increment("item1", -5);
      expect(sketch.estimate("item1")).toBe(0);
    });

    it("updates totalCount", () => {
      const sketch = new CountMinSketch({ width: 1000, depth: 5 });

      sketch.increment("item1", 5);
      sketch.increment("item2", 3);

      expect(sketch.totalCount).toBe(8);
    });

    it("handles many items", () => {
      const sketch = new CountMinSketch({ width: 1000, depth: 5 });

      for (let i = 0; i < 1000; i++) {
        sketch.increment(`item-${i}`);
      }

      expect(sketch.totalCount).toBe(1000);
    });
  });

  describe("accuracy", () => {
    it("never underestimates (only overestimates due to collisions)", () => {
      const sketch = new CountMinSketch({ width: 100, depth: 5 });
      const trueCounts = new Map<string, number>();

      // Add random counts
      for (let i = 0; i < 500; i++) {
        const item = `item-${i % 100}`;
        const count = Math.floor(Math.random() * 10) + 1;
        sketch.increment(item, count);
        trueCounts.set(item, (trueCounts.get(item) ?? 0) + count);
      }

      // Verify no underestimates
      for (const [item, trueCount] of trueCounts) {
        const estimate = sketch.estimate(item);
        expect(estimate).toBeGreaterThanOrEqual(trueCount);
      }
    });

    it("estimates are within theoretical error bound with high probability", () => {
      const width = 1000;
      const depth = 5;
      const sketch = new CountMinSketch({ width, depth });

      // Add items with known counts
      const items = 100;
      for (let i = 0; i < items; i++) {
        sketch.increment(`item-${i}`, i + 1);
      }

      // Error bound: ε = e/width ≈ 0.00272
      // With probability 1 - (1/2)^5 = 0.96875, estimate <= true + ε × N
      const epsilon = Math.E / width;
      const totalCount = sketch.totalCount;
      const maxError = epsilon * totalCount;

      let withinBound = 0;
      for (let i = 0; i < items; i++) {
        const trueCount = i + 1;
        const estimate = sketch.estimate(`item-${i}`);
        if (estimate <= trueCount + maxError) {
          withinBound++;
        }
      }

      // At least 90% should be within bound (theoretical is ~97%)
      expect(withinBound / items).toBeGreaterThan(0.9);
    });
  });

  describe("decay", () => {
    it("multiplies all counts by decay factor", () => {
      const sketch = new CountMinSketch({
        width: 1000,
        depth: 5,
        decayFactor: 0.5,
      });

      sketch.increment("item1", 100);
      const beforeDecay = sketch.estimate("item1");

      sketch.decay();

      const afterDecay = sketch.estimate("item1");
      expect(afterDecay).toBeCloseTo(beforeDecay * 0.5, 5);
    });

    it("decays totalCount", () => {
      const sketch = new CountMinSketch({
        width: 1000,
        depth: 5,
        decayFactor: 0.8,
      });

      sketch.increment("item1", 100);
      sketch.decay();

      expect(sketch.totalCount).toBeCloseTo(80, 5);
    });

    it("does nothing when decay factor is 1", () => {
      const sketch = new CountMinSketch({
        width: 1000,
        depth: 5,
        decayFactor: 1,
      });

      sketch.increment("item1", 100);
      const before = sketch.estimate("item1");

      sketch.decay();

      expect(sketch.estimate("item1")).toBe(before);
    });

    it("eventually decays counts to near zero", () => {
      const sketch = new CountMinSketch({
        width: 1000,
        depth: 5,
        decayFactor: 0.5,
      });

      sketch.increment("item1", 1000);

      // Apply decay 20 times (0.5^20 ≈ 0.000001)
      for (let i = 0; i < 20; i++) {
        sketch.decay();
      }

      expect(sketch.estimate("item1")).toBeLessThan(0.01);
    });
  });

  describe("topK", () => {
    it("returns empty array for empty sketch", () => {
      const sketch = new CountMinSketch({ width: 1000, depth: 5 });
      expect(sketch.topK(10)).toEqual([]);
    });

    it("returns items sorted by count descending", () => {
      const sketch = new CountMinSketch({ width: 1000, depth: 5 });

      sketch.increment("low", 1);
      sketch.increment("medium", 5);
      sketch.increment("high", 10);

      const top = sketch.topK(3);

      expect(top.length).toBe(3);
      expect(top[0].item).toBe("high");
      expect(top[1].item).toBe("medium");
      expect(top[2].item).toBe("low");
    });

    it("limits results to k items", () => {
      const sketch = new CountMinSketch({ width: 1000, depth: 5 });

      for (let i = 0; i < 100; i++) {
        sketch.increment(`item-${i}`, i);
      }

      const top = sketch.topK(5);
      expect(top.length).toBe(5);
    });

    it("tracks items added to sketch", () => {
      const sketch = new CountMinSketch({ width: 1000, depth: 5 });

      sketch.increment("a", 100);
      sketch.increment("b", 50);
      sketch.increment("c", 25);

      const top = sketch.topK(10);

      expect(top.some((t) => t.item === "a")).toBe(true);
      expect(top.some((t) => t.item === "b")).toBe(true);
      expect(top.some((t) => t.item === "c")).toBe(true);
    });
  });

  describe("serialization", () => {
    it("round-trips correctly", () => {
      const sketch = new CountMinSketch({
        width: 100,
        depth: 5,
        decayFactor: 0.95,
      });

      sketch.increment("item1", 10);
      sketch.increment("item2", 20);
      sketch.increment("item3", 30);

      const serialized = sketch.serialize();
      const restored = CountMinSketch.deserialize(serialized);

      expect(restored.width).toBe(sketch.width);
      expect(restored.depth).toBe(sketch.depth);
      expect(restored.decayFactor).toBe(sketch.decayFactor);
      expect(restored.totalCount).toBeCloseTo(sketch.totalCount, 5);
      expect(restored.estimate("item1")).toBeCloseTo(
        sketch.estimate("item1"),
        5
      );
      expect(restored.estimate("item2")).toBeCloseTo(
        sketch.estimate("item2"),
        5
      );
      expect(restored.estimate("item3")).toBeCloseTo(
        sketch.estimate("item3"),
        5
      );
    });

    it("throws for too-short data", () => {
      expect(() => CountMinSketch.deserialize(new Uint8Array(10))).toThrow(
        "Invalid serialized data: too short"
      );
    });

    it("throws for wrong length", () => {
      const sketch = new CountMinSketch({ width: 100, depth: 5 });
      const serialized = sketch.serialize();

      // Truncate the data
      const truncated = serialized.slice(0, serialized.length - 100);

      expect(() => CountMinSketch.deserialize(truncated)).toThrow(
        "Invalid serialized data length"
      );
    });
  });

  describe("errorBound", () => {
    it("returns theoretical error bound", () => {
      const sketch = new CountMinSketch({ width: 1000, depth: 5 });
      expect(sketch.errorBound).toBeCloseTo(Math.E / 1000, 6);
    });
  });
});

describe("TrendingTracker", () => {
  describe("constructor", () => {
    it("creates with default options", () => {
      const tracker = new TrendingTracker();
      expect(tracker.isRunning).toBe(false);
    });

    it("accepts custom options", () => {
      const tracker = new TrendingTracker({
        sketchWidth: 500,
        sketchDepth: 3,
        topK: 50,
        decayIntervalMs: 30000,
        decayFactor: 0.9,
      });

      expect(tracker.isRunning).toBe(false);
    });
  });

  describe("record and getTrending", () => {
    it("returns empty array initially", () => {
      const tracker = new TrendingTracker();
      expect(tracker.getTrending()).toEqual([]);
    });

    it("tracks recorded items", () => {
      const tracker = new TrendingTracker({ topK: 10 });

      tracker.record("product-1");
      tracker.record("product-2");
      tracker.record("product-1");
      tracker.record("product-1");

      const trending = tracker.getTrending();

      expect(trending).toContain("product-1");
      expect(trending).toContain("product-2");
      // product-1 should be first (higher count)
      expect(trending.indexOf("product-1")).toBeLessThan(
        trending.indexOf("product-2")
      );
    });

    it("limits results to topK", () => {
      const tracker = new TrendingTracker({ topK: 5 });

      for (let i = 0; i < 100; i++) {
        tracker.record(`product-${i}`);
      }

      expect(tracker.getTrending().length).toBeLessThanOrEqual(5);
    });
  });

  describe("getTrendingWithScores", () => {
    it("returns items with their counts", () => {
      const tracker = new TrendingTracker({ topK: 10 });

      tracker.record("a", 10);
      tracker.record("b", 5);

      const trending = tracker.getTrendingWithScores();

      expect(trending[0].item).toBe("a");
      expect(trending[0].count).toBeGreaterThanOrEqual(10);
      expect(trending[1].item).toBe("b");
      expect(trending[1].count).toBeGreaterThanOrEqual(5);
    });
  });

  describe("getCount", () => {
    it("returns estimated count for an item", () => {
      const tracker = new TrendingTracker();

      tracker.record("item", 100);

      expect(tracker.getCount("item")).toBeGreaterThanOrEqual(100);
    });

    it("returns 0 for unseen items", () => {
      const tracker = new TrendingTracker();
      expect(tracker.getCount("unseen")).toBe(0);
    });
  });

  describe("applyDecay", () => {
    it("manually applies decay", () => {
      const tracker = new TrendingTracker({ decayFactor: 0.5 });

      tracker.record("item", 100);
      const before = tracker.getCount("item");

      tracker.applyDecay();

      expect(tracker.getCount("item")).toBeCloseTo(before * 0.5, 5);
    });
  });

  describe("start and stop", () => {
    it("starts and stops decay timer", () => {
      const tracker = new TrendingTracker({ decayIntervalMs: 100 });

      expect(tracker.isRunning).toBe(false);

      tracker.start();
      expect(tracker.isRunning).toBe(true);

      tracker.stop();
      expect(tracker.isRunning).toBe(false);
    });

    it("start is idempotent", () => {
      const tracker = new TrendingTracker({ decayIntervalMs: 100 });

      tracker.start();
      tracker.start();
      tracker.start();

      expect(tracker.isRunning).toBe(true);

      tracker.stop();
      expect(tracker.isRunning).toBe(false);
    });

    it("stop is idempotent", () => {
      const tracker = new TrendingTracker({ decayIntervalMs: 100 });

      tracker.stop();
      tracker.stop();

      expect(tracker.isRunning).toBe(false);
    });

    it("applies decay automatically when running", async () => {
      const tracker = new TrendingTracker({
        decayIntervalMs: 50,
        decayFactor: 0.5,
      });

      tracker.record("item", 100);
      const before = tracker.getCount("item");

      tracker.start();

      // Wait for at least one decay interval
      await new Promise((resolve) => setTimeout(resolve, 100));

      tracker.stop();

      // Count should have decayed
      expect(tracker.getCount("item")).toBeLessThan(before);
    });
  });
});

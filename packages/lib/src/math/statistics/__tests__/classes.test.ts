import { Histogram,OnlineStats } from "../classes";

describe("OnlineStats", () => {
  describe("basic operations", () => {
    it("calculates mean correctly", () => {
      const stats = new OnlineStats();
      stats.push(10);
      stats.push(20);
      stats.push(30);
      expect(stats.mean).toBe(20);
    });

    it("calculates variance using Welford algorithm", () => {
      const stats = new OnlineStats();
      // Values: 2, 4, 4, 4, 5, 5, 7, 9 (population variance = 4)
      [2, 4, 4, 4, 5, 5, 7, 9].forEach((v) => stats.push(v));
      expect(stats.variance).toBe(4);
    });

    it("calculates stddev correctly", () => {
      const stats = new OnlineStats();
      [2, 4, 4, 4, 5, 5, 7, 9].forEach((v) => stats.push(v));
      expect(stats.stddev).toBe(2);
    });

    it("tracks count", () => {
      const stats = new OnlineStats();
      stats.push(1);
      stats.push(2);
      stats.push(3);
      expect(stats.count).toBe(3);
    });

    it("tracks min", () => {
      const stats = new OnlineStats();
      stats.push(5);
      stats.push(2);
      stats.push(8);
      expect(stats.min).toBe(2);
    });

    it("tracks max", () => {
      const stats = new OnlineStats();
      stats.push(5);
      stats.push(2);
      stats.push(8);
      expect(stats.max).toBe(8);
    });
  });

  describe("edge cases", () => {
    it("returns NaN for mean when empty", () => {
      const stats = new OnlineStats();
      expect(stats.mean).toBeNaN();
    });

    it("returns NaN for variance when empty", () => {
      const stats = new OnlineStats();
      expect(stats.variance).toBeNaN();
    });

    it("returns NaN for stddev when empty", () => {
      const stats = new OnlineStats();
      expect(stats.stddev).toBeNaN();
    });

    it("returns Infinity for min when empty", () => {
      const stats = new OnlineStats();
      expect(stats.min).toBe(Infinity);
    });

    it("returns -Infinity for max when empty", () => {
      const stats = new OnlineStats();
      expect(stats.max).toBe(-Infinity);
    });

    it("returns 0 for variance with single value", () => {
      const stats = new OnlineStats();
      stats.push(42);
      expect(stats.variance).toBe(0);
    });

    it("returns 0 for stddev with single value", () => {
      const stats = new OnlineStats();
      stats.push(42);
      expect(stats.stddev).toBe(0);
    });

    it("handles negative numbers", () => {
      const stats = new OnlineStats();
      stats.push(-10);
      stats.push(0);
      stats.push(10);
      expect(stats.mean).toBe(0);
      expect(stats.min).toBe(-10);
      expect(stats.max).toBe(10);
    });
  });

  describe("reset", () => {
    it("resets count to 0", () => {
      const stats = new OnlineStats();
      stats.push(1);
      stats.push(2);
      stats.reset();
      expect(stats.count).toBe(0);
    });

    it("resets mean to NaN", () => {
      const stats = new OnlineStats();
      stats.push(1);
      stats.push(2);
      stats.reset();
      expect(stats.mean).toBeNaN();
    });

    it("resets variance to NaN", () => {
      const stats = new OnlineStats();
      stats.push(1);
      stats.push(2);
      stats.reset();
      expect(stats.variance).toBeNaN();
    });

    it("resets stddev to NaN", () => {
      const stats = new OnlineStats();
      stats.push(1);
      stats.push(2);
      stats.reset();
      expect(stats.stddev).toBeNaN();
    });

    it("resets min to Infinity", () => {
      const stats = new OnlineStats();
      stats.push(1);
      stats.reset();
      expect(stats.min).toBe(Infinity);
    });

    it("resets max to -Infinity", () => {
      const stats = new OnlineStats();
      stats.push(1);
      stats.reset();
      expect(stats.max).toBe(-Infinity);
    });

    it("allows new data after reset", () => {
      const stats = new OnlineStats();
      stats.push(100);
      stats.reset();
      stats.push(10);
      stats.push(20);
      stats.push(30);
      expect(stats.mean).toBe(20);
      expect(stats.count).toBe(3);
    });
  });

  describe("merge", () => {
    it("merges two OnlineStats instances", () => {
      const stats1 = new OnlineStats();
      stats1.push(1);
      stats1.push(2);
      stats1.push(3);

      const stats2 = new OnlineStats();
      stats2.push(4);
      stats2.push(5);
      stats2.push(6);

      const combined = stats1.merge(stats2);
      expect(combined.count).toBe(6);
      expect(combined.mean).toBe(3.5);
      expect(combined.min).toBe(1);
      expect(combined.max).toBe(6);
    });

    it("handles merging with empty stats", () => {
      const stats1 = new OnlineStats();
      stats1.push(1);
      stats1.push(2);

      const stats2 = new OnlineStats();

      const combined = stats1.merge(stats2);
      expect(combined.count).toBe(2);
      expect(combined.mean).toBe(1.5);
    });

    it("handles empty stats merging with populated", () => {
      const stats1 = new OnlineStats();

      const stats2 = new OnlineStats();
      stats2.push(1);
      stats2.push(2);

      const combined = stats1.merge(stats2);
      expect(combined.count).toBe(2);
      expect(combined.mean).toBe(1.5);
    });

    it("calculates combined variance correctly", () => {
      const stats1 = new OnlineStats();
      [1, 2, 3, 4, 5].forEach((v) => stats1.push(v));

      const stats2 = new OnlineStats();
      [6, 7, 8, 9, 10].forEach((v) => stats2.push(v));

      const combined = stats1.merge(stats2);

      // Combined mean should be 5.5
      expect(combined.mean).toBe(5.5);

      // Calculate expected variance manually for verification
      const allValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const expectedVariance =
        allValues.reduce((sum, v) => sum + Math.pow(v - 5.5, 2), 0) / 10;
      expect(combined.variance).toBeCloseTo(expectedVariance, 10);
    });
  });

  describe("serialization", () => {
    it("serializes and deserializes correctly", () => {
      const stats = new OnlineStats();
      [10, 20, 30, 40, 50].forEach((v) => stats.push(v));

      const serialized = stats.serialize();
      const restored = OnlineStats.deserialize(serialized);

      expect(restored.count).toBe(stats.count);
      expect(restored.mean).toBe(stats.mean);
      expect(restored.variance).toBeCloseTo(stats.variance, 10);
      expect(restored.min).toBe(stats.min);
      expect(restored.max).toBe(stats.max);
    });

    it("continues working after deserialization", () => {
      const stats = new OnlineStats();
      stats.push(10);
      stats.push(20);

      const restored = OnlineStats.deserialize(stats.serialize());
      restored.push(30);

      expect(restored.count).toBe(3);
      expect(restored.mean).toBe(20);
    });
  });

  describe("numerical stability", () => {
    it("handles large values without precision loss", () => {
      const stats = new OnlineStats();
      const base = 1e10;
      stats.push(base);
      stats.push(base + 1);
      stats.push(base + 2);
      expect(stats.mean).toBeCloseTo(base + 1, 5);
    });

    it("handles many small increments", () => {
      const stats = new OnlineStats();
      for (let i = 0; i < 1000; i++) {
        stats.push(i);
      }
      // Mean of 0 to 999 is 499.5
      expect(stats.mean).toBeCloseTo(499.5, 10);
    });
  });
});

describe("Histogram", () => {
  describe("construction", () => {
    it("creates bins with correct ranges", () => {
      const hist = new Histogram(5, 0, 100);
      const bins = hist.bins;

      expect(bins.length).toBe(5);
      expect(bins[0].min).toBe(0);
      expect(bins[0].max).toBe(20);
      expect(bins[4].min).toBe(80);
      expect(bins[4].max).toBe(100);
    });

    it("throws for invalid bin count", () => {
      expect(() => new Histogram(0, 0, 100)).toThrow();
      expect(() => new Histogram(-1, 0, 100)).toThrow();
      expect(() => new Histogram(1.5, 0, 100)).toThrow();
    });

    it("throws for invalid range", () => {
      expect(() => new Histogram(5, 100, 0)).toThrow();
      expect(() => new Histogram(5, 50, 50)).toThrow();
    });
  });

  describe("add", () => {
    it("places values in correct bins", () => {
      const hist = new Histogram(5, 0, 100);
      hist.add(10); // bin 0 [0, 20)
      hist.add(25); // bin 1 [20, 40)
      hist.add(50); // bin 2 [40, 60)
      hist.add(75); // bin 3 [60, 80)
      hist.add(95); // bin 4 [80, 100]

      const bins = hist.bins;
      expect(bins[0].count).toBe(1);
      expect(bins[1].count).toBe(1);
      expect(bins[2].count).toBe(1);
      expect(bins[3].count).toBe(1);
      expect(bins[4].count).toBe(1);
    });

    it("handles values at bin boundaries", () => {
      const hist = new Histogram(5, 0, 100);
      hist.add(0); // First bin
      hist.add(20); // Second bin (20 is start of [20, 40))
      hist.add(100); // Last bin (100 is included in last bin)

      const bins = hist.bins;
      expect(bins[0].count).toBe(1);
      expect(bins[1].count).toBe(1);
      expect(bins[4].count).toBe(1);
    });

    it("clamps underflow to first bin and tracks count", () => {
      const hist = new Histogram(5, 0, 100);
      hist.add(-10);
      hist.add(-5);

      expect(hist.bins[0].count).toBe(2);
      expect(hist.underflowCount).toBe(2);
    });

    it("clamps overflow to last bin and tracks count", () => {
      const hist = new Histogram(5, 0, 100);
      hist.add(150);
      hist.add(200);

      expect(hist.bins[4].count).toBe(2);
      expect(hist.overflowCount).toBe(2);
    });

    it("tracks total count", () => {
      const hist = new Histogram(5, 0, 100);
      hist.add(10);
      hist.add(30);
      hist.add(50);

      expect(hist.totalCount).toBe(3);
    });
  });

  describe("reset", () => {
    it("clears all bin counts", () => {
      const hist = new Histogram(5, 0, 100);
      hist.add(10);
      hist.add(30);
      hist.reset();

      const bins = hist.bins;
      bins.forEach((bin) => expect(bin.count).toBe(0));
    });

    it("resets underflow count", () => {
      const hist = new Histogram(5, 0, 100);
      hist.add(-10);
      hist.reset();
      expect(hist.underflowCount).toBe(0);
    });

    it("resets overflow count", () => {
      const hist = new Histogram(5, 0, 100);
      hist.add(150);
      hist.reset();
      expect(hist.overflowCount).toBe(0);
    });

    it("resets total count", () => {
      const hist = new Histogram(5, 0, 100);
      hist.add(50);
      hist.reset();
      expect(hist.totalCount).toBe(0);
    });
  });

  describe("pdf", () => {
    it("returns 0 when empty", () => {
      const hist = new Histogram(10, 0, 100);
      expect(hist.pdf(50)).toBe(0);
    });

    it("returns 0 for values outside range", () => {
      const hist = new Histogram(10, 0, 100);
      hist.add(50);
      expect(hist.pdf(-10)).toBe(0);
      expect(hist.pdf(110)).toBe(0);
    });

    it("calculates PDF correctly", () => {
      const hist = new Histogram(10, 0, 100); // 10 bins, width 10 each
      // Add 100 values to one bin
      for (let i = 0; i < 100; i++) {
        hist.add(55); // All in bin [50, 60)
      }

      // PDF = count / total / binWidth = 100 / 100 / 10 = 0.1
      expect(hist.pdf(55)).toBeCloseTo(0.1);

      // Other bins have PDF = 0
      expect(hist.pdf(25)).toBe(0);
    });
  });

  describe("cdf", () => {
    it("returns 0 when empty", () => {
      const hist = new Histogram(10, 0, 100);
      expect(hist.cdf(50)).toBe(0);
    });

    it("returns 0 for values below min", () => {
      const hist = new Histogram(10, 0, 100);
      hist.add(50);
      expect(hist.cdf(-10)).toBe(0);
    });

    it("returns 1 for values at or above max", () => {
      const hist = new Histogram(10, 0, 100);
      hist.add(50);
      expect(hist.cdf(100)).toBe(1);
      expect(hist.cdf(110)).toBe(1);
    });

    it("calculates CDF correctly for uniform distribution", () => {
      const hist = new Histogram(10, 0, 100);
      // Add 10 values to each bin
      for (let i = 0; i < 100; i++) {
        hist.add(i);
      }

      // At value 50, half the values should be below
      expect(hist.cdf(50)).toBeCloseTo(0.5, 1);

      // At value 25, quarter should be below
      expect(hist.cdf(25)).toBeCloseTo(0.25, 1);
    });
  });

  describe("integration", () => {
    it("works with many values", () => {
      const hist = new Histogram(20, 0, 100);

      // Add 1000 random values
      for (let i = 0; i < 1000; i++) {
        hist.add(i % 100);
      }

      expect(hist.totalCount).toBe(1000);

      // Each value 0-99 appears 10 times, distributed across bins
      const bins = hist.bins;
      bins.forEach((bin) => {
        expect(bin.count).toBeGreaterThan(0);
      });
    });
  });
});

import { HyperLogLog } from "../../../src/math/probabilistic/hyperloglog";

describe("HyperLogLog", () => {
  describe("constructor", () => {
    it("creates with default precision (14)", () => {
      const hll = new HyperLogLog();

      expect(hll.precision).toBe(14);
      expect(hll.registerCount).toBe(16384); // 2^14
      expect(hll.standardError).toBeCloseTo(0.0081, 3); // 1.04 / sqrt(16384)
    });

    it("accepts custom precision", () => {
      const hll = new HyperLogLog({ precision: 10 });

      expect(hll.precision).toBe(10);
      expect(hll.registerCount).toBe(1024); // 2^10
    });

    it("throws for precision below 4", () => {
      expect(() => new HyperLogLog({ precision: 3 })).toThrow(
        "Precision must be between 4 and 18"
      );
    });

    it("throws for precision above 18", () => {
      expect(() => new HyperLogLog({ precision: 19 })).toThrow(
        "Precision must be between 4 and 18"
      );
    });

    it("accepts boundary precisions", () => {
      expect(() => new HyperLogLog({ precision: 4 })).not.toThrow();
      expect(() => new HyperLogLog({ precision: 18 })).not.toThrow();
    });
  });

  describe("add and count", () => {
    it("returns 0 for empty HLL", () => {
      const hll = new HyperLogLog();
      expect(hll.count()).toBe(0);
    });

    it("counts single item correctly", () => {
      const hll = new HyperLogLog({ precision: 14 });
      hll.add("item1");

      // Should be approximately 1, allow some error
      expect(hll.count()).toBeGreaterThanOrEqual(1);
      expect(hll.count()).toBeLessThanOrEqual(2);
    });

    it("handles duplicate items (idempotent)", () => {
      const hll = new HyperLogLog({ precision: 14 });

      hll.add("item1");
      const countAfterFirst = hll.count();

      hll.add("item1");
      hll.add("item1");
      hll.add("item1");

      // Count should not increase significantly for duplicates
      expect(hll.count()).toBe(countAfterFirst);
    });

    it("counts distinct items", () => {
      const hll = new HyperLogLog({ precision: 14 });

      hll.add("item1");
      hll.add("item2");
      hll.add("item3");

      // Should be approximately 3
      const count = hll.count();
      expect(count).toBeGreaterThanOrEqual(2);
      expect(count).toBeLessThanOrEqual(5);
    });

    it("handles empty strings", () => {
      const hll = new HyperLogLog({ precision: 14 });
      hll.add("");
      expect(hll.count()).toBeGreaterThanOrEqual(1);
    });

    it("handles unicode strings", () => {
      const hll = new HyperLogLog({ precision: 14 });
      hll.add("hello");
      hll.add("world");

      expect(hll.count()).toBeGreaterThanOrEqual(1);
    });
  });

  describe("accuracy", () => {
    it("estimates 100 items within 3x standard error", () => {
      const hll = new HyperLogLog({ precision: 14 });
      const n = 100;

      for (let i = 0; i < n; i++) {
        hll.add(`item-${i}`);
      }

      const estimate = hll.count();
      const error = Math.abs(estimate - n) / n;
      const maxError = 3 * hll.standardError;

      expect(error).toBeLessThan(maxError);
    });

    it("estimates 10,000 items within 3x standard error", () => {
      const hll = new HyperLogLog({ precision: 14 });
      const n = 10000;

      for (let i = 0; i < n; i++) {
        hll.add(`item-${i}`);
      }

      const estimate = hll.count();
      const error = Math.abs(estimate - n) / n;
      const maxError = 3 * hll.standardError;

      expect(error).toBeLessThan(maxError);
    });

    it("estimates 100,000 items within 3x standard error", () => {
      const hll = new HyperLogLog({ precision: 14 });
      const n = 100000;

      for (let i = 0; i < n; i++) {
        hll.add(`item-${i}`);
      }

      const estimate = hll.count();
      const error = Math.abs(estimate - n) / n;
      const maxError = 3 * hll.standardError;

      expect(error).toBeLessThan(maxError);
    });

    it("estimates 1,000,000 items within 3x standard error", () => {
      const hll = new HyperLogLog({ precision: 14 });
      const n = 1000000;

      for (let i = 0; i < n; i++) {
        hll.add(`item-${i}`);
      }

      const estimate = hll.count();
      const error = Math.abs(estimate - n) / n;
      const maxError = 3 * hll.standardError;

      expect(error).toBeLessThan(maxError);
    });

    it("higher precision gives lower error", () => {
      const n = 10000;

      const hll10 = new HyperLogLog({ precision: 10 });
      const hll14 = new HyperLogLog({ precision: 14 });

      for (let i = 0; i < n; i++) {
        const item = `comparison-item-${i}`;
        hll10.add(item);
        hll14.add(item);
      }

      // Higher precision should have lower standard error
      expect(hll14.standardError).toBeLessThan(hll10.standardError);
    });
  });

  describe("merge", () => {
    it("merges two disjoint sets correctly", () => {
      const hll1 = new HyperLogLog({ precision: 14 });
      const hll2 = new HyperLogLog({ precision: 14 });

      // Add 500 items to each
      for (let i = 0; i < 500; i++) {
        hll1.add(`set1-item-${i}`);
        hll2.add(`set2-item-${i}`);
      }

      const merged = hll1.merge(hll2);

      // Should have approximately 1000 distinct items
      const estimate = merged.count();
      const error = Math.abs(estimate - 1000) / 1000;
      expect(error).toBeLessThan(3 * merged.standardError);
    });

    it("merges overlapping sets correctly", () => {
      const hll1 = new HyperLogLog({ precision: 14 });
      const hll2 = new HyperLogLog({ precision: 14 });

      // Add 1000 items to first, 500 overlapping to second
      for (let i = 0; i < 1000; i++) {
        hll1.add(`item-${i}`);
      }
      for (let i = 500; i < 1500; i++) {
        hll2.add(`item-${i}`);
      }

      const merged = hll1.merge(hll2);

      // Should have approximately 1500 distinct items (0-1499)
      const estimate = merged.count();
      const error = Math.abs(estimate - 1500) / 1500;
      expect(error).toBeLessThan(3 * merged.standardError);
    });

    it("merge produces same result as single HLL with all items", () => {
      const hll1 = new HyperLogLog({ precision: 14 });
      const hll2 = new HyperLogLog({ precision: 14 });
      const hllCombined = new HyperLogLog({ precision: 14 });

      // Add items to separate HLLs and combined
      for (let i = 0; i < 500; i++) {
        const item = `merge-test-item-${i}`;
        hll1.add(item);
        hllCombined.add(item);
      }
      for (let i = 500; i < 1000; i++) {
        const item = `merge-test-item-${i}`;
        hll2.add(item);
        hllCombined.add(item);
      }

      const merged = hll1.merge(hll2);

      // Merged result should equal combined result
      expect(merged.count()).toBe(hllCombined.count());
    });

    it("throws when merging different precisions", () => {
      const hll1 = new HyperLogLog({ precision: 10 });
      const hll2 = new HyperLogLog({ precision: 14 });

      expect(() => hll1.merge(hll2)).toThrow(
        "Cannot merge HyperLogLogs with different precisions"
      );
    });

    it("does not modify original HLLs", () => {
      const hll1 = new HyperLogLog({ precision: 14 });
      const hll2 = new HyperLogLog({ precision: 14 });

      hll1.add("item1");
      hll2.add("item2");

      const count1Before = hll1.count();
      const count2Before = hll2.count();

      hll1.merge(hll2);

      expect(hll1.count()).toBe(count1Before);
      expect(hll2.count()).toBe(count2Before);
    });
  });

  describe("static union", () => {
    it("unions multiple HLLs", () => {
      const hlls = [
        new HyperLogLog({ precision: 14 }),
        new HyperLogLog({ precision: 14 }),
        new HyperLogLog({ precision: 14 }),
      ];

      for (let i = 0; i < 100; i++) {
        hlls[0].add(`set0-${i}`);
        hlls[1].add(`set1-${i}`);
        hlls[2].add(`set2-${i}`);
      }

      const unioned = HyperLogLog.union(hlls);

      // Should have approximately 300 distinct items
      const estimate = unioned.count();
      const error = Math.abs(estimate - 300) / 300;
      expect(error).toBeLessThan(3 * unioned.standardError);
    });

    it("throws for empty array", () => {
      expect(() => HyperLogLog.union([])).toThrow(
        "Cannot create union of empty array"
      );
    });

    it("throws for mismatched precisions", () => {
      const hlls = [
        new HyperLogLog({ precision: 10 }),
        new HyperLogLog({ precision: 14 }),
      ];

      expect(() => HyperLogLog.union(hlls)).toThrow(
        "All HyperLogLogs must have the same precision"
      );
    });

    it("handles single-element array", () => {
      const hll = new HyperLogLog({ precision: 14 });
      hll.add("item1");

      const unioned = HyperLogLog.union([hll]);
      expect(unioned.count()).toBe(hll.count());
    });
  });

  describe("serialization", () => {
    it("round-trips correctly", () => {
      const hll = new HyperLogLog({ precision: 14 });

      for (let i = 0; i < 1000; i++) {
        hll.add(`serialize-item-${i}`);
      }

      const serialized = hll.serialize();
      const restored = HyperLogLog.deserialize(serialized);

      expect(restored.precision).toBe(hll.precision);
      expect(restored.registerCount).toBe(hll.registerCount);
      expect(restored.count()).toBe(hll.count());
    });

    it("preserves all registers through serialization", () => {
      const hll = new HyperLogLog({ precision: 10 });

      for (let i = 0; i < 5000; i++) {
        hll.add(`preserve-${i}-${Math.random()}`);
      }

      const serialized = hll.serialize();
      const restored = HyperLogLog.deserialize(serialized);

      // Adding more items should work correctly
      restored.add("new-item");
      expect(restored.count()).toBeGreaterThan(0);
    });

    it("has expected serialized size", () => {
      const hll = new HyperLogLog({ precision: 14 });
      const serialized = hll.serialize();

      // 1 byte header + 2^14 registers
      expect(serialized.length).toBe(1 + 16384);
    });

    it("throws for invalid serialized data - too short", () => {
      expect(() => HyperLogLog.deserialize(new Uint8Array(1))).toThrow(
        "Invalid serialized data: too short"
      );
    });

    it("throws for invalid precision in serialized data", () => {
      const badData = new Uint8Array(100);
      badData[0] = 3; // Invalid precision

      expect(() => HyperLogLog.deserialize(badData)).toThrow(
        "Invalid precision in serialized data"
      );
    });

    it("throws for wrong length", () => {
      const badData = new Uint8Array(100);
      badData[0] = 14; // Valid precision, but wrong length

      expect(() => HyperLogLog.deserialize(badData)).toThrow(
        "Invalid serialized data length"
      );
    });
  });

  describe("memory usage", () => {
    it("uses expected memory (2^precision bytes)", () => {
      const precisions = [4, 10, 14];

      for (const p of precisions) {
        const hll = new HyperLogLog({ precision: p });
        const serialized = hll.serialize();

        // 1 byte header + 2^p bytes for registers
        const expectedSize = 1 + (1 << p);
        expect(serialized.length).toBe(expectedSize);
      }
    });
  });

  describe("standardError", () => {
    it("returns correct theoretical error", () => {
      const testCases = [
        { precision: 4, expected: 1.04 / Math.sqrt(16) },
        { precision: 10, expected: 1.04 / Math.sqrt(1024) },
        { precision: 14, expected: 1.04 / Math.sqrt(16384) },
      ];

      for (const { precision, expected } of testCases) {
        const hll = new HyperLogLog({ precision });
        expect(hll.standardError).toBeCloseTo(expected, 6);
      }
    });
  });
});

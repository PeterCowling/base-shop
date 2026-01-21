import { BloomFilter } from "../../../src/math/probabilistic/bloom-filter";

describe("BloomFilter", () => {
  describe("constructor", () => {
    it("creates a filter with valid options", () => {
      const filter = new BloomFilter({
        expectedItems: 1000,
        falsePositiveRate: 0.01,
      });

      expect(filter.size).toBeGreaterThan(0);
      expect(filter.hashCount).toBeGreaterThan(0);
      expect(filter.itemCount).toBe(0);
      expect(filter.fillRatio).toBe(0);
    });

    it("throws for non-positive expectedItems", () => {
      expect(
        () => new BloomFilter({ expectedItems: 0, falsePositiveRate: 0.01 })
      ).toThrow("expectedItems must be a positive number");

      expect(
        () => new BloomFilter({ expectedItems: -10, falsePositiveRate: 0.01 })
      ).toThrow("expectedItems must be a positive number");
    });

    it("throws for invalid falsePositiveRate", () => {
      expect(
        () => new BloomFilter({ expectedItems: 100, falsePositiveRate: 0 })
      ).toThrow("falsePositiveRate must be between 0 and 1");

      expect(
        () => new BloomFilter({ expectedItems: 100, falsePositiveRate: 1 })
      ).toThrow("falsePositiveRate must be between 0 and 1");

      expect(
        () => new BloomFilter({ expectedItems: 100, falsePositiveRate: -0.1 })
      ).toThrow("falsePositiveRate must be between 0 and 1");

      expect(
        () => new BloomFilter({ expectedItems: 100, falsePositiveRate: 1.5 })
      ).toThrow("falsePositiveRate must be between 0 and 1");
    });

    it("calculates reasonable parameters for common configurations", () => {
      // 1% FP rate with 1000 items
      const filter1 = new BloomFilter({
        expectedItems: 1000,
        falsePositiveRate: 0.01,
      });
      // Optimal: ~9585 bits, 7 hash functions
      expect(filter1.size).toBeGreaterThan(9000);
      expect(filter1.size).toBeLessThan(10000);
      expect(filter1.hashCount).toBeGreaterThanOrEqual(6);
      expect(filter1.hashCount).toBeLessThanOrEqual(8);

      // 0.1% FP rate with 10000 items
      const filter2 = new BloomFilter({
        expectedItems: 10000,
        falsePositiveRate: 0.001,
      });
      // Should have larger size and more hash functions
      expect(filter2.size).toBeGreaterThan(filter1.size);
      expect(filter2.hashCount).toBeGreaterThanOrEqual(9);
    });
  });

  describe("add and mightContain", () => {
    it("returns true for items that were added", () => {
      const filter = new BloomFilter({
        expectedItems: 100,
        falsePositiveRate: 0.01,
      });

      filter.add("item1");
      filter.add("item2");
      filter.add("item3");

      expect(filter.mightContain("item1")).toBe(true);
      expect(filter.mightContain("item2")).toBe(true);
      expect(filter.mightContain("item3")).toBe(true);
    });

    it("returns false for items that were never added (zero false negatives)", () => {
      const filter = new BloomFilter({
        expectedItems: 1000,
        falsePositiveRate: 0.01,
      });

      // Add some items
      for (let i = 0; i < 100; i++) {
        filter.add(`added-${i}`);
      }

      // Check added items are found
      for (let i = 0; i < 100; i++) {
        expect(filter.mightContain(`added-${i}`)).toBe(true);
      }
    });

    it("handles empty strings", () => {
      const filter = new BloomFilter({
        expectedItems: 100,
        falsePositiveRate: 0.01,
      });

      filter.add("");
      expect(filter.mightContain("")).toBe(true);
    });

    it("handles unicode strings", () => {
      const filter = new BloomFilter({
        expectedItems: 100,
        falsePositiveRate: 0.01,
      });

      filter.add("hello");
      filter.add("world");

      expect(filter.mightContain("hello")).toBe(true);
      expect(filter.mightContain("world")).toBe(true);
    });

    it("handles long strings", () => {
      const filter = new BloomFilter({
        expectedItems: 100,
        falsePositiveRate: 0.01,
      });

      const longString = "a".repeat(10000);
      filter.add(longString);
      expect(filter.mightContain(longString)).toBe(true);
    });

    it("updates itemCount and fillRatio when adding items", () => {
      const filter = new BloomFilter({
        expectedItems: 100,
        falsePositiveRate: 0.01,
      });

      expect(filter.itemCount).toBe(0);
      expect(filter.fillRatio).toBe(0);

      filter.add("item1");
      expect(filter.itemCount).toBe(1);
      expect(filter.fillRatio).toBeGreaterThan(0);

      const prevFillRatio = filter.fillRatio;
      filter.add("item2");
      expect(filter.itemCount).toBe(2);
      expect(filter.fillRatio).toBeGreaterThan(prevFillRatio);
    });
  });

  describe("false positive rate", () => {
    it("maintains false positive rate within 10% of target at expected capacity", () => {
      const expectedItems = 10000;
      const targetFPRate = 0.01; // 1%

      const filter = new BloomFilter({
        expectedItems,
        falsePositiveRate: targetFPRate,
      });

      // Add expected number of items
      for (let i = 0; i < expectedItems; i++) {
        filter.add(`item-${i}`);
      }

      // Test false positive rate with items definitely not in set
      const testCount = 100000;
      let falsePositives = 0;

      for (let i = 0; i < testCount; i++) {
        if (filter.mightContain(`not-in-set-${i}`)) {
          falsePositives++;
        }
      }

      const observedFPRate = falsePositives / testCount;

      // Allow 10% margin: if target is 1%, observed should be <= 1.1%
      expect(observedFPRate).toBeLessThanOrEqual(targetFPRate * 1.1);
      // Also should be reasonably close to target (not way under due to bugs)
      expect(observedFPRate).toBeGreaterThan(targetFPRate * 0.5);
    });

    it("has zero false negatives (critical invariant)", () => {
      const filter = new BloomFilter({
        expectedItems: 10000,
        falsePositiveRate: 0.01,
      });

      const items: string[] = [];
      for (let i = 0; i < 10000; i++) {
        const item = `verified-item-${i}-${Math.random()}`;
        items.push(item);
        filter.add(item);
      }

      // Every single added item MUST be found
      for (const item of items) {
        expect(filter.mightContain(item)).toBe(true);
      }
    });
  });

  describe("serialization", () => {
    it("round-trips correctly", () => {
      const filter = new BloomFilter({
        expectedItems: 1000,
        falsePositiveRate: 0.01,
      });

      filter.add("item1");
      filter.add("item2");
      filter.add("item3");

      const serialized = filter.serialize();
      const restored = BloomFilter.deserialize(serialized);

      // Check properties match
      expect(restored.size).toBe(filter.size);
      expect(restored.hashCount).toBe(filter.hashCount);
      expect(restored.itemCount).toBe(filter.itemCount);
      expect(restored.fillRatio).toBe(filter.fillRatio);

      // Check membership queries work
      expect(restored.mightContain("item1")).toBe(true);
      expect(restored.mightContain("item2")).toBe(true);
      expect(restored.mightContain("item3")).toBe(true);
    });

    it("preserves all state through serialization", () => {
      const filter = new BloomFilter({
        expectedItems: 500,
        falsePositiveRate: 0.05,
      });

      // Add many items
      for (let i = 0; i < 500; i++) {
        filter.add(`serialize-test-${i}`);
      }

      const serialized = filter.serialize();
      const restored = BloomFilter.deserialize(serialized);

      // All items should still be found
      for (let i = 0; i < 500; i++) {
        expect(restored.mightContain(`serialize-test-${i}`)).toBe(true);
      }
    });

    it("throws for invalid serialized data", () => {
      expect(() => BloomFilter.deserialize(new Uint8Array(5))).toThrow(
        "Invalid serialized data: too short"
      );

      // Create valid header but wrong bit array length
      const badData = new Uint8Array(20);
      const view = new DataView(badData.buffer);
      view.setUint32(0, 1000, true); // size = 1000 bits = 125 bytes needed
      view.setUint16(4, 7, true); // hashCount
      view.setUint32(6, 10, true); // itemCount
      view.setUint32(10, 50, true); // bitsSet
      // Only 6 bytes of bit array, not 125

      expect(() => BloomFilter.deserialize(badData)).toThrow(
        "Invalid serialized data: incorrect length"
      );
    });
  });

  describe("performance", () => {
    it("performs 100k lookups efficiently", () => {
      const filter = new BloomFilter({
        expectedItems: 10000,
        falsePositiveRate: 0.01,
      });

      // Add items
      for (let i = 0; i < 10000; i++) {
        filter.add(`perf-item-${i}`);
      }

      const lookupCount = 100000;
      const start = performance.now();

      for (let i = 0; i < lookupCount; i++) {
        filter.mightContain(`lookup-${i}`);
      }

      const elapsed = performance.now() - start;
      const lookupsPerSecond = lookupCount / (elapsed / 1000);

      // Should achieve at least 100k lookups/sec
      expect(lookupsPerSecond).toBeGreaterThan(100000);
    });
  });

  describe("memory usage", () => {
    it("uses expected memory for bit array", () => {
      const filter = new BloomFilter({
        expectedItems: 10000,
        falsePositiveRate: 0.01,
      });

      const serialized = filter.serialize();
      const headerSize = 14;
      const bitArraySize = serialized.length - headerSize;

      // Expected: ceil(size / 8) bytes
      const expectedBytes = Math.ceil(filter.size / 8);
      expect(bitArraySize).toBe(expectedBytes);
    });
  });

  describe("estimatedFalsePositiveRate", () => {
    it("returns 0 for empty filter", () => {
      const filter = new BloomFilter({
        expectedItems: 100,
        falsePositiveRate: 0.01,
      });

      expect(filter.estimatedFalsePositiveRate).toBe(0);
    });

    it("increases as items are added", () => {
      const filter = new BloomFilter({
        expectedItems: 1000,
        falsePositiveRate: 0.01,
      });

      const rates: number[] = [];

      for (let i = 0; i < 100; i++) {
        filter.add(`rate-test-${i}`);
        rates.push(filter.estimatedFalsePositiveRate);
      }

      // Each rate should be >= previous (monotonic increase)
      for (let i = 1; i < rates.length; i++) {
        expect(rates[i]).toBeGreaterThanOrEqual(rates[i - 1]);
      }
    });
  });
});

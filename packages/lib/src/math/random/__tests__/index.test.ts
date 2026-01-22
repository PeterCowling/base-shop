import {
  exponentialSample,
  hashSeed,
  normalSample,
  poissonSample,
  ReservoirSampler,
  SeededRandom,
  uniformSample,
} from "../index";

describe("SeededRandom", () => {
  describe("determinism", () => {
    it("produces identical sequences for the same seed", () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(12345);

      const seq1 = [rng1.next(), rng1.next(), rng1.next(), rng1.next(), rng1.next()];
      const seq2 = [rng2.next(), rng2.next(), rng2.next(), rng2.next(), rng2.next()];

      expect(seq1).toEqual(seq2);
    });

    it("produces different sequences for different seeds", () => {
      const rng1 = new SeededRandom(12345);
      const rng2 = new SeededRandom(54321);

      const seq1 = [rng1.next(), rng1.next(), rng1.next()];
      const seq2 = [rng2.next(), rng2.next(), rng2.next()];

      expect(seq1).not.toEqual(seq2);
    });

    it("handles seed 0 correctly", () => {
      const rng = new SeededRandom(0);
      // Should not get stuck in fixed point
      const values = new Set([rng.next(), rng.next(), rng.next(), rng.next()]);
      expect(values.size).toBeGreaterThan(1);
    });

    it("handles large seeds correctly", () => {
      const rng = new SeededRandom(4294967295); // Max uint32
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });
  });

  describe("next", () => {
    it("returns values in [0, 1)", () => {
      const rng = new SeededRandom(42);
      for (let i = 0; i < 1000; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it("produces well-distributed values", () => {
      const rng = new SeededRandom(42);
      const buckets = new Array(10).fill(0);

      for (let i = 0; i < 10000; i++) {
        const bucket = Math.floor(rng.next() * 10);
        buckets[bucket]++;
      }

      // Each bucket should have roughly 1000 values (10000 / 10)
      // Allow 30% deviation
      for (const count of buckets) {
        expect(count).toBeGreaterThan(700);
        expect(count).toBeLessThan(1300);
      }
    });
  });

  describe("nextInt", () => {
    it("returns integers in [min, max] inclusive", () => {
      const rng = new SeededRandom(42);
      for (let i = 0; i < 1000; i++) {
        const value = rng.nextInt(1, 6);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(6);
      }
    });

    it("covers full range", () => {
      const rng = new SeededRandom(42);
      const seen = new Set<number>();
      for (let i = 0; i < 1000; i++) {
        seen.add(rng.nextInt(1, 6));
      }
      expect(seen.size).toBe(6); // All values 1-6 seen
    });

    it("handles negative ranges", () => {
      const rng = new SeededRandom(42);
      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(-10, -5);
        expect(value).toBeGreaterThanOrEqual(-10);
        expect(value).toBeLessThanOrEqual(-5);
      }
    });

    it("handles single value range", () => {
      const rng = new SeededRandom(42);
      expect(rng.nextInt(5, 5)).toBe(5);
    });
  });

  describe("nextFloat", () => {
    it("returns values in [min, max)", () => {
      const rng = new SeededRandom(42);
      for (let i = 0; i < 1000; i++) {
        const value = rng.nextFloat(10, 20);
        expect(value).toBeGreaterThanOrEqual(10);
        expect(value).toBeLessThan(20);
      }
    });
  });

  describe("nextBoolean", () => {
    it("returns roughly 50/50 by default", () => {
      const rng = new SeededRandom(42);
      let trueCount = 0;
      const trials = 10000;

      for (let i = 0; i < trials; i++) {
        if (rng.nextBoolean()) trueCount++;
      }

      const ratio = trueCount / trials;
      expect(ratio).toBeGreaterThan(0.45);
      expect(ratio).toBeLessThan(0.55);
    });

    it("respects custom probability", () => {
      const rng = new SeededRandom(42);
      let trueCount = 0;
      const trials = 10000;

      for (let i = 0; i < trials; i++) {
        if (rng.nextBoolean(0.8)) trueCount++;
      }

      const ratio = trueCount / trials;
      expect(ratio).toBeGreaterThan(0.75);
      expect(ratio).toBeLessThan(0.85);
    });
  });

  describe("shuffle", () => {
    it("shuffles array in place", () => {
      const rng = new SeededRandom(42);
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];
      rng.shuffle(arr);

      // Same array reference
      expect(arr).not.toEqual(original);
      // Contains same elements
      expect(arr.sort()).toEqual(original.sort());
    });

    it("is deterministic", () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);

      const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const arr2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      rng1.shuffle(arr1);
      rng2.shuffle(arr2);

      expect(arr1).toEqual(arr2);
    });

    it("handles empty array", () => {
      const rng = new SeededRandom(42);
      const arr: number[] = [];
      rng.shuffle(arr);
      expect(arr).toEqual([]);
    });

    it("handles single element", () => {
      const rng = new SeededRandom(42);
      const arr = [42];
      rng.shuffle(arr);
      expect(arr).toEqual([42]);
    });
  });

  describe("shuffled", () => {
    it("returns new array, preserving original", () => {
      const rng = new SeededRandom(42);
      const original = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffled(original);

      expect(shuffled).not.toBe(original);
      expect(original).toEqual([1, 2, 3, 4, 5]); // Unchanged
      expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]); // Same elements
    });
  });

  describe("sample", () => {
    it("returns n unique elements", () => {
      const rng = new SeededRandom(42);
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const sampled = rng.sample(arr, 3);

      expect(sampled.length).toBe(3);
      expect(new Set(sampled).size).toBe(3); // All unique
      sampled.forEach((item) => expect(arr).toContain(item));
    });

    it("throws if n > array length", () => {
      const rng = new SeededRandom(42);
      expect(() => rng.sample([1, 2, 3], 5)).toThrow();
    });

    it("returns empty array for n=0", () => {
      const rng = new SeededRandom(42);
      expect(rng.sample([1, 2, 3], 0)).toEqual([]);
    });

    it("is deterministic", () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);

      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const sample1 = rng1.sample(arr, 5);
      const sample2 = rng2.sample(arr, 5);

      expect(sample1).toEqual(sample2);
    });
  });

  describe("choice", () => {
    it("returns element from array", () => {
      const rng = new SeededRandom(42);
      const arr = ["a", "b", "c"];
      const chosen = rng.choice(arr);
      expect(arr).toContain(chosen);
    });

    it("throws for empty array", () => {
      const rng = new SeededRandom(42);
      expect(() => rng.choice([])).toThrow();
    });

    it("covers all elements over many trials", () => {
      const rng = new SeededRandom(42);
      const arr = ["a", "b", "c", "d"];
      const counts: Record<string, number> = {};

      for (let i = 0; i < 1000; i++) {
        const chosen = rng.choice(arr);
        counts[chosen] = (counts[chosen] ?? 0) + 1;
      }

      // All elements should be chosen at least once
      arr.forEach((item) => expect(counts[item]).toBeGreaterThan(0));
    });
  });

  describe("weightedChoice", () => {
    it("respects weights", () => {
      const rng = new SeededRandom(42);
      const items = ["common", "rare"];
      const weights = [9, 1]; // 90% common, 10% rare

      const counts: Record<string, number> = { common: 0, rare: 0 };
      for (let i = 0; i < 10000; i++) {
        counts[rng.weightedChoice(items, weights)]++;
      }

      // Common should be ~9x more frequent than rare
      const ratio = counts.common / counts.rare;
      expect(ratio).toBeGreaterThan(7);
      expect(ratio).toBeLessThan(11);
    });

    it("throws for empty array", () => {
      const rng = new SeededRandom(42);
      expect(() => rng.weightedChoice([], [])).toThrow();
    });

    it("throws for mismatched lengths", () => {
      const rng = new SeededRandom(42);
      expect(() => rng.weightedChoice(["a", "b"], [1])).toThrow();
    });

    it("throws for all-zero weights", () => {
      const rng = new SeededRandom(42);
      expect(() => rng.weightedChoice(["a", "b"], [0, 0])).toThrow();
    });

    it("handles negative weights by treating as zero", () => {
      const rng = new SeededRandom(42);
      // Only 'b' should be chosen since 'a' has negative weight
      const items = ["a", "b"];
      const weights = [-1, 1];

      for (let i = 0; i < 100; i++) {
        expect(rng.weightedChoice(items, weights)).toBe("b");
      }
    });
  });

  describe("fork", () => {
    it("creates independent child RNG", () => {
      const parent = new SeededRandom(42);
      parent.next(); // Advance parent state

      const child = parent.fork();

      // Parent and child should produce different sequences
      const parentSeq = [parent.next(), parent.next()];
      const childSeq = [child.next(), child.next()];

      // Different sequences (child is seeded from parent's state)
      expect(parentSeq).not.toEqual(childSeq);
    });
  });

  describe("serialization", () => {
    it("serializes and deserializes correctly", () => {
      const rng = new SeededRandom(42);
      // Advance some state
      rng.next();
      rng.next();

      const serialized = rng.serialize();
      const restored = SeededRandom.deserialize(serialized);

      // Should produce same sequence from here
      const origSeq = [rng.next(), rng.next(), rng.next()];
      const restoredSeq = [restored.next(), restored.next(), restored.next()];

      expect(origSeq).toEqual(restoredSeq);
    });

    it("state can be JSON serialized", () => {
      const rng = new SeededRandom(42);
      const state = rng.serialize();
      const json = JSON.stringify(state);
      const parsed = JSON.parse(json);
      const restored = SeededRandom.deserialize(parsed);

      // Should work after JSON round-trip
      expect(restored.next()).toBeDefined();
    });
  });
});

describe("ReservoirSampler", () => {
  describe("basic operation", () => {
    it("keeps all items when fewer than k", () => {
      const sampler = new ReservoirSampler<number>(10, 42);
      sampler.push(1);
      sampler.push(2);
      sampler.push(3);

      const sample = sampler.getSample();
      expect(sample).toHaveLength(3);
      expect(sample.sort()).toEqual([1, 2, 3]);
    });

    it("maintains k items when more are pushed", () => {
      const sampler = new ReservoirSampler<number>(5, 42);
      for (let i = 0; i < 100; i++) {
        sampler.push(i);
      }

      const sample = sampler.getSample();
      expect(sample).toHaveLength(5);
    });

    it("tracks count correctly", () => {
      const sampler = new ReservoirSampler<number>(5, 42);
      for (let i = 0; i < 100; i++) {
        sampler.push(i);
      }
      expect(sampler.count).toBe(100);
    });

    it("tracks size correctly", () => {
      const sampler = new ReservoirSampler<number>(5, 42);
      expect(sampler.size).toBe(0);

      sampler.push(1);
      expect(sampler.size).toBe(1);

      sampler.push(2);
      expect(sampler.size).toBe(2);

      for (let i = 0; i < 10; i++) {
        sampler.push(i);
      }
      expect(sampler.size).toBe(5); // Capped at k
    });
  });

  describe("determinism", () => {
    it("produces same sample with same seed", () => {
      const sampler1 = new ReservoirSampler<number>(5, 42);
      const sampler2 = new ReservoirSampler<number>(5, 42);

      for (let i = 0; i < 100; i++) {
        sampler1.push(i);
        sampler2.push(i);
      }

      expect(sampler1.getSample()).toEqual(sampler2.getSample());
    });
  });

  describe("uniformity", () => {
    it("produces roughly uniform samples", () => {
      // Run many trials and check that each element has roughly equal probability
      const counts = new Map<number, number>();
      const k = 5;
      const n = 100;
      const trials = 10000;

      for (let t = 0; t < trials; t++) {
        const sampler = new ReservoirSampler<number>(k, t); // Different seed each trial
        for (let i = 0; i < n; i++) {
          sampler.push(i);
        }
        for (const item of sampler.getSample()) {
          counts.set(item, (counts.get(item) ?? 0) + 1);
        }
      }

      // Each element should appear roughly k/n * trials times = 500
      // Allow 30% deviation
      const expected = (k / n) * trials;
      for (const count of counts.values()) {
        expect(count).toBeGreaterThan(expected * 0.7);
        expect(count).toBeLessThan(expected * 1.3);
      }
    });
  });

  describe("reset", () => {
    it("clears the reservoir", () => {
      const sampler = new ReservoirSampler<number>(5, 42);
      for (let i = 0; i < 10; i++) {
        sampler.push(i);
      }

      sampler.reset();

      expect(sampler.count).toBe(0);
      expect(sampler.size).toBe(0);
      expect(sampler.getSample()).toEqual([]);
    });
  });

  describe("validation", () => {
    it("throws for invalid k", () => {
      expect(() => new ReservoirSampler(0)).toThrow();
      expect(() => new ReservoirSampler(-1)).toThrow();
      expect(() => new ReservoirSampler(1.5)).toThrow();
    });
  });
});

describe("hashSeed", () => {
  it("produces consistent hash for same input", () => {
    expect(hashSeed("test")).toBe(hashSeed("test"));
    expect(hashSeed("hello world")).toBe(hashSeed("hello world"));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashSeed("a")).not.toBe(hashSeed("b"));
    expect(hashSeed("test1")).not.toBe(hashSeed("test2"));
  });

  it("produces 32-bit unsigned integers", () => {
    const hash = hashSeed("test");
    expect(Number.isInteger(hash)).toBe(true);
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThanOrEqual(4294967295);
  });

  it("handles empty string", () => {
    const hash = hashSeed("");
    expect(Number.isInteger(hash)).toBe(true);
    expect(hash).toBeGreaterThanOrEqual(0);
  });

  it("handles unicode", () => {
    const hash = hashSeed("hello");
    expect(Number.isInteger(hash)).toBe(true);
  });

  it("works well with SeededRandom", () => {
    const seed = hashSeed("user-123:experiment-A");
    const rng = new SeededRandom(seed);

    // Should produce valid random numbers
    const value = rng.next();
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);

    // Same user/experiment always gets same sequence
    const rng2 = new SeededRandom(hashSeed("user-123:experiment-A"));
    expect(rng2.next()).toBe(new SeededRandom(seed).next());
  });
});

describe("Distribution sampling", () => {
  describe("normalSample", () => {
    it("produces values centered around mean", () => {
      const rng = new SeededRandom(42);
      const samples: number[] = [];
      for (let i = 0; i < 10000; i++) {
        samples.push(normalSample(100, 15, () => rng.next()));
      }

      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(mean).toBeGreaterThan(98);
      expect(mean).toBeLessThan(102);
    });

    it("produces values with correct standard deviation", () => {
      const rng = new SeededRandom(42);
      const samples: number[] = [];
      for (let i = 0; i < 10000; i++) {
        samples.push(normalSample(0, 10, () => rng.next()));
      }

      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const variance =
        samples.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) /
        samples.length;
      const stddev = Math.sqrt(variance);

      expect(stddev).toBeGreaterThan(9);
      expect(stddev).toBeLessThan(11);
    });

    it("uses default mean=0 and stddev=1", () => {
      const rng = new SeededRandom(42);
      const samples: number[] = [];
      for (let i = 0; i < 10000; i++) {
        samples.push(normalSample(undefined, undefined, () => rng.next()));
      }

      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(Math.abs(mean)).toBeLessThan(0.1);
    });
  });

  describe("exponentialSample", () => {
    it("produces positive values", () => {
      const rng = new SeededRandom(42);
      for (let i = 0; i < 1000; i++) {
        expect(exponentialSample(1, () => rng.next())).toBeGreaterThan(0);
      }
    });

    it("produces values with correct mean (1/lambda)", () => {
      const rng = new SeededRandom(42);
      const lambda = 0.5;
      const samples: number[] = [];
      for (let i = 0; i < 10000; i++) {
        samples.push(exponentialSample(lambda, () => rng.next()));
      }

      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      // Mean should be 1/lambda = 2
      expect(mean).toBeGreaterThan(1.8);
      expect(mean).toBeLessThan(2.2);
    });

    it("throws for non-positive lambda", () => {
      expect(() => exponentialSample(0)).toThrow();
      expect(() => exponentialSample(-1)).toThrow();
    });
  });

  describe("poissonSample", () => {
    it("produces non-negative integers", () => {
      const rng = new SeededRandom(42);
      for (let i = 0; i < 1000; i++) {
        const value = poissonSample(5, () => rng.next());
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
    });

    it("produces values with correct mean", () => {
      const rng = new SeededRandom(42);
      const lambda = 10;
      const samples: number[] = [];
      for (let i = 0; i < 10000; i++) {
        samples.push(poissonSample(lambda, () => rng.next()));
      }

      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(mean).toBeGreaterThan(9.5);
      expect(mean).toBeLessThan(10.5);
    });

    it("throws for non-positive lambda", () => {
      expect(() => poissonSample(0)).toThrow();
      expect(() => poissonSample(-1)).toThrow();
    });

    it("handles large lambda (uses normal approximation)", () => {
      const rng = new SeededRandom(42);
      const lambda = 100; // Large lambda triggers normal approximation
      const samples: number[] = [];
      for (let i = 0; i < 1000; i++) {
        samples.push(poissonSample(lambda, () => rng.next()));
      }

      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(mean).toBeGreaterThan(95);
      expect(mean).toBeLessThan(105);
    });
  });

  describe("uniformSample", () => {
    it("produces values in [min, max)", () => {
      const rng = new SeededRandom(42);
      for (let i = 0; i < 1000; i++) {
        const value = uniformSample(10, 20, () => rng.next());
        expect(value).toBeGreaterThanOrEqual(10);
        expect(value).toBeLessThan(20);
      }
    });

    it("produces uniform distribution", () => {
      const rng = new SeededRandom(42);
      const samples: number[] = [];
      for (let i = 0; i < 10000; i++) {
        samples.push(uniformSample(0, 10, () => rng.next()));
      }

      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      // Mean of uniform(0, 10) should be 5
      expect(mean).toBeGreaterThan(4.8);
      expect(mean).toBeLessThan(5.2);
    });
  });
});

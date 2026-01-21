import {
  EWMA,
  exponentialMovingAverage,
  HoltSmoothing,
  movingAverage,
  SimpleExponentialSmoothing,
  weightedMovingAverage,
} from "../../../src/math/forecasting/ewma";

describe("EWMA", () => {
  describe("constructor", () => {
    it("creates with valid alpha", () => {
      const ewma = new EWMA({ alpha: 0.3 });
      expect(ewma.alpha).toBe(0.3);
      expect(ewma.value).toBeNull();
      expect(ewma.count).toBe(0);
    });

    it("accepts alpha of 1 (full weight to new value)", () => {
      const ewma = new EWMA({ alpha: 1 });
      expect(ewma.alpha).toBe(1);
    });

    it("accepts initial value", () => {
      const ewma = new EWMA({ alpha: 0.3, initialValue: 100 });
      expect(ewma.value).toBe(100);
    });

    it("throws for alpha <= 0", () => {
      expect(() => new EWMA({ alpha: 0 })).toThrow("Alpha must be in (0, 1]");
      expect(() => new EWMA({ alpha: -0.5 })).toThrow("Alpha must be in (0, 1]");
    });

    it("throws for alpha > 1", () => {
      expect(() => new EWMA({ alpha: 1.1 })).toThrow("Alpha must be in (0, 1]");
    });
  });

  describe("update", () => {
    it("returns first value unchanged", () => {
      const ewma = new EWMA({ alpha: 0.3 });
      expect(ewma.update(10)).toBe(10);
      expect(ewma.value).toBe(10);
      expect(ewma.count).toBe(1);
    });

    it("applies exponential smoothing formula", () => {
      const ewma = new EWMA({ alpha: 0.3 });

      ewma.update(10); // S_0 = 10
      const s1 = ewma.update(20); // S_1 = 0.3 * 20 + 0.7 * 10 = 13

      expect(s1).toBeCloseTo(13, 5);
      expect(ewma.value).toBeCloseTo(13, 5);
    });

    it("continues smoothing across multiple updates", () => {
      const ewma = new EWMA({ alpha: 0.3 });

      ewma.update(10); // 10
      ewma.update(20); // 13
      const s2 = ewma.update(15); // 0.3 * 15 + 0.7 * 13 = 13.6

      expect(s2).toBeCloseTo(13.6, 5);
    });

    it("with alpha=1, always returns latest value", () => {
      const ewma = new EWMA({ alpha: 1 });

      ewma.update(10);
      expect(ewma.update(20)).toBe(20);
      expect(ewma.update(5)).toBe(5);
    });

    it("with low alpha, is very smooth", () => {
      const ewma = new EWMA({ alpha: 0.1 });

      ewma.update(100);
      // Jump to 200 - should respond slowly
      const after = ewma.update(200);
      // 0.1 * 200 + 0.9 * 100 = 110
      expect(after).toBeCloseTo(110, 5);
    });

    it("increments count on each update", () => {
      const ewma = new EWMA({ alpha: 0.3 });

      ewma.update(1);
      ewma.update(2);
      ewma.update(3);

      expect(ewma.count).toBe(3);
    });

    it("handles negative values", () => {
      const ewma = new EWMA({ alpha: 0.5 });

      ewma.update(-10);
      const s1 = ewma.update(10);
      // 0.5 * 10 + 0.5 * (-10) = 0
      expect(s1).toBeCloseTo(0, 5);
    });

    it("is O(1) time and space", () => {
      const ewma = new EWMA({ alpha: 0.3 });

      // Process many values - should complete quickly
      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        ewma.update(Math.random());
      }
      const elapsed = performance.now() - start;

      // Should complete in under 100ms for 100k updates
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe("reset", () => {
    it("clears value and count", () => {
      const ewma = new EWMA({ alpha: 0.3 });

      ewma.update(10);
      ewma.update(20);
      ewma.reset();

      expect(ewma.value).toBeNull();
      expect(ewma.count).toBe(0);
    });

    it("accepts new initial value", () => {
      const ewma = new EWMA({ alpha: 0.3 });

      ewma.update(10);
      ewma.reset(50);

      expect(ewma.value).toBe(50);
      expect(ewma.count).toBe(0);
    });
  });
});

describe("SimpleExponentialSmoothing", () => {
  describe("constructor", () => {
    it("creates with valid alpha", () => {
      const ses = new SimpleExponentialSmoothing(0.3);
      expect(ses.alpha).toBe(0.3);
    });

    it("throws for invalid alpha", () => {
      expect(() => new SimpleExponentialSmoothing(0)).toThrow(
        "Alpha must be in (0, 1]"
      );
      expect(() => new SimpleExponentialSmoothing(1.5)).toThrow(
        "Alpha must be in (0, 1]"
      );
    });
  });

  describe("fit", () => {
    it("fits to data", () => {
      const ses = new SimpleExponentialSmoothing(0.3);
      ses.fit([10, 20, 30, 40, 50]);

      expect(ses.fittedValues.length).toBe(5);
      expect(ses.level).not.toBeNull();
    });

    it("first fitted value equals first observation", () => {
      const ses = new SimpleExponentialSmoothing(0.3);
      ses.fit([100, 200, 300]);

      expect(ses.fittedValues[0]).toBe(100);
    });

    it("throws for empty data", () => {
      const ses = new SimpleExponentialSmoothing(0.3);
      expect(() => ses.fit([])).toThrow("Data must not be empty");
    });

    it("handles single element", () => {
      const ses = new SimpleExponentialSmoothing(0.3);
      ses.fit([42]);

      expect(ses.fittedValues).toEqual([42]);
      expect(ses.level).toBe(42);
    });

    it("produces smoothed values", () => {
      const ses = new SimpleExponentialSmoothing(0.3);
      // Noisy data around 50
      ses.fit([50, 60, 45, 55, 48, 52, 50]);

      // Fitted values should be less volatile than original
      const originalVariance =
        [50, 60, 45, 55, 48, 52, 50].reduce((sum, v) => {
          const mean = 51.43;
          return sum + Math.pow(v - mean, 2);
        }, 0) / 7;

      const fittedMean =
        ses.fittedValues.reduce((a, b) => a + b, 0) / ses.fittedValues.length;
      const fittedVariance =
        ses.fittedValues.reduce(
          (sum, v) => sum + Math.pow(v - fittedMean, 2),
          0
        ) / ses.fittedValues.length;

      expect(fittedVariance).toBeLessThan(originalVariance);
    });
  });

  describe("forecast", () => {
    it("returns flat forecast", () => {
      const ses = new SimpleExponentialSmoothing(0.3);
      ses.fit([10, 20, 30]);

      const forecasts = ses.forecast(3);

      expect(forecasts.length).toBe(3);
      // All forecasts should be equal (flat)
      expect(forecasts[0]).toBe(forecasts[1]);
      expect(forecasts[1]).toBe(forecasts[2]);
    });

    it("forecast equals final level", () => {
      const ses = new SimpleExponentialSmoothing(0.3);
      ses.fit([10, 20, 30]);

      const forecasts = ses.forecast(1);

      expect(forecasts[0]).toBe(ses.level);
    });

    it("throws if not fitted", () => {
      const ses = new SimpleExponentialSmoothing(0.3);
      expect(() => ses.forecast(1)).toThrow(
        "Model must be fitted before forecasting"
      );
    });

    it("returns empty array for steps <= 0", () => {
      const ses = new SimpleExponentialSmoothing(0.3);
      ses.fit([10, 20, 30]);

      expect(ses.forecast(0)).toEqual([]);
      expect(ses.forecast(-1)).toEqual([]);
    });
  });
});

describe("HoltSmoothing", () => {
  describe("constructor", () => {
    it("creates with valid parameters", () => {
      const holt = new HoltSmoothing(0.3, 0.1);
      expect(holt.alpha).toBe(0.3);
      expect(holt.beta).toBe(0.1);
    });

    it("throws for invalid alpha", () => {
      expect(() => new HoltSmoothing(0, 0.1)).toThrow(
        "Alpha must be in (0, 1]"
      );
      expect(() => new HoltSmoothing(1.5, 0.1)).toThrow(
        "Alpha must be in (0, 1]"
      );
    });

    it("throws for invalid beta", () => {
      expect(() => new HoltSmoothing(0.3, 0)).toThrow("Beta must be in (0, 1]");
      expect(() => new HoltSmoothing(0.3, 1.5)).toThrow(
        "Beta must be in (0, 1]"
      );
    });
  });

  describe("fit", () => {
    it("fits to data with trend", () => {
      const holt = new HoltSmoothing(0.3, 0.1);
      holt.fit([10, 20, 30, 40, 50]);

      expect(holt.fittedValues.length).toBe(5);
      expect(holt.level).not.toBeNull();
      expect(holt.trend).not.toBeNull();
    });

    it("captures positive trend", () => {
      const holt = new HoltSmoothing(0.3, 0.1);
      holt.fit([10, 20, 30, 40, 50]);

      // Should have positive trend
      expect(holt.trend).toBeGreaterThan(0);
    });

    it("captures negative trend", () => {
      const holt = new HoltSmoothing(0.3, 0.1);
      holt.fit([50, 40, 30, 20, 10]);

      // Should have negative trend
      expect(holt.trend).toBeLessThan(0);
    });

    it("throws for data with fewer than 2 elements", () => {
      const holt = new HoltSmoothing(0.3, 0.1);
      expect(() => holt.fit([10])).toThrow(
        "Data must have at least 2 elements"
      );
      expect(() => holt.fit([])).toThrow("Data must have at least 2 elements");
    });
  });

  describe("forecast", () => {
    it("projects trend into forecast", () => {
      const holt = new HoltSmoothing(0.8, 0.2);
      holt.fit([10, 20, 30, 40, 50]);

      const forecasts = holt.forecast(3);

      expect(forecasts.length).toBe(3);
      // With positive trend, forecasts should be increasing
      expect(forecasts[1]).toBeGreaterThan(forecasts[0]);
      expect(forecasts[2]).toBeGreaterThan(forecasts[1]);
    });

    it("forecasts continue from last level", () => {
      const holt = new HoltSmoothing(0.3, 0.1);
      holt.fit([10, 20, 30]);

      const forecasts = holt.forecast(1);

      // First forecast = level + 1 * trend
      expect(forecasts[0]).toBeCloseTo(holt.level! + holt.trend!, 5);
    });

    it("throws if not fitted", () => {
      const holt = new HoltSmoothing(0.3, 0.1);
      expect(() => holt.forecast(1)).toThrow(
        "Model must be fitted before forecasting"
      );
    });

    it("returns empty array for steps <= 0", () => {
      const holt = new HoltSmoothing(0.3, 0.1);
      holt.fit([10, 20, 30]);

      expect(holt.forecast(0)).toEqual([]);
      expect(holt.forecast(-1)).toEqual([]);
    });
  });

  describe("reference comparison", () => {
    it("forecasts match expected pattern for linear trend", () => {
      // Perfect linear data: y = 10 + 5*x
      const data = [10, 15, 20, 25, 30];
      const holt = new HoltSmoothing(1, 1); // High alpha/beta to capture exact trend

      holt.fit(data);

      // With high smoothing, should capture the exact trend
      const forecasts = holt.forecast(3);

      // Should be close to 35, 40, 45
      expect(forecasts[0]).toBeCloseTo(35, 0);
      expect(forecasts[1]).toBeCloseTo(40, 0);
      expect(forecasts[2]).toBeCloseTo(45, 0);
    });
  });
});

describe("movingAverage", () => {
  it("calculates simple moving average", () => {
    const result = movingAverage([1, 2, 3, 4, 5], 3);

    // Averages: [1,2,3]=2, [2,3,4]=3, [3,4,5]=4
    expect(result).toEqual([2, 3, 4]);
  });

  it("returns single value for window = data length", () => {
    const result = movingAverage([1, 2, 3, 4, 5], 5);

    expect(result).toEqual([3]); // Average of all
  });

  it("handles window of 1", () => {
    const result = movingAverage([10, 20, 30], 1);

    expect(result).toEqual([10, 20, 30]); // Same as input
  });

  it("throws for window > data length", () => {
    expect(() => movingAverage([1, 2, 3], 5)).toThrow(
      "Window cannot be larger than data length"
    );
  });

  it("throws for window <= 0", () => {
    expect(() => movingAverage([1, 2, 3], 0)).toThrow(
      "Window must be a positive integer"
    );
    expect(() => movingAverage([1, 2, 3], -1)).toThrow(
      "Window must be a positive integer"
    );
  });

  it("throws for non-integer window", () => {
    expect(() => movingAverage([1, 2, 3], 1.5)).toThrow(
      "Window must be a positive integer"
    );
  });

  it("returns empty array for empty data", () => {
    expect(movingAverage([], 1)).toEqual([]);
  });
});

describe("weightedMovingAverage", () => {
  it("calculates weighted average", () => {
    // Weights: [1, 2, 3] means more weight to recent values
    const result = weightedMovingAverage([10, 20, 30, 40], [1, 2, 3]);

    // First: (10*1 + 20*2 + 30*3) / 6 = 140/6 = 23.33
    // Second: (20*1 + 30*2 + 40*3) / 6 = 200/6 = 33.33
    expect(result[0]).toBeCloseTo(23.333, 2);
    expect(result[1]).toBeCloseTo(33.333, 2);
  });

  it("with equal weights, matches simple moving average", () => {
    const data = [10, 20, 30, 40, 50];
    const weighted = weightedMovingAverage(data, [1, 1, 1]);
    const simple = movingAverage(data, 3);

    expect(weighted.length).toBe(simple.length);
    for (let i = 0; i < weighted.length; i++) {
      expect(weighted[i]).toBeCloseTo(simple[i], 5);
    }
  });

  it("throws for empty weights", () => {
    expect(() => weightedMovingAverage([1, 2, 3], [])).toThrow(
      "Weights array must not be empty"
    );
  });

  it("throws for weights longer than data", () => {
    expect(() => weightedMovingAverage([1, 2], [1, 1, 1])).toThrow(
      "Weights array cannot be larger than data length"
    );
  });

  it("throws for zero sum weights", () => {
    expect(() => weightedMovingAverage([1, 2, 3], [0, 0, 0])).toThrow(
      "Weights must sum to a non-zero value"
    );
  });

  it("returns empty array for empty data", () => {
    expect(weightedMovingAverage([], [1])).toEqual([]);
  });
});

describe("exponentialMovingAverage", () => {
  it("returns EMA values for array", () => {
    const result = exponentialMovingAverage([10, 20, 15, 25, 30], 0.3);

    expect(result.length).toBe(5);
    expect(result[0]).toBe(10); // First value unchanged
  });

  it("matches EWMA class behavior", () => {
    const data = [10, 20, 30, 40, 50];
    const alpha = 0.3;

    const ewma = new EWMA({ alpha });
    const classResults = data.map((v) => ewma.update(v));

    const functionResults = exponentialMovingAverage(data, alpha);

    for (let i = 0; i < data.length; i++) {
      expect(functionResults[i]).toBeCloseTo(classResults[i], 5);
    }
  });

  it("returns empty array for empty data", () => {
    expect(exponentialMovingAverage([], 0.3)).toEqual([]);
  });
});

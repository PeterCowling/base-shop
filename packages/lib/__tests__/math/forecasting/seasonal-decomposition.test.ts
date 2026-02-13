import {
  decomposeAdditive,
  decomposeMultiplicative,
} from "../../../src/math/forecasting/seasonal-decomposition";

describe("Seasonal Decomposition", () => {
  describe("decomposeAdditive", () => {
    it("VC-HW-01-01: Reconstruction on finite indices - additive max abs error < 1e-8", () => {
      // Synthetic seasonal data: data[t] = 100 + 2*t + 10*sin(2*PI*t/m)
      const m = 12;
      const n = 48;
      const data: number[] = [];

      for (let t = 0; t < n; t++) {
        const trend = 100 + 2 * t;
        const seasonal = 10 * Math.sin((2 * Math.PI * t) / m);
        data.push(trend + seasonal);
      }

      const result = decomposeAdditive(data, m);

      // Verify result structure
      expect(result.trend.length).toBe(n);
      expect(result.seasonal.length).toBe(n);
      expect(result.seasonalIndices.length).toBe(m);
      expect(result.remainder.length).toBe(n);

      // Verify reconstruction only on finite indices
      let maxError = 0;
      for (let t = 0; t < n; t++) {
        if (Number.isFinite(result.trend[t]) && Number.isFinite(result.remainder[t])) {
          const reconstructed = result.trend[t] + result.seasonal[t];
          const error = Math.abs(data[t] - reconstructed);
          maxError = Math.max(maxError, error);
        }
      }

      expect(maxError).toBeLessThan(1e-8);
    });

    it("VC-HW-01-02: Even-period centering for m=12 (verify alignment)", () => {
      const m = 12;
      const n = 48;
      const data: number[] = [];

      for (let t = 0; t < n; t++) {
        data.push(100 + 2 * t + 10 * Math.sin((2 * Math.PI * t) / m));
      }

      const result = decomposeAdditive(data, m);

      // For even m=12, we need (m/2) points on each side for centered MA
      // So trend should be NaN at edges: [0..5] and [42..47] for n=48
      const edgeSize = m / 2;

      for (let t = 0; t < edgeSize; t++) {
        expect(Number.isNaN(result.trend[t])).toBe(true);
        expect(Number.isNaN(result.remainder[t])).toBe(true);
      }

      for (let t = n - edgeSize; t < n; t++) {
        expect(Number.isNaN(result.trend[t])).toBe(true);
        expect(Number.isNaN(result.remainder[t])).toBe(true);
      }

      // Middle values should be finite
      for (let t = edgeSize; t < n - edgeSize; t++) {
        expect(Number.isFinite(result.trend[t])).toBe(true);
        expect(Number.isFinite(result.remainder[t])).toBe(true);
      }
    });

    it("VC-HW-01-03: Arrays preserve original length with NaN edges", () => {
      const m = 7; // Odd period
      const n = 35;
      const data: number[] = [];

      for (let t = 0; t < n; t++) {
        data.push(100 + t + 5 * Math.sin((2 * Math.PI * t) / m));
      }

      const result = decomposeAdditive(data, m);

      // All arrays should have length n
      expect(result.trend.length).toBe(n);
      expect(result.seasonal.length).toBe(n);
      expect(result.remainder.length).toBe(n);
      expect(result.seasonalIndices.length).toBe(m);

      // For odd m=7, we need (m-1)/2 = 3 points on each side
      const edgeSize = (m - 1) / 2;

      // Check edges are NaN
      for (let t = 0; t < edgeSize; t++) {
        expect(Number.isNaN(result.trend[t])).toBe(true);
      }

      for (let t = n - edgeSize; t < n; t++) {
        expect(Number.isNaN(result.trend[t])).toBe(true);
      }
    });

    it("validates seasonal indices are normalized (mean ~ 0)", () => {
      const m = 12;
      const n = 48;
      const data: number[] = [];

      for (let t = 0; t < n; t++) {
        data.push(100 + 2 * t + 10 * Math.sin((2 * Math.PI * t) / m));
      }

      const result = decomposeAdditive(data, m);

      // Seasonal indices should have mean approximately 0
      const mean =
        result.seasonalIndices.reduce((a, b) => a + b, 0) /
        result.seasonalIndices.length;

      expect(Math.abs(mean)).toBeLessThan(1e-10);
    });

    it("throws for invalid seasonal period", () => {
      const data = [1, 2, 3, 4, 5, 6];

      expect(() => decomposeAdditive(data, 1)).toThrow(
        "Seasonal period must be at least 2"
      );
      expect(() => decomposeAdditive(data, 1.5)).toThrow(
        "Seasonal period must be an integer"
      );
    });

    it("throws for insufficient data length", () => {
      const data = [1, 2, 3, 4, 5];
      const m = 4;

      // n=5 < 2*m=8
      expect(() => decomposeAdditive(data, m)).toThrow(
        "Data length (5) must be at least 2 * seasonal period (4)"
      );
    });
  });

  describe("decomposeMultiplicative", () => {
    it("VC-HW-01-01: Reconstruction on finite indices - multiplicative max abs error < 1e-8", () => {
      // Synthetic multiplicative seasonal data: data[t] = (100 + 2*t) * (1 + 0.1*sin(2*PI*t/m))
      // Using smaller seasonal amplitude (0.1 instead of 0.3) for cleaner decomposition
      const m = 12;
      const n = 48;
      const data: number[] = [];

      for (let t = 0; t < n; t++) {
        const trend = 100 + 2 * t;
        const seasonalFactor = 1 + 0.1 * Math.sin((2 * Math.PI * t) / m);
        data.push(trend * seasonalFactor);
      }

      const result = decomposeMultiplicative(data, m);

      // Verify result structure
      expect(result.trend.length).toBe(n);
      expect(result.seasonal.length).toBe(n);
      expect(result.seasonalIndices.length).toBe(m);
      expect(result.remainder.length).toBe(n);

      // Verify reconstruction: data[t] ≈ trend[t] * seasonal[t] * remainder[t]
      // For multiplicative model, full reconstruction includes remainder
      let maxError = 0;
      for (let t = 0; t < n; t++) {
        if (Number.isFinite(result.trend[t]) && Number.isFinite(result.remainder[t])) {
          const reconstructed = result.trend[t] * result.seasonal[t] * result.remainder[t];
          const error = Math.abs(data[t] - reconstructed);
          maxError = Math.max(maxError, error);
        }
      }

      expect(maxError).toBeLessThan(1e-8);
    });

    it("validates seasonal indices are normalized (mean ~ 1)", () => {
      const m = 12;
      const n = 48;
      const data: number[] = [];

      for (let t = 0; t < n; t++) {
        const trend = 100 + 2 * t;
        const seasonalFactor = 1 + 0.1 * Math.sin((2 * Math.PI * t) / m);
        data.push(trend * seasonalFactor);
      }

      const result = decomposeMultiplicative(data, m);

      // Seasonal indices should have mean approximately 1
      const mean =
        result.seasonalIndices.reduce((a, b) => a + b, 0) /
        result.seasonalIndices.length;

      expect(Math.abs(mean - 1)).toBeLessThan(1e-10);
    });

    it("VC-HW-01-04: Multiplicative throws when any value <= 0", () => {
      const data1 = [1, 2, 3, 0, 5, 6, 7, 8];
      const data2 = [1, 2, 3, -1, 5, 6, 7, 8];
      const data3 = [0, 1, 2, 3, 4, 5, 6, 7];

      expect(() => decomposeMultiplicative(data1, 4)).toThrow(
        "Multiplicative decomposition requires all data values > 0"
      );
      expect(() => decomposeMultiplicative(data2, 4)).toThrow(
        "Multiplicative decomposition requires all data values > 0"
      );
      expect(() => decomposeMultiplicative(data3, 4)).toThrow(
        "Multiplicative decomposition requires all data values > 0"
      );
    });

    it("handles positive data correctly", () => {
      const m = 4;
      const n = 16;
      const data: number[] = [];

      for (let t = 0; t < n; t++) {
        const trend = 50 + t;
        const seasonalFactor = 1 + 0.1 * Math.sin((2 * Math.PI * t) / m);
        data.push(trend * seasonalFactor);
      }

      const result = decomposeMultiplicative(data, m);

      // Should complete without error
      expect(result.trend.length).toBe(n);
      expect(result.seasonal.length).toBe(n);
      expect(result.remainder.length).toBe(n);

      // All seasonalIndices should be positive
      for (const factor of result.seasonalIndices) {
        expect(factor).toBeGreaterThan(0);
      }
    });
  });
});

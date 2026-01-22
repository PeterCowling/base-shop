import { covariance, pearson, spearman } from "../correlation";

describe("Correlation Statistics", () => {
  describe("covariance", () => {
    it("calculates positive covariance for positively related data", () => {
      const xs = [1, 2, 3, 4, 5];
      const ys = [2, 4, 6, 8, 10];
      expect(covariance(xs, ys)).toBeGreaterThan(0);
    });

    it("calculates negative covariance for negatively related data", () => {
      const xs = [1, 2, 3, 4, 5];
      const ys = [10, 8, 6, 4, 2];
      expect(covariance(xs, ys)).toBeLessThan(0);
    });

    it("calculates zero covariance for uncorrelated data", () => {
      const xs = [1, 2, 3, 4, 5];
      const ys = [5, 5, 5, 5, 5]; // constant
      expect(covariance(xs, ys)).toBe(0);
    });

    it("calculates population covariance by default", () => {
      const xs = [1, 2, 3];
      const ys = [1, 2, 3];
      // Population: sum((x-xmean)(y-ymean)) / n
      // (1-2)(1-2) + (2-2)(2-2) + (3-2)(3-2) = 1 + 0 + 1 = 2
      // Cov = 2/3 = 0.666...
      expect(covariance(xs, ys)).toBeCloseTo(0.666, 2);
    });

    it("calculates sample covariance when sample=true", () => {
      const xs = [1, 2, 3];
      const ys = [1, 2, 3];
      // Sample: sum((x-xmean)(y-ymean)) / (n-1)
      // Cov = 2/2 = 1
      expect(covariance(xs, ys, true)).toBe(1);
    });

    it("returns NaN for empty arrays", () => {
      expect(covariance([], [])).toBeNaN();
    });

    it("returns NaN for arrays of different lengths", () => {
      expect(covariance([1, 2, 3], [1, 2])).toBeNaN();
    });

    it("returns 0 for single element arrays", () => {
      expect(covariance([1], [2])).toBe(0);
    });
  });

  describe("pearson", () => {
    it("returns 1 for perfect positive correlation", () => {
      const xs = [1, 2, 3, 4, 5];
      const ys = [2, 4, 6, 8, 10];
      expect(pearson(xs, ys)).toBeCloseTo(1, 10);
    });

    it("returns -1 for perfect negative correlation", () => {
      const xs = [1, 2, 3, 4, 5];
      const ys = [5, 4, 3, 2, 1];
      expect(pearson(xs, ys)).toBeCloseTo(-1, 10);
    });

    it("returns approximately 0 for uncorrelated data", () => {
      const xs = [1, 2, 3, 4, 5, 6, 7, 8];
      const ys = [5, 3, 7, 2, 8, 4, 6, 1];
      expect(Math.abs(pearson(xs, ys))).toBeLessThan(0.5);
    });

    it("returns NaN for constant array (zero variance)", () => {
      const xs = [1, 1, 1];
      const ys = [1, 2, 3];
      expect(pearson(xs, ys)).toBeNaN();
    });

    it("returns NaN for both constant arrays", () => {
      const xs = [5, 5, 5];
      const ys = [3, 3, 3];
      expect(pearson(xs, ys)).toBeNaN();
    });

    it("returns NaN for empty arrays", () => {
      expect(pearson([], [])).toBeNaN();
    });

    it("returns NaN for arrays of different lengths", () => {
      expect(pearson([1, 2, 3], [1, 2])).toBeNaN();
    });

    it("handles large values without overflow", () => {
      const xs = [1e10, 2e10, 3e10];
      const ys = [1e10, 2e10, 3e10];
      expect(pearson(xs, ys)).toBeCloseTo(1, 10);
    });
  });

  describe("spearman", () => {
    it("returns 1 for perfect monotonic positive relationship", () => {
      const xs = [1, 2, 3, 4, 5];
      const ys = [2, 4, 6, 8, 10];
      expect(spearman(xs, ys)).toBeCloseTo(1, 10);
    });

    it("returns 1 for non-linear but monotonic relationship", () => {
      const xs = [1, 2, 3, 4, 5];
      const ys = [1, 8, 27, 64, 125]; // y = x^3
      expect(spearman(xs, ys)).toBeCloseTo(1, 10);
    });

    it("returns -1 for perfect monotonic negative relationship", () => {
      const xs = [1, 2, 3, 4, 5];
      const ys = [5, 4, 3, 2, 1];
      expect(spearman(xs, ys)).toBeCloseTo(-1, 10);
    });

    it("returns NaN for empty arrays", () => {
      expect(spearman([], [])).toBeNaN();
    });

    it("returns NaN for arrays of different lengths", () => {
      expect(spearman([1, 2, 3], [1, 2])).toBeNaN();
    });

    it("handles ties correctly (average rank)", () => {
      // xs: [1, 2, 2, 4] -> ranks: [1, 2.5, 2.5, 4]
      // ys: [1, 2, 3, 4] -> ranks: [1, 2, 3, 4]
      const xs = [1, 2, 2, 4];
      const ys = [1, 2, 3, 4];
      const result = spearman(xs, ys);
      expect(result).toBeGreaterThan(0.9); // Strong positive correlation
      expect(result).toBeLessThanOrEqual(1);
    });

    it("handles all ties (constant array)", () => {
      const xs = [5, 5, 5, 5];
      const ys = [1, 2, 3, 4];
      // When xs are all tied, their ranks are all the same
      // This creates zero variance in x ranks, so pearson returns NaN
      expect(spearman(xs, ys)).toBeNaN();
    });
  });
});

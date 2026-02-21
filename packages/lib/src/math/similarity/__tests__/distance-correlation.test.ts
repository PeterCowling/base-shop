import { distanceCorrelation } from "../distance-correlation.js";

describe("distanceCorrelation", () => {
  it("returns NaN for invalid inputs in default mode", () => {
    expect(distanceCorrelation([], [])).toBeNaN();
    expect(distanceCorrelation([1, 2, 3], [1, 2])).toBeNaN();
    expect(distanceCorrelation([1, Number.NaN], [1, 2])).toBeNaN();
  });

  it("throws in strict mode for invalid inputs", () => {
    expect(() => distanceCorrelation([1, 2], [1], { strict: true })).toThrow(
      RangeError
    );
  });

  it("returns high dependence for perfect linear relationship", () => {
    const xs = [1, 2, 3, 4, 5, 6, 7, 8];
    const ys = [2, 4, 6, 8, 10, 12, 14, 16];

    expect(distanceCorrelation(xs, ys)).toBeGreaterThan(0.95);
  });

  it("detects nonlinear dependence where Pearson can miss signal", () => {
    const xs = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    const ys = xs.map((x) => x * x);

    expect(distanceCorrelation(xs, ys)).toBeGreaterThan(0.45);
  });

  it("returns low dependence for independent deterministic fixture", () => {
    const n = 30;
    const xs = Array.from({ length: n }, (_, i) => i + 1);
    const ys = Array.from({ length: n }, (_, i) => ((i * 17) % n) + 1);

    expect(distanceCorrelation(xs, ys)).toBeLessThan(0.25);
  });

  it("returns NaN for constant-array variance collapse", () => {
    expect(distanceCorrelation([1, 1, 1, 1], [1, 2, 3, 4])).toBeNaN();
  });
});

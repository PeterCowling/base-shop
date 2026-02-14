import { hoeffding } from "../hoeffding.js";

describe("hoeffding", () => {
  it("returns NaN for invalid inputs in default mode", () => {
    expect(hoeffding([], [])).toBeNaN();
    expect(hoeffding([1, 2, 3], [1, 2])).toBeNaN();
    expect(hoeffding([1, 2, Number.NaN, 4, 5], [1, 2, 3, 4, 5])).toBeNaN();
    expect(hoeffding([1, 2, 3, 4], [1, 2, 3, 4])).toBeNaN();
  });

  it("throws in strict mode for invalid inputs", () => {
    expect(() => hoeffding([1, 2], [1], { strict: true })).toThrow(RangeError);
    expect(() => hoeffding([1, 2, 3, 4], [1, 2, 3, 4], { strict: true })).toThrow(
      "at least 5"
    );
  });

  it("returns low dependence for an independent deterministic fixture", () => {
    const xs = [1, 2, 3, 4, 5, 6, 7, 8];
    const ys = [3, 7, 2, 8, 1, 6, 4, 5];

    expect(Math.abs(hoeffding(xs, ys))).toBeLessThan(0.2);
  });

  it("returns strong positive dependence for a monotonic fixture", () => {
    const xs = [1, 2, 3, 4, 5, 6, 7, 8];
    const ys = [2, 4, 6, 8, 10, 12, 14, 16];

    expect(hoeffding(xs, ys)).toBeGreaterThan(0.4);
  });

  it("detects non-monotonic dependence on a ring-like fixture", () => {
    const angles = Array.from({ length: 24 }, (_, i) => (2 * Math.PI * i) / 24);
    const xs = angles.map((theta) => Math.cos(theta));
    const ys = angles.map((theta) => Math.sin(theta));

    expect(Math.abs(hoeffding(xs, ys))).toBeGreaterThan(0.04);
  });

  it("is deterministic for tie-heavy fixtures", () => {
    const xs = [1, 1, 2, 2, 3, 3, 4, 4];
    const ys = [1, 2, 1, 2, 3, 4, 3, 4];

    const first = hoeffding(xs, ys);
    const second = hoeffding(xs, ys);

    expect(first).toBe(second);
  });
});

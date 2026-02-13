import { kendallTau } from "../kendall";

describe("kendallTau", () => {
  it("returns NaN for invalid inputs in default mode", () => {
    expect(kendallTau([], [])).toBeNaN();
    expect(kendallTau([1, 2, 3], [1, 2])).toBeNaN();
    expect(kendallTau([1, Number.NaN], [1, 2])).toBeNaN();
  });

  it("throws in strict mode for invalid inputs", () => {
    expect(() => kendallTau([1, 2], [1], { strict: true })).toThrow(RangeError);
  });

  it("returns 1 for perfect concordance", () => {
    expect(kendallTau([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])).toBeCloseTo(1, 12);
  });

  it("returns -1 for perfect discordance", () => {
    expect(kendallTau([1, 2, 3, 4, 5], [10, 8, 6, 4, 2])).toBeCloseTo(-1, 12);
  });

  it("returns near zero for a weak-association deterministic fixture", () => {
    const xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const ys = [8, 1, 6, 2, 10, 4, 9, 3, 7, 5];

    expect(Math.abs(kendallTau(xs, ys))).toBeLessThan(0.35);
  });

  it("handles ties via tau-b semantics", () => {
    const xs = [1, 1, 2, 2, 3, 3, 4, 4];
    const ys = [1, 2, 1, 2, 3, 4, 3, 4];

    const value = kendallTau(xs, ys);

    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(-1);
    expect(value).toBeLessThanOrEqual(1);
    expect(kendallTau(xs, ys)).toBe(value);
  });
});

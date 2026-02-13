import {
  normalizedMutualInformationBinned,
  normalizedMutualInformationDiscrete,
} from "../mutual-information";

describe("normalizedMutualInformationDiscrete", () => {
  it("returns NaN for invalid inputs in default mode", () => {
    expect(normalizedMutualInformationDiscrete([], [])).toBeNaN();
    expect(normalizedMutualInformationDiscrete([1, 2, 3], [1, 2])).toBeNaN();
    expect(normalizedMutualInformationDiscrete([1, Number.NaN], [1, 2])).toBeNaN();
  });

  it("throws in strict mode for invalid inputs", () => {
    expect(() =>
      normalizedMutualInformationDiscrete([1, 2], [1], { strict: true })
    ).toThrow(RangeError);
  });

  it("returns near 0 for an independent discrete fixture", () => {
    const xs = Array.from({ length: 80 }, (_, i) => i % 8);
    const ys = Array.from({ length: 80 }, (_, i) => Math.floor(i / 8));

    expect(normalizedMutualInformationDiscrete(xs, ys)).toBeLessThanOrEqual(
      0.2
    );
  });

  it("returns near 1 for a bijective mapping", () => {
    const xs = Array.from({ length: 120 }, (_, i) => i % 12);
    const ys = xs.map((value) => (value * 5 + 7) % 12);

    const value = normalizedMutualInformationDiscrete(xs, ys);

    expect(value).toBeGreaterThanOrEqual(0.99);
    expect(value).toBeLessThanOrEqual(1);
  });

  it("returns high but less than 1 for many-to-one mapping", () => {
    const xs = Array.from({ length: 120 }, (_, i) => i % 12);
    const ys = xs.map((value) => Math.floor(value / 3));

    const value = normalizedMutualInformationDiscrete(xs, ys);

    expect(value).toBeGreaterThanOrEqual(0.65);
    expect(value).toBeLessThan(0.95);
  });

  it("handles constant-entropy edge cases deterministically", () => {
    expect(normalizedMutualInformationDiscrete([1, 1, 1], [2, 2, 2])).toBe(1);
    expect(normalizedMutualInformationDiscrete([1, 1, 1], [1, 2, 3])).toBe(0);
  });
});

describe("normalizedMutualInformationBinned", () => {
  function buildHeavyTailFixture(length = 200): {
    xs: number[];
    ys: number[];
    ysWithOutliers: number[];
  } {
    const xs = Array.from(
      { length },
      (_, i) => Math.exp((i % 60) / 10) + (i % 7) * 0.1
    );
    const ys = xs.map((value, i) => value * 1.8 + (i % 5 - 2) * 0.5);
    const ysWithOutliers = ys.map((value, i) => (i % 40 === 0 ? value * 60 : value));
    return { xs, ys, ysWithOutliers };
  }

  it("returns NaN for invalid inputs in default mode", () => {
    expect(normalizedMutualInformationBinned([], [])).toBeNaN();
    expect(normalizedMutualInformationBinned([1, 2], [1])).toBeNaN();
    expect(normalizedMutualInformationBinned([1, Number.NaN], [1, 2])).toBeNaN();
    expect(normalizedMutualInformationBinned([1, 2], [1, 2], { bins: 1 })).toBeNaN();
  });

  it("throws in strict mode for invalid inputs", () => {
    expect(() =>
      normalizedMutualInformationBinned([1, 2], [1], { strict: true })
    ).toThrow(RangeError);
  });

  it("is deterministic across repeated evaluations", () => {
    const { xs, ys } = buildHeavyTailFixture();

    const first = normalizedMutualInformationBinned(xs, ys, {
      binning: "quantile",
      bins: 12,
    });
    const second = normalizedMutualInformationBinned(xs, ys, {
      binning: "quantile",
      bins: 12,
    });

    expect(second).toBe(first);
  });

  it("keeps quantile binning more stable than equal-width under outliers", () => {
    const { xs, ys, ysWithOutliers } = buildHeavyTailFixture();

    const equalWidthBase = normalizedMutualInformationBinned(xs, ys, {
      binning: "equalWidth",
      bins: 12,
    });
    const quantileBase = normalizedMutualInformationBinned(xs, ys, {
      binning: "quantile",
      bins: 12,
    });
    const equalWidthOutlier = normalizedMutualInformationBinned(
      xs,
      ysWithOutliers,
      { binning: "equalWidth", bins: 12 }
    );
    const quantileOutlier = normalizedMutualInformationBinned(
      xs,
      ysWithOutliers,
      { binning: "quantile", bins: 12 }
    );

    const equalWidthDelta = Math.abs(equalWidthBase - equalWidthOutlier);
    const quantileDelta = Math.abs(quantileBase - quantileOutlier);

    expect(quantileDelta).toBeLessThan(equalWidthDelta);
  });
});

import {
  distanceCorrelation,
  jensenShannonDistance,
  jensenShannonDivergence,
  kendallTau,
  normalizedMutualInformationBinned,
  normalizedMutualInformationDiscrete,
} from "../index.js";

describe("similarity module integration behavior", () => {
  it("shows metric divergence between monotonic and non-monotonic dependence", () => {
    const xs = Array.from({ length: 80 }, (_, i) => i + 1);
    const monotonicYs = xs.map((value) => value * 3 + 2);
    const nonMonotonicYs = xs.map((value) => Math.sin(value / 5));

    const monotonicKendall = kendallTau(xs, monotonicYs);
    const monotonicDistanceCorrelation = distanceCorrelation(xs, monotonicYs);
    const nonMonotonicKendall = kendallTau(xs, nonMonotonicYs);
    const nonMonotonicDistanceCorrelation = distanceCorrelation(
      xs,
      nonMonotonicYs
    );

    expect(monotonicKendall).toBeGreaterThan(0.95);
    expect(monotonicDistanceCorrelation).toBeGreaterThan(0.95);

    expect(Math.abs(nonMonotonicKendall)).toBeLessThan(0.1);
    expect(nonMonotonicDistanceCorrelation).toBeGreaterThan(0.2);
  });

  it("keeps baseline bounded behavior across information metrics", () => {
    const independentX = Array.from({ length: 80 }, (_, i) => i % 8);
    const independentY = Array.from({ length: 80 }, (_, i) => Math.floor(i / 8));
    const binnedX = Array.from({ length: 120 }, (_, i) => i + 1);
    const binnedY = binnedX.map((value) => Math.sin(value / 6));

    const nmiIndependent = normalizedMutualInformationDiscrete(
      independentX,
      independentY
    );
    const nmiBinned = normalizedMutualInformationBinned(binnedX, binnedY);
    const jsd = jensenShannonDivergence([1, 0, 0], [0, 0, 1]);

    expect(nmiIndependent).toBeLessThanOrEqual(0.2);
    expect(nmiBinned).toBeGreaterThan(0);
    expect(nmiBinned).toBeLessThanOrEqual(1);
    expect(jsd).toBeCloseTo(1, 10);
  });

  it("keeps README examples executable and stable", () => {
    expect(kendallTau([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])).toBeCloseTo(1, 12);
    expect(
      distanceCorrelation([1, 2, 3, 4, 5, 6], [1, 4, 9, 16, 25, 36])
    ).toBeGreaterThan(0.95);
    expect(
      normalizedMutualInformationDiscrete(
        [0, 0, 1, 1, 2, 2],
        [0, 0, 1, 1, 2, 2]
      )
    ).toBeCloseTo(1, 12);
    expect(jensenShannonDistance([1, 0, 0], [0, 0, 1])).toBeCloseTo(1, 10);
  });
});

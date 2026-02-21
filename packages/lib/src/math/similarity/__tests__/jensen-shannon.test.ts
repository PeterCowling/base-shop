import {
  jensenShannonDistance,
  jensenShannonDivergence,
} from "../jensen-shannon.js";

describe("jensenShannonDivergence", () => {
  it("returns NaN for invalid inputs in default mode", () => {
    expect(jensenShannonDivergence([], [])).toBeNaN();
    expect(jensenShannonDivergence([1, 2], [1])).toBeNaN();
    expect(jensenShannonDivergence([1, -1], [1, 2])).toBeNaN();
    expect(jensenShannonDivergence([0, 0], [0, 0])).toBeNaN();
  });

  it("throws in strict mode for invalid inputs", () => {
    expect(() =>
      jensenShannonDivergence([1, 2], [1], { strict: true })
    ).toThrow(RangeError);
  });

  it("returns 0 for identical distributions", () => {
    expect(jensenShannonDivergence([0.5, 0.5], [0.5, 0.5])).toBeCloseTo(0, 12);
  });

  it("returns 1 for disjoint binary-support distributions", () => {
    expect(jensenShannonDivergence([1, 0, 0], [0, 0, 1])).toBeCloseTo(1, 10);
  });

  it("is symmetric", () => {
    const p = [1, 4, 2, 3];
    const q = [2, 1, 3, 4];

    expect(jensenShannonDivergence(p, q)).toBeCloseTo(
      jensenShannonDivergence(q, p),
      12
    );
  });

  it("auto-normalizes count vectors", () => {
    expect(jensenShannonDivergence([5, 5], [5, 5])).toBeCloseTo(0, 12);
    expect(jensenShannonDivergence([10, 0], [0, 10])).toBeCloseTo(1, 10);
  });
});

describe("jensenShannonDistance", () => {
  it("is sqrt of divergence", () => {
    const p = [1, 2, 3];
    const q = [3, 2, 1];
    const divergence = jensenShannonDivergence(p, q);

    expect(jensenShannonDistance(p, q)).toBeCloseTo(Math.sqrt(divergence), 12);
  });
});

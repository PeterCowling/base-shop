import {
  sampleSizeForProportions,
  type SampleSizeForProportionsOptions,
} from "../../../src/math/experimentation/sample-size";

function expectWithinPercent(
  value: number,
  expected: number,
  tolerancePercent: number
): void {
  const tolerance = expected * tolerancePercent;
  expect(value).toBeGreaterThanOrEqual(expected - tolerance);
  expect(value).toBeLessThanOrEqual(expected + tolerance);
}

function buildOptions(
  overrides: Partial<SampleSizeForProportionsOptions> = {}
): SampleSizeForProportionsOptions {
  return {
    baselineRate: 0.05,
    minimumDetectableEffect: 0.01,
    alpha: 0.05,
    power: 0.8,
    ...overrides,
  };
}

describe("sampleSizeForProportions", () => {
  test("TC-02-01: two-sided sample size is within reference tolerance", () => {
    const result = sampleSizeForProportions(buildOptions({ alternative: "two-sided" }));
    expectWithinPercent(result.samplesPerVariant, 8155, 0.02);
    expect(result.totalSamples).toBe(result.samplesPerVariant * 2);
  });

  test("TC-02-02: one-sided sample size is within reference tolerance", () => {
    const result = sampleSizeForProportions(buildOptions({ alternative: "greater" }));
    expectWithinPercent(result.samplesPerVariant, 6424, 0.02);
    expect(result.totalSamples).toBe(result.samplesPerVariant * 2);
  });

  test("default alternative matches explicit two-sided", () => {
    const withDefault = sampleSizeForProportions(buildOptions());
    const twoSided = sampleSizeForProportions(buildOptions({ alternative: "two-sided" }));
    expect(withDefault).toEqual(twoSided);
  });

  test("one-sided less alternative matches greater for symmetric planning", () => {
    const greater = sampleSizeForProportions(buildOptions({ alternative: "greater" }));
    const less = sampleSizeForProportions(buildOptions({ alternative: "less" }));
    expect(less).toEqual(greater);
  });

  test("smaller MDE requires more samples", () => {
    const largerEffect = sampleSizeForProportions(
      buildOptions({ minimumDetectableEffect: 0.02 })
    );
    const smallerEffect = sampleSizeForProportions(
      buildOptions({ minimumDetectableEffect: 0.005 })
    );
    expect(smallerEffect.samplesPerVariant).toBeGreaterThan(largerEffect.samplesPerVariant);
  });

  test("TC-02-03: zero minimumDetectableEffect throws RangeError", () => {
    expect(() =>
      sampleSizeForProportions(buildOptions({ minimumDetectableEffect: 0 }))
    ).toThrow(RangeError);
  });

  test("negative minimumDetectableEffect throws RangeError", () => {
    expect(() =>
      sampleSizeForProportions(buildOptions({ minimumDetectableEffect: -0.01 }))
    ).toThrow(RangeError);
  });

  test("TC-02-04: invalid alpha values throw RangeError", () => {
    expect(() => sampleSizeForProportions(buildOptions({ alpha: 0 }))).toThrow(RangeError);
    expect(() => sampleSizeForProportions(buildOptions({ alpha: 1 }))).toThrow(RangeError);
  });

  test("TC-02-04: invalid power values throw RangeError", () => {
    expect(() => sampleSizeForProportions(buildOptions({ power: 0 }))).toThrow(RangeError);
    expect(() => sampleSizeForProportions(buildOptions({ power: 1 }))).toThrow(RangeError);
  });

  test("baselineRate outside (0, 1) throws RangeError", () => {
    expect(() =>
      sampleSizeForProportions(buildOptions({ baselineRate: 0 }))
    ).toThrow(RangeError);
    expect(() =>
      sampleSizeForProportions(buildOptions({ baselineRate: 1 }))
    ).toThrow(RangeError);
    expect(() =>
      sampleSizeForProportions(buildOptions({ baselineRate: -0.1 }))
    ).toThrow(RangeError);
    expect(() =>
      sampleSizeForProportions(buildOptions({ baselineRate: 1.1 }))
    ).toThrow(RangeError);
  });

  test("treatment rate outside (0, 1) throws RangeError", () => {
    expect(() =>
      sampleSizeForProportions(buildOptions({ baselineRate: 0.99, minimumDetectableEffect: 0.02 }))
    ).toThrow(RangeError);
  });

  test("invalid alternative value throws RangeError", () => {
    expect(() =>
      sampleSizeForProportions(
        buildOptions({
          alternative: "invalid" as SampleSizeForProportionsOptions["alternative"],
        })
      )
    ).toThrow(RangeError);
  });
});

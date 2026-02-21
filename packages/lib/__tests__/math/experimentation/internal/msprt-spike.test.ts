import {
  msprtSpikeEValue,
  runMsprtSpikeExperiment,
  simulateMsprtSpikeNullType1,
} from "../../../../src/math/experimentation/internal/msprt-spike";

describe("msprt-spike", () => {
  test("TC-09-01: e-value for equal arms is finite and positive", () => {
    const result = msprtSpikeEValue({
      controlSuccesses: 50,
      controlTotal: 1000,
      treatmentSuccesses: 50,
      treatmentTotal: 1000,
      tau: 0.1,
    });

    expect(Number.isFinite(result.logEValue)).toBe(true);
    expect(result.eValue).toBeGreaterThan(0);
    expect(Number.isNaN(result.eValue)).toBe(false);
  });

  test("larger treatment lift gives stronger evidence than equal-arm case", () => {
    const equal = msprtSpikeEValue({
      controlSuccesses: 50,
      controlTotal: 1000,
      treatmentSuccesses: 50,
      treatmentTotal: 1000,
      tau: 0.1,
    });
    const lift = msprtSpikeEValue({
      controlSuccesses: 50,
      controlTotal: 1000,
      treatmentSuccesses: 80,
      treatmentTotal: 1000,
      tau: 0.1,
    });

    expect(lift.logEValue).toBeGreaterThan(equal.logEValue);
    expect(lift.eValue).toBeGreaterThan(equal.eValue);
  });

  test("TC-09-02: null simulation controls empirical type-I at <= 0.055", () => {
    const result = simulateMsprtSpikeNullType1({
      nullRate: 0.05,
      runs: 10_000,
      alpha: 0.05,
      maxPairs: 1_000,
      tau: 0.1,
      seed: 123,
    });

    expect(result.empiricalType1).toBeLessThanOrEqual(0.055);
  });

  test("TC-09-03: same seed produces deterministic simulation output", () => {
    const options = {
      nullRate: 0.1,
      runs: 2_000,
      alpha: 0.05,
      maxPairs: 1_000,
      tau: 0.1,
      seed: 777,
    } as const;

    const first = simulateMsprtSpikeNullType1(options);
    const second = simulateMsprtSpikeNullType1(options);

    expect(second).toEqual(first);
  });

  test("experiment output returns bounded p-value and positive e-value", () => {
    const result = runMsprtSpikeExperiment({
      controlRate: 0.05,
      treatmentRate: 0.08,
      alpha: 0.05,
      maxPairs: 2000,
      tau: 0.1,
      seed: 42,
    });

    expect(result.finalPValue).toBeGreaterThanOrEqual(0);
    expect(result.finalPValue).toBeLessThanOrEqual(1);
    expect(result.finalEValue).toBeGreaterThan(0);
    expect(result.stoppingLook).toBeGreaterThanOrEqual(1);
    expect(result.stoppingLook).toBeLessThanOrEqual(2000);
  });

  test("invalid look inputs throw RangeError", () => {
    expect(() =>
      msprtSpikeEValue({
        controlSuccesses: 10,
        controlTotal: 0,
        treatmentSuccesses: 10,
        treatmentTotal: 10,
      })
    ).toThrow(RangeError);

    expect(() =>
      msprtSpikeEValue({
        controlSuccesses: 11,
        controlTotal: 10,
        treatmentSuccesses: 10,
        treatmentTotal: 10,
      })
    ).toThrow(RangeError);

    expect(() =>
      msprtSpikeEValue({
        controlSuccesses: 1,
        controlTotal: 10,
        treatmentSuccesses: 1,
        treatmentTotal: 11,
      })
    ).toThrow(RangeError);
  });

  test("invalid simulation inputs throw RangeError", () => {
    expect(() =>
      runMsprtSpikeExperiment({
        controlRate: -0.1,
        treatmentRate: 0.1,
      })
    ).toThrow(RangeError);

    expect(() =>
      runMsprtSpikeExperiment({
        controlRate: 0.1,
        treatmentRate: 0.1,
        alpha: 0,
      })
    ).toThrow(RangeError);

    expect(() =>
      simulateMsprtSpikeNullType1({
        nullRate: 0.1,
        runs: 0,
      })
    ).toThrow(RangeError);
  });
});

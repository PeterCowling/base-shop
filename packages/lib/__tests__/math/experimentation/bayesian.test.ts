import { bayesianABTest } from "../../../src/math/experimentation/bayesian";

describe("bayesianABTest", () => {
  test("TC-05-01: Jeffreys prior gives expected superiority probability", () => {
    const result = bayesianABTest({
      controlSuccesses: 50,
      controlTotal: 1000,
      treatmentSuccesses: 65,
      treatmentTotal: 1000,
      simulationSamples: 100_000,
      seed: 42,
    });

    expect(result.probabilityTreatmentBetter).toBeGreaterThan(0.92);
    expect(result.probabilityTreatmentBetter).toBeLessThan(0.93);
  });

  test("TC-05-02: equal data yields probability near 0.50", () => {
    const result = bayesianABTest({
      controlSuccesses: 50,
      controlTotal: 1000,
      treatmentSuccesses: 50,
      treatmentTotal: 1000,
      simulationSamples: 50_000,
      seed: 42,
    });

    expect(result.probabilityTreatmentBetter).toBeGreaterThan(0.49);
    expect(result.probabilityTreatmentBetter).toBeLessThan(0.51);
  });

  test("TC-05-03: strong prior dominates weak data", () => {
    const result = bayesianABTest({
      controlSuccesses: 5,
      controlTotal: 10,
      treatmentSuccesses: 6,
      treatmentTotal: 10,
      priorAlpha: 100,
      priorBeta: 100,
      simulationSamples: 20_000,
      seed: 7,
    });

    expect(result.controlPosterior.mean).toBeCloseTo(105 / 210, 6);
    expect(result.treatmentPosterior.mean).toBeCloseTo(106 / 210, 6);
  });

  test("TC-05-04: credible interval for 95/1000 aligns with reference range", () => {
    const result = bayesianABTest({
      controlSuccesses: 95,
      controlTotal: 1000,
      treatmentSuccesses: 95,
      treatmentTotal: 1000,
      credibleIntervalLevel: 0.95,
      simulationSamples: 10_000,
      seed: 3,
    });

    const interval = result.controlPosterior.credibleInterval;
    expect(interval.lower).toBeCloseTo(0.078, 2);
    expect(interval.upper).toBeCloseTo(0.114, 2);
  });

  test("posterior alpha/beta updates are exact", () => {
    const result = bayesianABTest({
      controlSuccesses: 50,
      controlTotal: 1000,
      treatmentSuccesses: 65,
      treatmentTotal: 1000,
      priorAlpha: 1,
      priorBeta: 1,
      simulationSamples: 10_000,
      seed: 1,
    });

    expect(result.controlPosterior.alpha).toBe(51);
    expect(result.controlPosterior.beta).toBe(951);
    expect(result.treatmentPosterior.alpha).toBe(66);
    expect(result.treatmentPosterior.beta).toBe(936);
  });

  test("same seed produces deterministic simulation output", () => {
    const options = {
      controlSuccesses: 50,
      controlTotal: 1000,
      treatmentSuccesses: 65,
      treatmentTotal: 1000,
      simulationSamples: 40_000,
      seed: 999,
    } as const;

    const a = bayesianABTest(options);
    const b = bayesianABTest(options);

    expect(a.probabilityTreatmentBetter).toBe(b.probabilityTreatmentBetter);
    expect(a.expectedLift).toBe(b.expectedLift);
  });

  test("different seeds can produce distinct Monte Carlo estimates", () => {
    const a = bayesianABTest({
      controlSuccesses: 50,
      controlTotal: 1000,
      treatmentSuccesses: 65,
      treatmentTotal: 1000,
      simulationSamples: 20_000,
      seed: 101,
    });
    const b = bayesianABTest({
      controlSuccesses: 50,
      controlTotal: 1000,
      treatmentSuccesses: 65,
      treatmentTotal: 1000,
      simulationSamples: 20_000,
      seed: 202,
    });

    expect(a.probabilityTreatmentBetter).not.toBe(b.probabilityTreatmentBetter);
  });

  test("probability and interval outputs stay within bounds", () => {
    const result = bayesianABTest({
      controlSuccesses: 5,
      controlTotal: 20,
      treatmentSuccesses: 8,
      treatmentTotal: 20,
      simulationSamples: 10_000,
      seed: 2,
    });

    expect(result.probabilityTreatmentBetter).toBeGreaterThanOrEqual(0);
    expect(result.probabilityTreatmentBetter).toBeLessThanOrEqual(1);
    expect(result.controlPosterior.credibleInterval.lower).toBeGreaterThanOrEqual(0);
    expect(result.controlPosterior.credibleInterval.upper).toBeLessThanOrEqual(1);
  });

  test("invalid count inputs throw RangeError", () => {
    expect(() =>
      bayesianABTest({
        controlSuccesses: -1,
        controlTotal: 10,
        treatmentSuccesses: 1,
        treatmentTotal: 10,
      })
    ).toThrow(RangeError);

    expect(() =>
      bayesianABTest({
        controlSuccesses: 11,
        controlTotal: 10,
        treatmentSuccesses: 1,
        treatmentTotal: 10,
      })
    ).toThrow(RangeError);
  });

  test("invalid prior parameters throw RangeError", () => {
    expect(() =>
      bayesianABTest({
        controlSuccesses: 1,
        controlTotal: 10,
        treatmentSuccesses: 2,
        treatmentTotal: 10,
        priorAlpha: 0,
        priorBeta: 1,
      })
    ).toThrow(RangeError);

    expect(() =>
      bayesianABTest({
        controlSuccesses: 1,
        controlTotal: 10,
        treatmentSuccesses: 2,
        treatmentTotal: 10,
        priorAlpha: 1,
        priorBeta: 0,
      })
    ).toThrow(RangeError);
  });

  test("invalid credibleIntervalLevel and simulationSamples throw RangeError", () => {
    expect(() =>
      bayesianABTest({
        controlSuccesses: 1,
        controlTotal: 10,
        treatmentSuccesses: 2,
        treatmentTotal: 10,
        credibleIntervalLevel: 1,
      })
    ).toThrow(RangeError);

    expect(() =>
      bayesianABTest({
        controlSuccesses: 1,
        controlTotal: 10,
        treatmentSuccesses: 2,
        treatmentTotal: 10,
        simulationSamples: 0,
      })
    ).toThrow(RangeError);
  });

  test("expectedLift is finite for standard experiment inputs", () => {
    const result = bayesianABTest({
      controlSuccesses: 50,
      controlTotal: 1000,
      treatmentSuccesses: 65,
      treatmentTotal: 1000,
      simulationSamples: 10_000,
      seed: 77,
    });

    expect(Number.isFinite(result.expectedLift)).toBe(true);
  });
});

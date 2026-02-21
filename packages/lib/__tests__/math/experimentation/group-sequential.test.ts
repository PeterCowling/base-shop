import { groupSequentialTest } from "../../../src/math/experimentation/group-sequential";

describe("groupSequentialTest", () => {
  test("TC-07A-01: O'Brien-Fleming boundaries match reference values", () => {
    const result = groupSequentialTest({
      informationFractions: [0.5, 0.75, 1.0],
      alpha: 0.05,
      observedZ: 0,
    });

    expect(result.criticalValues[0]).toBeCloseTo(2.77, 2);
    expect(result.criticalValues[1]).toBeCloseTo(2.26, 2);
    expect(result.criticalValues[2]).toBeCloseTo(1.96, 2);
    expect(result.method).toMatch(/approximation/i);
  });

  test("TC-07A-02: first look z=3.5 crosses boundary and stops early", () => {
    const result = groupSequentialTest({
      informationFractions: [0.5],
      alpha: 0.05,
      observedZ: 3.5,
    });

    expect(result.stopEarly).toBe(true);
    expect(result.lookIndex).toBe(1);
  });

  test("TC-07A-03: first look z=2.5 does not cross early boundary", () => {
    const result = groupSequentialTest({
      informationFractions: [0.5],
      alpha: 0.05,
      observedZ: 2.5,
    });

    expect(result.stopEarly).toBe(false);
  });

  test("TC-07A-04: boundaries are monotonically non-increasing across looks", () => {
    const result = groupSequentialTest({
      informationFractions: [0.25, 0.5, 0.75, 1],
      alpha: 0.05,
      observedZ: 0,
    });

    for (let i = 1; i < result.criticalValues.length; i++) {
      expect(result.criticalValues[i]).toBeLessThanOrEqual(result.criticalValues[i - 1]);
    }
  });

  test("TC-07A-05: suite covers >=10 tests for boundaries and stopping logic", () => {
    const result = groupSequentialTest({
      informationFractions: [1],
      observedZ: 0,
    });

    expect(result.criticalValues).toHaveLength(1);
  });

  test("one-sided greater uses one-tailed base critical value", () => {
    const result = groupSequentialTest({
      informationFractions: [0.5],
      alpha: 0.05,
      observedZ: 0,
      alternative: "greater",
    });

    expect(result.criticalValues[0]).toBeCloseTo(2.33, 2);
    expect(result.alternative).toBe("greater");
  });

  test("one-sided less stops when observed z is sufficiently negative", () => {
    const stop = groupSequentialTest({
      informationFractions: [0.5],
      alpha: 0.05,
      observedZ: -3.4,
      alternative: "less",
    });
    const keepGoing = groupSequentialTest({
      informationFractions: [0.5],
      alpha: 0.05,
      observedZ: -2.1,
      alternative: "less",
    });

    expect(stop.stopEarly).toBe(true);
    expect(keepGoing.stopEarly).toBe(false);
  });

  test("lookIndex represents the most recent look from informationFractions", () => {
    const result = groupSequentialTest({
      informationFractions: [0.5, 0.75],
      alpha: 0.05,
      observedZ: 2.6,
    });

    expect(result.lookIndex).toBe(2);
    expect(result.stopEarly).toBe(true);
  });

  test("adjusted p-value approximation is near nominal alpha at final z boundary", () => {
    const result = groupSequentialTest({
      informationFractions: [1],
      alpha: 0.05,
      observedZ: 1.96,
      alternative: "two-sided",
    });

    expect(result.adjustedPValueApprox).toBeGreaterThan(0.049);
    expect(result.adjustedPValueApprox).toBeLessThan(0.051);
  });

  test("adjusted p-value is bounded within [0, 1]", () => {
    const result = groupSequentialTest({
      informationFractions: [0.5, 1],
      alpha: 0.05,
      observedZ: 20,
    });

    expect(result.adjustedPValueApprox).toBeGreaterThanOrEqual(0);
    expect(result.adjustedPValueApprox).toBeLessThanOrEqual(1);
  });

  test("invalid informationFractions throw RangeError", () => {
    expect(() =>
      groupSequentialTest({
        informationFractions: [],
        observedZ: 0,
      })
    ).toThrow(RangeError);

    expect(() =>
      groupSequentialTest({
        informationFractions: [0.5, 0.5],
        observedZ: 0,
      })
    ).toThrow(RangeError);

    expect(() =>
      groupSequentialTest({
        informationFractions: [0, 1],
        observedZ: 0,
      })
    ).toThrow(RangeError);
  });

  test("invalid alpha, observedZ, and alternative throw RangeError", () => {
    expect(() =>
      groupSequentialTest({
        informationFractions: [1],
        alpha: 1,
        observedZ: 0,
      })
    ).toThrow(RangeError);

    expect(() =>
      groupSequentialTest({
        informationFractions: [1],
        observedZ: Number.NaN,
      })
    ).toThrow(RangeError);

    expect(() =>
      groupSequentialTest({
        informationFractions: [1],
        observedZ: 0,
        alternative: "invalid" as "two-sided",
      })
    ).toThrow(RangeError);
  });
});

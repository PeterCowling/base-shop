import {
  alwaysValidPValue,
  simulateAlwaysValidPower,
  simulateAlwaysValidType1,
} from "../../../src/math/experimentation/always-valid-inference";
import { zTestProportions } from "../../../src/math/experimentation/hypothesis-tests";
import { SeededRandom } from "../../../src/math/random";

interface FixedHorizonPowerOptions {
  controlRate: number;
  treatmentRate: number;
  runs: number;
  sampleSize: number;
  alpha: number;
  seed: number;
}

function simulateFixedHorizonPower(
  options: FixedHorizonPowerOptions
): { power: number; runs: number } {
  const { controlRate, treatmentRate, runs, sampleSize, alpha, seed } = options;
  const rng = new SeededRandom(seed);
  let rejections = 0;

  for (let run = 0; run < runs; run++) {
    let controlSuccesses = 0;
    let treatmentSuccesses = 0;

    for (let i = 0; i < sampleSize; i++) {
      if (rng.next() < controlRate) {
        controlSuccesses++;
      }
      if (rng.next() < treatmentRate) {
        treatmentSuccesses++;
      }
    }

    const test = zTestProportions({
      controlSuccesses,
      controlTotal: sampleSize,
      treatmentSuccesses,
      treatmentTotal: sampleSize,
      alternative: "two-sided",
    });

    if (test.pValue <= alpha) {
      rejections++;
    }
  }

  return {
    power: rejections / runs,
    runs,
  };
}

describe("always-valid-inference", () => {
  test("TC-07B-01: null simulation controls empirical type-I <= 0.055", () => {
    const result = simulateAlwaysValidType1({
      nullRate: 0.05,
      runs: 10_000,
      alpha: 0.05,
      maxPairs: 1_000,
      seed: 321,
    });

    expect(result.empiricalType1).toBeLessThanOrEqual(0.055);
  });

  test("TC-07B-02: effect simulation stops earlier than fixed horizon at comparable power", () => {
    const sequential = simulateAlwaysValidPower({
      controlRate: 0.05,
      treatmentRate: 0.08,
      runs: 2_000,
      alpha: 0.05,
      maxPairs: 2_000,
      seed: 99,
    });
    const fixed = simulateFixedHorizonPower({
      controlRate: 0.05,
      treatmentRate: 0.08,
      runs: 2_000,
      sampleSize: 2_000,
      alpha: 0.05,
      seed: 99,
    });

    expect(sequential.averageStoppingLookWhenRejected).toBeLessThan(1_600);
    expect(sequential.power).toBeGreaterThanOrEqual(fixed.power - 0.12);
  });

  test("TC-07B-03: simulation output is deterministic with fixed seed", () => {
    const options = {
      controlRate: 0.05,
      treatmentRate: 0.08,
      runs: 1_000,
      alpha: 0.05,
      maxPairs: 1_000,
      seed: 777,
    } as const;

    const first = simulateAlwaysValidPower(options);
    const second = simulateAlwaysValidPower(options);

    expect(second).toEqual(first);
  });

  test("alwaysValidPValue returns method metadata and assumptions", () => {
    const result = alwaysValidPValue({
      controlSuccesses: 50,
      controlTotal: 1000,
      treatmentSuccesses: 65,
      treatmentTotal: 1000,
      alpha: 0.05,
    });

    expect(result.method).toMatch(/mSPRT/i);
    expect(result.assumptions.length).toBeGreaterThanOrEqual(3);
    expect(result.pValue).toBeGreaterThanOrEqual(0);
    expect(result.pValue).toBeLessThanOrEqual(1);
  });

  test("running max evidence is monotonic via previousMaxLogEValue", () => {
    const firstLook = alwaysValidPValue({
      controlSuccesses: 1,
      controlTotal: 20,
      treatmentSuccesses: 3,
      treatmentTotal: 20,
      alpha: 0.05,
    });
    const secondLook = alwaysValidPValue({
      controlSuccesses: 2,
      controlTotal: 40,
      treatmentSuccesses: 4,
      treatmentTotal: 40,
      alpha: 0.05,
      previousMaxLogEValue: firstLook.maxLogEValue,
    });

    expect(secondLook.maxLogEValue).toBeGreaterThanOrEqual(firstLook.maxLogEValue);
  });

  test("strong running evidence can trigger canStop=true", () => {
    const result = alwaysValidPValue({
      controlSuccesses: 40,
      controlTotal: 500,
      treatmentSuccesses: 95,
      treatmentTotal: 500,
      alpha: 0.05,
      previousMaxLogEValue: 6,
    });

    expect(result.canStop).toBe(true);
    expect(result.pValue).toBeLessThanOrEqual(0.05);
  });

  test("pValue/eValue consistency follows reciprocal relationship from max evidence", () => {
    const result = alwaysValidPValue({
      controlSuccesses: 50,
      controlTotal: 1000,
      treatmentSuccesses: 65,
      treatmentTotal: 1000,
      alpha: 0.05,
    });

    if (result.pValue < 1) {
      expect(result.eValue).toBeCloseTo(1 / result.pValue, 8);
    } else {
      expect(result.eValue).toBeLessThanOrEqual(1);
    }
  });

  test("two-sided only alternative contract is enforced", () => {
    expect(() =>
      alwaysValidPValue({
        controlSuccesses: 10,
        controlTotal: 100,
        treatmentSuccesses: 20,
        treatmentTotal: 100,
        alternative: "greater",
      })
    ).toThrow(RangeError);
  });

  test("invalid alpha and prior inputs throw RangeError", () => {
    expect(() =>
      alwaysValidPValue({
        controlSuccesses: 10,
        controlTotal: 100,
        treatmentSuccesses: 20,
        treatmentTotal: 100,
        alpha: 0,
      })
    ).toThrow(RangeError);

    expect(() =>
      alwaysValidPValue({
        controlSuccesses: 10,
        controlTotal: 100,
        treatmentSuccesses: 20,
        treatmentTotal: 100,
        mixturePrior: { tau: 0 },
      })
    ).toThrow(RangeError);
  });

  test("invalid count inputs throw RangeError", () => {
    expect(() =>
      alwaysValidPValue({
        controlSuccesses: -1,
        controlTotal: 100,
        treatmentSuccesses: 20,
        treatmentTotal: 100,
      })
    ).toThrow(RangeError);

    expect(() =>
      alwaysValidPValue({
        controlSuccesses: 10,
        controlTotal: 100,
        treatmentSuccesses: 101,
        treatmentTotal: 100,
      })
    ).toThrow(RangeError);
  });

  test("type-I simulation validates required inputs", () => {
    expect(() =>
      simulateAlwaysValidType1({
        nullRate: 1.2,
      })
    ).toThrow(RangeError);

    expect(() =>
      simulateAlwaysValidType1({
        nullRate: 0.1,
        runs: 0,
      })
    ).toThrow(RangeError);
  });

  test("power simulation returns bounded metrics and sensible counts", () => {
    const result = simulateAlwaysValidPower({
      controlRate: 0.05,
      treatmentRate: 0.08,
      runs: 500,
      alpha: 0.05,
      maxPairs: 1000,
      seed: 9,
    });

    expect(result.rejections).toBeGreaterThanOrEqual(0);
    expect(result.rejections).toBeLessThanOrEqual(result.runs);
    expect(result.power).toBeGreaterThanOrEqual(0);
    expect(result.power).toBeLessThanOrEqual(1);
    expect(result.averageStoppingLook).toBeGreaterThanOrEqual(1);
    expect(result.averageStoppingLook).toBeLessThanOrEqual(1000);
  });
});

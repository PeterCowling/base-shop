import {
  thompsonSampling,
  thompsonSamplingSimulation,
} from "../../../src/math/experimentation/thompson-sampling";
import { SeededRandom } from "../../../src/math/random";

describe("thompson-sampling", () => {
  test("TC-06-01: equal Beta(1,1) priors distribute selections near 33%", () => {
    const arms = [
      { alpha: 1, beta: 1 },
      { alpha: 1, beta: 1 },
      { alpha: 1, beta: 1 },
    ] as const;
    const rng = new SeededRandom(123);
    const counts = [0, 0, 0];

    for (let i = 0; i < 1000; i++) {
      const { selectedArmIndex } = thompsonSampling(arms, { rng });
      counts[selectedArmIndex]++;
    }

    for (const count of counts) {
      expect(count).toBeGreaterThan(280);
      expect(count).toBeLessThan(390);
    }
  });

  test("TC-06-02: stronger posterior arm is selected over 70% of draws", () => {
    const arms = [
      { alpha: 10, beta: 5 },
      { alpha: 5, beta: 10 },
    ] as const;
    const rng = new SeededRandom(9);
    let firstArmSelections = 0;
    const draws = 4000;

    for (let i = 0; i < draws; i++) {
      const { selectedArmIndex } = thompsonSampling(arms, { rng });
      if (selectedArmIndex === 0) {
        firstArmSelections++;
      }
    }

    expect(firstArmSelections / draws).toBeGreaterThan(0.7);
  });

  test("TC-06-03: simulation converges toward best arm", () => {
    const result = thompsonSamplingSimulation({
      trueRates: [0.05, 0.08, 0.06],
      trials: 10_000,
      seed: 42,
    });

    expect(result.bestArmIndex).toBe(1);
    expect(result.selectionCounts[1]).toBeGreaterThan(result.selectionCounts[0]);
    expect(result.selectionCounts[1]).toBeGreaterThan(result.selectionCounts[2]);

    const tail = result.selections.slice(-1000);
    const tailBestSelections = tail.filter((armIndex) => armIndex === 1).length;
    expect(tailBestSelections / tail.length).toBeGreaterThan(0.7);
  });

  test("TC-06-04: same seed reproduces identical sequence", () => {
    const options = {
      trueRates: [0.05, 0.08, 0.06],
      trials: 2000,
      seed: 777,
    } as const;

    const first = thompsonSamplingSimulation(options);
    const second = thompsonSamplingSimulation(options);

    expect(second.selections).toEqual(first.selections);
    expect(second.rewards).toEqual(first.rewards);
    expect(second.cumulativeRegret).toEqual(first.cumulativeRegret);
    expect(second.selectionCounts).toEqual(first.selectionCounts);
  });

  test("selection result returns valid sampled probabilities", () => {
    const result = thompsonSampling(
      [
        { alpha: 1, beta: 1 },
        { alpha: 2, beta: 3 },
      ],
      { seed: 10 }
    );

    expect(result.sampledProbabilities).toHaveLength(2);
    expect(result.selectedArmIndex).toBeGreaterThanOrEqual(0);
    expect(result.selectedArmIndex).toBeLessThan(2);
    for (const sampled of result.sampledProbabilities) {
      expect(sampled).toBeGreaterThanOrEqual(0);
      expect(sampled).toBeLessThanOrEqual(1);
    }
  });

  test("simulation output vectors match requested trials", () => {
    const result = thompsonSamplingSimulation({
      trueRates: [0.1, 0.2],
      trials: 250,
      seed: 8,
    });

    expect(result.selections).toHaveLength(250);
    expect(result.rewards).toHaveLength(250);
    expect(result.cumulativeRewards).toHaveLength(250);
    expect(result.cumulativeRegret).toHaveLength(250);
  });

  test("cumulative regret is non-decreasing", () => {
    const result = thompsonSamplingSimulation({
      trueRates: [0.2, 0.25, 0.3],
      trials: 500,
      seed: 12,
    });

    for (let i = 1; i < result.cumulativeRegret.length; i++) {
      expect(result.cumulativeRegret[i]).toBeGreaterThanOrEqual(
        result.cumulativeRegret[i - 1]
      );
    }
  });

  test("posterior alpha+beta tracks per-arm update counts", () => {
    const result = thompsonSamplingSimulation({
      trueRates: [0.2, 0.4, 0.6],
      trials: 1000,
      priorAlpha: 1.5,
      priorBeta: 2.5,
      seed: 23,
    });

    for (let i = 0; i < result.posteriorArms.length; i++) {
      const totalPosteriorMass =
        result.posteriorArms[i].alpha + result.posteriorArms[i].beta;
      expect(totalPosteriorMass).toBeCloseTo(4 + result.selectionCounts[i], 10);
    }
  });

  test("single-arm simulation has zero regret", () => {
    const result = thompsonSamplingSimulation({
      trueRates: [0.3],
      trials: 300,
      seed: 5,
    });

    expect(result.bestArmIndex).toBe(0);
    expect(result.selectionCounts[0]).toBe(300);
    expect(result.finalRegret).toBeCloseTo(0, 12);
  });

  test("thompsonSampling throws on invalid arm parameters", () => {
    expect(() => thompsonSampling([])).toThrow(RangeError);
    expect(() =>
      thompsonSampling([
        { alpha: 0, beta: 1 },
        { alpha: 1, beta: 1 },
      ])
    ).toThrow(RangeError);
    expect(() =>
      thompsonSampling([
        { alpha: 1, beta: -1 },
        { alpha: 1, beta: 1 },
      ])
    ).toThrow(RangeError);
  });

  test("thompsonSampling rejects seed+rng being provided together", () => {
    const rng = new SeededRandom(1);
    expect(() =>
      thompsonSampling(
        [
          { alpha: 1, beta: 1 },
          { alpha: 1, beta: 1 },
        ],
        { seed: 1, rng }
      )
    ).toThrow(RangeError);
  });

  test("simulation validates trueRates, trials, and prior parameters", () => {
    expect(() =>
      thompsonSamplingSimulation({
        trueRates: [],
        trials: 10,
      })
    ).toThrow(RangeError);

    expect(() =>
      thompsonSamplingSimulation({
        trueRates: [0.1, 1.2],
        trials: 10,
      })
    ).toThrow(RangeError);

    expect(() =>
      thompsonSamplingSimulation({
        trueRates: [0.1, 0.2],
        trials: 0,
      })
    ).toThrow(RangeError);

    expect(() =>
      thompsonSamplingSimulation({
        trueRates: [0.1, 0.2],
        trials: 10,
        priorAlpha: 0,
      })
    ).toThrow(RangeError);
  });
});

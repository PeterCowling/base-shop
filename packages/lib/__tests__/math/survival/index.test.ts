import {
  estimateKaplanMeierCurve,
  SurvivalObservationValidationError,
} from "../../../src/math/survival";

describe("estimateKaplanMeierCurve", () => {
  it("TC-02-07: returns an explicit empty result for no history", () => {
    expect(estimateKaplanMeierCurve([])).toEqual({
      status: "empty",
      total_observations: 0,
      event_count: 0,
      censored_count: 0,
      median_survival_time: null,
      points: [],
    });
  });

  it("TC-02-08: summarizes censored and observed events", () => {
    const result = estimateKaplanMeierCurve([
      { time: 1, event: true },
      { time: 4, event: false },
      { time: 4, event: true },
      { time: 8, event: true },
    ]);

    expect(result.status).toBe("estimated");
    expect(result.total_observations).toBe(4);
    expect(result.event_count).toBe(3);
    expect(result.censored_count).toBe(1);
    expect(result.median_survival_time).toBe(4);
    expect(result.points).toEqual([
      {
        time: 1,
        survival_probability: 0.75,
        at_risk: 4,
        event_count: 1,
        censored_count: 0,
      },
      {
        time: 4,
        survival_probability: 0.5,
        at_risk: 3,
        event_count: 1,
        censored_count: 1,
      },
      {
        time: 8,
        survival_probability: 0,
        at_risk: 1,
        event_count: 1,
        censored_count: 0,
      },
    ]);
  });

  it("TC-02-09: rejects negative time-to-event values", () => {
    expect(() =>
      estimateKaplanMeierCurve([{ time: -1, event: true }]),
    ).toThrow(
      new SurvivalObservationValidationError("time_must_be_non_negative_finite"),
    );
  });
});

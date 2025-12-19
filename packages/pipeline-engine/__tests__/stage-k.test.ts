import { computeStageK, money } from "../src";

describe("computeStageK", () => {
  it("computes capital days and payback", () => {
    const input = {
      horizonDays: 6,
      cashflows: [
        { day: 0, amountCents: money.fromEuros(-1000) },
        { day: 5, amountCents: money.fromEuros(1500) },
      ],
    };

    const result = computeStageK(input);

    expect(result.peakCashOutlayCents).toBe(money.fromEuros(1000));
    expect(result.capitalDaysCentsDays).toBe(500000n);
    expect(result.capitalDaysEurosDays).toBe(5000);
    expect(result.paybackDay).toBe(5);
    expect(result.netCashProfitCents).toBe(money.fromEuros(500));
    expect(result.profitPerCapitalDay).toBeCloseTo(0.1, 5);
    expect(result.annualizedCapitalReturnRate).toBeCloseTo(36.5, 3);
  });

  it("calculates sell-through day", () => {
    const input = {
      horizonDays: 10,
      cashflows: [{ day: 0, amountCents: money.fromEuros(-250) }],
      unitsPlanned: 100,
      unitsSoldByDay: [0, 5, 12, 20, 35, 50, 62, 75, 88, 98, 100],
      sellThroughTargetPct: 0.8,
    };

    const result = computeStageK(input);
    expect(result.sellThroughDay).toBe(8);
  });
});

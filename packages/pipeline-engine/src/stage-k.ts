import { money } from "./money";
import type { StageKInput, StageKResult, StageKTimeline } from "./types";

function buildCashflowTimeline(input: StageKInput): StageKTimeline {
  const horizonDays = Math.max(0, Math.floor(input.horizonDays));
  const days = Array.from({ length: horizonDays + 1 }, (_, index) => index);
  const cashflowCents = Array.from({ length: horizonDays + 1 }, () => 0n);

  for (const event of input.cashflows) {
    if (!Number.isFinite(event.day)) continue;
    const day = Math.floor(event.day);
    if (day < 0 || day > horizonDays) continue;
    cashflowCents[day] = cashflowCents[day] + event.amountCents;
  }

  const cumulativeCents: bigint[] = [];
  const investedCents: bigint[] = [];
  let running = 0n;
  for (const flow of cashflowCents) {
    running += flow;
    cumulativeCents.push(running);
    investedCents.push(running < 0n ? -running : 0n);
  }

  return {
    days,
    cashflowCents,
    cumulativeCents,
    investedCents,
  };
}

function findPaybackDay(timeline: StageKTimeline): number | null {
  for (let i = 0; i < timeline.cumulativeCents.length; i += 1) {
    if (timeline.cumulativeCents[i] >= 0n) return i;
  }
  return null;
}

function findSellThroughDay(
  unitsPlanned: number | undefined,
  unitsSoldByDay: number[] | undefined,
  targetPct: number | undefined,
): number | null {
  if (!unitsPlanned || !unitsSoldByDay || !targetPct) return null;
  const target = Math.ceil(unitsPlanned * targetPct);
  if (!Number.isFinite(target) || target <= 0) return null;

  let lastValue = 0;
  for (let day = 0; day < unitsSoldByDay.length; day += 1) {
    const value = Number.isFinite(unitsSoldByDay[day])
      ? unitsSoldByDay[day]
      : lastValue;
    lastValue = value;
    if (value >= target) return day;
  }

  return null;
}

export function computeStageK(input: StageKInput): StageKResult {
  const timeline = buildCashflowTimeline(input);
  const peakCashOutlayCents = timeline.investedCents.reduce(
    (peak, value) => (value > peak ? value : peak),
    0n,
  );

  const capitalDaysCentsDays = timeline.investedCents.reduce(
    (sum, value) => sum + value,
    0n,
  );

  const paybackDay = findPaybackDay(timeline);
  const sellThroughDay = findSellThroughDay(
    input.unitsPlanned,
    input.unitsSoldByDay,
    input.sellThroughTargetPct,
  );

  const salvageValue = input.salvageValueCents ?? money.zero;
  const terminalCash =
    timeline.cumulativeCents[timeline.cumulativeCents.length - 1] ?? 0n;
  const netCashProfitCents = terminalCash + salvageValue;

  const capitalDaysEurosDays = Number(capitalDaysCentsDays) / 100;
  const profitPerCapitalDay =
    capitalDaysCentsDays > 0n
      ? Number(netCashProfitCents) / Number(capitalDaysCentsDays)
      : null;

  const annualizedCapitalReturnRate =
    profitPerCapitalDay !== null ? profitPerCapitalDay * 365 : null;

  return {
    peakCashOutlayCents,
    capitalDaysCentsDays,
    capitalDaysEurosDays,
    paybackDay,
    sellThroughDay,
    netCashProfitCents,
    profitPerCapitalDay,
    annualizedCapitalReturnRate,
    timeline,
  };
}

/* i18n-exempt file -- PP-1100 Stage K scenario helpers [ttl=2026-06-30] */

import type { StageKScenarioAssumptions } from "./stage-k-scenario";

export function nowIso(): string {
  return new Date().toISOString();
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function toInt(value: unknown): number | null {
  const num = toNumber(value);
  if (num === null) return null;
  return Math.round(num);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeAssumptions(
  overrides: Partial<StageKScenarioAssumptions> | undefined,
  defaults: StageKScenarioAssumptions,
): StageKScenarioAssumptions {
  const merged = {
    ...defaults,
    ...(overrides ?? {}),
  };

  return {
    sellThroughDays: clamp(Math.round(merged.sellThroughDays), 1, 3650),
    sellThroughTargetPct: clamp(merged.sellThroughTargetPct, 0, 1),
    horizonBufferDays: clamp(Math.round(merged.horizonBufferDays), 0, 3650),
    salvageValueCents: Math.max(0, Math.round(merged.salvageValueCents)),
  };
}

export function buildUnitsSoldByDay({
  horizonDays,
  salesStartDay,
  sellThroughDays,
  targetUnits,
}: {
  horizonDays: number;
  salesStartDay: number;
  sellThroughDays: number;
  targetUnits: number;
}): number[] {
  const output: number[] = [];
  let last = 0;

  for (let day = 0; day <= horizonDays; day += 1) {
    let value = 0;
    if (day > salesStartDay) {
      const activeDay = day - salesStartDay;
      if (sellThroughDays <= 0) {
        value = targetUnits;
      } else if (activeDay >= sellThroughDays) {
        value = targetUnits;
      } else {
        value = Math.round((targetUnits * activeDay) / sellThroughDays);
      }
    }

    if (value < last) value = last;
    if (value > targetUnits) value = targetUnits;
    output.push(value);
    last = value;
  }

  return output;
}

export function buildRevenueCashflows({
  unitsSoldByDay,
  contributionPerUnitCents,
  payoutDelayDays,
  horizonDays,
}: {
  unitsSoldByDay: number[];
  contributionPerUnitCents: number;
  payoutDelayDays: number;
  horizonDays: number;
}): Array<{ day: number; amountCents: number }> {
  const cashflows: Array<{ day: number; amountCents: number }> = [];
  let last = 0;

  for (let day = 0; day < unitsSoldByDay.length; day += 1) {
    const current = unitsSoldByDay[day] ?? last;
    const sold = current - last;
    last = current;
    if (sold === 0) continue;
    const cashDay = day + payoutDelayDays;
    if (cashDay > horizonDays) continue;
    cashflows.push({
      day: cashDay,
      amountCents: sold * contributionPerUnitCents,
    });
  }

  return cashflows;
}

export function computeSellThroughDaysFromVelocity(
  unitsPlanned: number,
  targetPct: number,
  velocityPerDay: number,
): number | null {
  if (!Number.isFinite(velocityPerDay) || velocityPerDay <= 0) return null;
  const targetUnits = Math.max(0, Math.ceil(unitsPlanned * targetPct));
  if (targetUnits <= 0) return null;
  return Math.max(1, Math.ceil(targetUnits / velocityPerDay));
}

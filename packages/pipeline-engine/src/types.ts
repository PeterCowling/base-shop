import type { Money } from "./money";

export type CashflowEvent = {
  day: number;
  amountCents: Money;
};

export type StageKInput = {
  horizonDays: number;
  cashflows: CashflowEvent[];
  unitsPlanned?: number;
  unitsSoldByDay?: number[];
  sellThroughTargetPct?: number;
  salvageValueCents?: Money;
};

export type StageKTimeline = {
  days: number[];
  cashflowCents: Money[];
  cumulativeCents: Money[];
  investedCents: Money[];
};

export type StageKResult = {
  peakCashOutlayCents: Money;
  capitalDaysCentsDays: bigint;
  capitalDaysEurosDays: number;
  paybackDay: number | null;
  sellThroughDay: number | null;
  netCashProfitCents: Money;
  profitPerCapitalDay: number | null;
  annualizedCapitalReturnRate: number | null;
  timeline: StageKTimeline;
};

export type SensitivityDefinition = {
  label: string;
  delta: number;
  apply: (input: StageKInput, delta: number) => StageKInput;
};

export type StageKSensitivities = Record<string, number | null>;

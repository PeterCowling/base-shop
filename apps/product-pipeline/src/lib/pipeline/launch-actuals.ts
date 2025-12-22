/* i18n-exempt file -- PP-1100 launch actuals helpers [ttl=2026-06-30] */
// apps/product-pipeline/src/lib/pipeline/launch-actuals.ts

import {
  computeSensitivities,
  computeStageK,
  money,
  type StageKInput,
  type StageKResult,
} from "@acme/pipeline-engine";

export type CsvRow = {
  day: number;
  units: number;
};

export type StageKInputPayload = {
  horizonDays: number;
  cashflows: Array<{ day: number; amountCents: string | number }>;
  unitsPlanned?: number;
  unitsSoldByDay?: number[];
  sellThroughTargetPct?: number;
  salvageValueCents?: string | number;
};

export type NormalizedStageKInput = Omit<
  StageKInputPayload,
  "cashflows" | "salvageValueCents"
> & {
  cashflows: Array<{ day: number; amountCents: string }>;
  salvageValueCents?: string;
};

export type StageKOutputSummary = {
  peakCashOutlayCents: string;
  paybackDay: number | null;
  sellThroughDay: number | null;
  annualizedCapitalReturnRate: number | null;
  returnBand: "low" | "medium" | "high" | "unknown";
};

export type StageKOutputJson = {
  engineVersion: string;
  inputHash: string;
  summary: StageKOutputSummary;
  result: {
    peakCashOutlayCents: string;
    capitalDaysCentsDays: string;
    capitalDaysEurosDays: number;
    paybackDay: number | null;
    sellThroughDay: number | null;
    netCashProfitCents: string;
    profitPerCapitalDay: number | null;
    annualizedCapitalReturnRate: number | null;
    timeline: {
      days: number[];
      cashflowCents: string[];
      cumulativeCents: string[];
      investedCents: string[];
    };
  };
  sensitivities: Record<string, number | null>;
};

export function parseLaunchCsv(csv: string): CsvRow[] {
  const rows = csv
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (rows.length < 2) return [];
  const headers = rows[0]?.split(",").map((cell) => cell.trim().toLowerCase());
  if (!headers) return [];
  const dayIndex = headers.indexOf("day");
  const unitsIndex =
    headers.indexOf("units") >= 0
      ? headers.indexOf("units")
      : headers.indexOf("units_sold");
  if (dayIndex === -1 || unitsIndex === -1) return [];

  const parsed: CsvRow[] = [];
  for (const line of rows.slice(1)) {
    const cells = line.split(",");
    const day = Number.parseInt(cells[dayIndex] ?? "", 10);
    const units = Number.parseFloat(cells[unitsIndex] ?? "");
    if (!Number.isFinite(day) || day < 0) continue;
    if (!Number.isFinite(units) || units < 0) continue;
    parsed.push({ day, units: Math.round(units) });
  }
  return parsed;
}

export function buildUnitsSoldByDay(
  rows: CsvRow[],
  horizonDays: number,
): number[] {
  const daily = new Map<number, number>();
  for (const row of rows) {
    daily.set(row.day, (daily.get(row.day) ?? 0) + row.units);
  }
  const maxDay = Math.max(0, horizonDays);
  const series: number[] = [];
  let running = 0;
  for (let day = 0; day <= maxDay; day += 1) {
    running += daily.get(day) ?? 0;
    series.push(running);
  }
  return series;
}

function normalizeMoney(value: string | number): string | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return String(Math.round(value));
  }
  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  return trimmed;
}

export function normalizeStageKInput(
  input: StageKInputPayload,
): NormalizedStageKInput {
  const cashflows = input.cashflows.map((flow) => {
    const normalized = normalizeMoney(flow.amountCents);
    if (normalized === null) {
      throw new Error("invalid_money");
    }
    return { day: flow.day, amountCents: normalized };
  });

  let salvageValueCents: string | undefined;
  if (input.salvageValueCents !== undefined) {
    const normalized = normalizeMoney(input.salvageValueCents);
    if (normalized === null) {
      throw new Error("invalid_money");
    }
    salvageValueCents = normalized;
  }

  return {
    horizonDays: input.horizonDays,
    cashflows,
    ...(input.unitsPlanned !== undefined
      ? { unitsPlanned: input.unitsPlanned }
      : {}),
    ...(input.unitsSoldByDay !== undefined
      ? { unitsSoldByDay: input.unitsSoldByDay }
      : {}),
    ...(input.sellThroughTargetPct !== undefined
      ? { sellThroughTargetPct: input.sellThroughTargetPct }
      : {}),
    ...(salvageValueCents !== undefined ? { salvageValueCents } : {}),
  };
}

function toStageKInput(input: NormalizedStageKInput): StageKInput {
  return {
    horizonDays: input.horizonDays,
    cashflows: input.cashflows.map((flow) => ({
      day: flow.day,
      amountCents: BigInt(flow.amountCents),
    })),
    ...(input.unitsPlanned !== undefined
      ? { unitsPlanned: input.unitsPlanned }
      : {}),
    ...(input.unitsSoldByDay !== undefined
      ? { unitsSoldByDay: input.unitsSoldByDay }
      : {}),
    ...(input.sellThroughTargetPct !== undefined
      ? { sellThroughTargetPct: input.sellThroughTargetPct }
      : {}),
    ...(input.salvageValueCents !== undefined
      ? { salvageValueCents: BigInt(input.salvageValueCents) }
      : {}),
  };
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

async function hashInput(input: NormalizedStageKInput): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(stableStringify(input));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function applyRate(value: bigint, rate: number): bigint {
  const scale = 10000n;
  const scaled = BigInt(Math.round(rate * 10000));
  return (value * scaled) / scale;
}

function applyRateToCashflows(
  input: StageKInput,
  rate: number,
  direction: "positive" | "negative",
): StageKInput {
  return {
    ...input,
    cashflows: input.cashflows.map((flow) => {
      const isPositive = flow.amountCents > 0n;
      if (
        (direction === "positive" && !isPositive) ||
        (direction === "negative" && isPositive)
      ) {
        return flow;
      }
      const delta = applyRate(flow.amountCents, rate);
      return {
        ...flow,
        amountCents: money.add(flow.amountCents, delta),
      };
    }),
  };
}

function applyVelocityRate(input: StageKInput, rate: number): StageKInput {
  if (!input.unitsSoldByDay || !input.unitsPlanned) return input;
  const capped = input.unitsPlanned;
  const unitsSoldByDay = input.unitsSoldByDay.map((value) =>
    Math.min(capped, Math.round(value * (1 + rate))),
  );
  return { ...input, unitsSoldByDay };
}

function deriveReturnBand(
  annualizedReturnRate: number | null,
): StageKOutputSummary["returnBand"] {
  if (annualizedReturnRate === null) return "unknown";
  if (annualizedReturnRate < 0.1) return "low";
  if (annualizedReturnRate < 0.25) return "medium";
  return "high";
}

function serializeStageKResult(result: StageKResult): StageKOutputJson["result"] {
  return {
    peakCashOutlayCents: result.peakCashOutlayCents.toString(),
    capitalDaysCentsDays: result.capitalDaysCentsDays.toString(),
    capitalDaysEurosDays: result.capitalDaysEurosDays,
    paybackDay: result.paybackDay,
    sellThroughDay: result.sellThroughDay,
    netCashProfitCents: result.netCashProfitCents.toString(),
    profitPerCapitalDay: result.profitPerCapitalDay,
    annualizedCapitalReturnRate: result.annualizedCapitalReturnRate,
    timeline: {
      days: result.timeline.days,
      cashflowCents: result.timeline.cashflowCents.map((value) =>
        value.toString(),
      ),
      cumulativeCents: result.timeline.cumulativeCents.map((value) =>
        value.toString(),
      ),
      investedCents: result.timeline.investedCents.map((value) =>
        value.toString(),
      ),
    },
  };
}

export async function computeStageKFromPayload(
  payload: StageKInputPayload,
): Promise<{
  normalizedInput: NormalizedStageKInput;
  inputHash: string;
  summary: StageKOutputSummary;
  output: StageKOutputJson;
}> {
  const normalizedInput = normalizeStageKInput(payload);
  const inputHash = await hashInput(normalizedInput);
  const stageKInput = toStageKInput(normalizedInput);
  const result = computeStageK(stageKInput);
  const sensitivities = computeSensitivities({
    baseInput: stageKInput,
    definitions: [
      {
        label: "price_delta_pct",
        delta: 0.01,
        apply: (base, delta) => applyRateToCashflows(base, delta, "positive"),
      },
      {
        label: "cost_delta_pct",
        delta: 0.01,
        apply: (base, delta) => applyRateToCashflows(base, delta, "negative"),
      },
      {
        label: "velocity_delta_pct",
        delta: 0.05,
        apply: (base, delta) => applyVelocityRate(base, delta),
      },
    ],
  });

  const summary: StageKOutputSummary = {
    peakCashOutlayCents: result.peakCashOutlayCents.toString(),
    paybackDay: result.paybackDay,
    sellThroughDay: result.sellThroughDay,
    annualizedCapitalReturnRate: result.annualizedCapitalReturnRate,
    returnBand: deriveReturnBand(result.annualizedCapitalReturnRate),
  };

  const output: StageKOutputJson = {
    engineVersion: "stage-k:v1",
    inputHash,
    summary,
    result: serializeStageKResult(result),
    sensitivities,
  };

  return { normalizedInput, inputHash, summary, output };
}

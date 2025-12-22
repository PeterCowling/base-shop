export type CandidateSummary = {
  id: string;
  stageStatus: string | null;
  lead: {
    title: string | null;
  } | null;
  stageK: {
    summary: {
      annualizedCapitalReturnRate: number | null;
      returnBand: string | null;
    } | null;
  };
};

export type StageRun = {
  id: string;
  stage: string;
  status: string;
  input: unknown;
  output: unknown;
};

export type CandidateDetailResponse = {
  ok?: boolean;
  candidate?: {
    id: string;
    stageStatus: string | null;
    lead: {
      title: string | null;
    } | null;
  };
  stageRuns?: StageRun[];
};

export type StageKInputPayload = {
  horizonDays: number;
  cashflows: Array<{ day: number; amountCents: string | number }>;
  unitsPlanned?: number;
  unitsSoldByDay?: number[];
  sellThroughTargetPct?: number;
  salvageValueCents?: string | number;
};

export type StageKOutput = {
  summary?: {
    peakCashOutlayCents?: string;
    paybackDay?: number | null;
    annualizedCapitalReturnRate?: number | null;
  };
  result?: {
    capitalDaysEurosDays?: number;
  };
  sensitivities?: Record<string, number | null>;
};

export type ScenarioLabStrings = {
  selector: {
    label: string;
    title: string;
    placeholder: string;
    helper: string;
    empty: string;
  };
  base: {
    label: string;
    title: string;
    badge: string;
  };
  outputs: {
    peakCash: string;
    payback: string;
    capitalDays: string;
    annualizedReturn: string;
    days: string;
  };
  controls: {
    label: string;
    title: string;
    inputPrice: string;
    inputCost: string;
    inputVelocity: string;
    approxLabel: string;
    approxDeltaLabel: string;
    reset: string;
    runExact: string;
  };
  sensitivities: {
    label: string;
    title: string;
    unit: string;
    price: string;
    cost: string;
    velocity: string;
  };
  state: {
    loading: string;
    missingStageK: string;
    runSuccess: string;
    runError: string;
  };
  notAvailable: string;
};

export type Adjustments = {
  pricePct: number;
  costPct: number;
  velocityPct: number;
};

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  pricePct: 0,
  costPct: 0,
  velocityPct: 0,
};

function parseCents(value: string | number): bigint | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return BigInt(Math.round(value));
  }
  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  return BigInt(trimmed);
}

function applyRate(value: bigint, rate: number): bigint {
  if (!Number.isFinite(rate) || rate === 0) return value;
  const scale = 10000n;
  const scaled = BigInt(Math.round(rate * 10000));
  return value + (value * scaled) / scale;
}

export function adjustInput(
  input: StageKInputPayload,
  adjustments: Adjustments,
): StageKInputPayload {
  const priceRate = adjustments.pricePct / 100;
  const costRate = adjustments.costPct / 100;
  const velocityRate = adjustments.velocityPct / 100;

  const cashflows = input.cashflows.map((flow) => {
    const cents = parseCents(flow.amountCents);
    if (cents === null) return flow;
    const rate = cents >= 0n ? priceRate : costRate;
    const next = applyRate(cents, rate);
    return { ...flow, amountCents: next.toString() };
  });

  let unitsSoldByDay = input.unitsSoldByDay;
  if (
    unitsSoldByDay &&
    input.unitsPlanned &&
    Number.isFinite(velocityRate) &&
    velocityRate !== 0
  ) {
    const cap = input.unitsPlanned;
    unitsSoldByDay = unitsSoldByDay.map((value) =>
      Math.min(cap, Math.max(0, Math.round(value * (1 + velocityRate)))),
    );
  }

  return {
    ...input,
    cashflows,
    ...(unitsSoldByDay ? { unitsSoldByDay } : {}),
  };
}

export function extractStageKRun(stageRuns: StageRun[]): StageRun | null {
  return stageRuns.find((run) => run.stage === "K") ?? null;
}

export function extractStageKInput(
  run: StageRun | null,
): StageKInputPayload | null {
  if (!run?.input || typeof run.input !== "object") return null;
  const container = run.input as { input?: unknown };
  if (container.input && typeof container.input === "object") {
    return container.input as StageKInputPayload;
  }
  return run.input as StageKInputPayload;
}

export function extractStageKOutput(run: StageRun | null): StageKOutput | null {
  if (!run?.output || typeof run.output !== "object") return null;
  return run.output as StageKOutput;
}

export function computeApproxReturn(
  baseReturn: number | null | undefined,
  sensitivities: Record<string, number | null> | undefined,
  adjustments: Adjustments,
): number | null {
  if (baseReturn === null || baseReturn === undefined) return null;
  if (!sensitivities) return baseReturn;
  const price = sensitivities["price_delta_pct"];
  const cost = sensitivities["cost_delta_pct"];
  const velocity = sensitivities["velocity_delta_pct"];
  const priceDelta = (price ?? 0) * (adjustments.pricePct / 100);
  const costDelta = (cost ?? 0) * (adjustments.costPct / 100);
  const velocityDelta = (velocity ?? 0) * (adjustments.velocityPct / 100);
  return baseReturn + priceDelta + costDelta + velocityDelta;
}

export function formatPaybackDay(
  value: number | null | undefined,
  daysLabel: string,
): string {
  if (value === null || value === undefined) return "-";
  return daysLabel.replace("{count}", String(value));
}

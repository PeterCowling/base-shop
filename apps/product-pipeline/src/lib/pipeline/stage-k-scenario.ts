/* i18n-exempt file -- PP-1100 internal pipeline helper [ttl=2026-06-30] */
// apps/product-pipeline/src/lib/pipeline/stage-k-scenario.ts

import {
  buildRevenueCashflows,
  buildUnitsSoldByDay,
  clamp,
  computeSellThroughDaysFromVelocity,
  normalizeAssumptions,
  nowIso,
  toInt,
} from "./stage-k-scenario-helpers";

type StageRunSnapshot = {
  runId: string;
  input: unknown | null;
  output: unknown | null;
};

type StageBInput = {
  unitsPlanned?: number;
  leadTimeDays?: number;
};

type StageBOutputSummary = {
  totalLandedCostCents?: string;
  depositAmountCents?: string | null;
  balanceAmountCents?: string | null;
  balanceDueDay?: number | null;
  leadTimeDays?: number | null;
};

type StageBOutput = {
  summary?: StageBOutputSummary;
};

type StageCOutputSummary = {
  contributionPerUnitCents?: string;
  payoutDelayDays?: number | null;
};

type StageCOutput = {
  summary?: StageCOutputSummary;
};

export type StageKScenarioAssumptions = {
  sellThroughDays: number;
  sellThroughTargetPct: number;
  horizonBufferDays: number;
  salvageValueCents: number;
};

export type VelocityPrior = {
  source: string;
  velocityPerDay: number;
  unitsSoldTotal?: number | null;
  maxDay?: number | null;
  createdAt?: string | null;
  expiresAt?: string | null;
};

export type StageKInputPayload = {
  horizonDays: number;
  cashflows: Array<{ day: number; amountCents: number }>;
  unitsPlanned?: number;
  unitsSoldByDay?: number[];
  sellThroughTargetPct?: number;
  salvageValueCents?: number;
};

export type StageKScenarioPack = {
  version: "scenario-pack:v1";
  derivedAt: string;
  sources: {
    stageB: StageRunSnapshot;
    stageC: StageRunSnapshot;
    stageM?: StageRunSnapshot | null;
    stageS?: StageRunSnapshot | null;
  };
  priors?: {
    velocity?: {
      source: string;
      velocityPerDay: number;
      derivedSellThroughDays: number;
      unitsSoldTotal?: number | null;
      maxDay?: number | null;
      createdAt?: string | null;
      expiresAt?: string | null;
    };
  };
  assumptions: StageKScenarioAssumptions;
  derived: {
    unitsPlanned: number;
    contributionPerUnitCents: number;
    leadTimeDays: number;
    payoutDelayDays: number;
    totalLandedCostCents: number;
    depositAmountCents: number | null;
    balanceAmountCents: number | null;
    balanceDueDay: number | null;
  };
  model: {
    cashflow: "linear";
    sellThrough: "linear";
  };
};

export type BuildStageKScenarioParams = {
  stageB: StageRunSnapshot;
  stageC: StageRunSnapshot;
  stageM?: StageRunSnapshot | null;
  stageS?: StageRunSnapshot | null;
  velocityPrior?: VelocityPrior | null;
  assumptions?: Partial<StageKScenarioAssumptions>;
};

const DEFAULT_ASSUMPTIONS: StageKScenarioAssumptions = {
  sellThroughDays: 90,
  sellThroughTargetPct: 0.8,
  horizonBufferDays: 30,
  salvageValueCents: 0,
};

function unwrapInput(payload: unknown): StageBInput | null {
  if (!payload || typeof payload !== "object") return null;
  if ("input" in payload) {
    const nested = (payload as { input?: StageBInput }).input;
    if (nested && typeof nested === "object") return nested;
  }
  return payload as StageBInput;
}

function extractStageBSummary(payload: unknown): StageBOutputSummary | null {
  if (!payload || typeof payload !== "object") return null;
  const summary = (payload as StageBOutput).summary;
  if (!summary || typeof summary !== "object") return null;
  return summary;
}

function extractStageCSummary(payload: unknown): StageCOutputSummary | null {
  if (!payload || typeof payload !== "object") return null;
  const summary = (payload as StageCOutput).summary;
  if (!summary || typeof summary !== "object") return null;
  return summary;
}


export function buildStageKScenario({
  stageB,
  stageC,
  stageM,
  stageS,
  velocityPrior,
  assumptions: overrides,
}: BuildStageKScenarioParams): { input: StageKInputPayload; scenario: StageKScenarioPack } {
  const stageBInput = unwrapInput(stageB.input);
  const stageBSummary = extractStageBSummary(stageB.output);
  const stageCSummary = extractStageCSummary(stageC.output);

  const unitsPlanned = toInt(stageBInput?.unitsPlanned);
  if (!unitsPlanned || unitsPlanned <= 0) {
    throw new Error("missing_units_planned");
  }

  const totalLandedCostCents = toInt(stageBSummary?.totalLandedCostCents);
  if (totalLandedCostCents === null) {
    throw new Error("missing_total_landed_cost");
  }

  const contributionPerUnitCents = toInt(stageCSummary?.contributionPerUnitCents);
  if (contributionPerUnitCents === null) {
    throw new Error("missing_contribution_per_unit");
  }

  const leadTimeDays =
    toInt(stageBSummary?.leadTimeDays ?? stageBInput?.leadTimeDays) ?? 0;
  const payoutDelayDays = toInt(stageCSummary?.payoutDelayDays) ?? 0;
  const depositAmountCents = toInt(stageBSummary?.depositAmountCents ?? null);
  const balanceAmountCents = toInt(stageBSummary?.balanceAmountCents ?? null);
  const balanceDueDay = toInt(stageBSummary?.balanceDueDay ?? null);

  const baseAssumptions = normalizeAssumptions(overrides, DEFAULT_ASSUMPTIONS);
  const allowVelocityOverride = overrides?.sellThroughDays === undefined;
  const derivedSellThroughDays =
    allowVelocityOverride && velocityPrior?.velocityPerDay
      ? computeSellThroughDaysFromVelocity(
          unitsPlanned,
          baseAssumptions.sellThroughTargetPct,
          velocityPrior.velocityPerDay,
        )
      : null;
  const assumptions =
    derivedSellThroughDays !== null
      ? normalizeAssumptions(
          {
            ...(overrides ?? {}),
            sellThroughDays: derivedSellThroughDays,
          },
          DEFAULT_ASSUMPTIONS,
        )
      : baseAssumptions;

  const horizonDays = clamp(
    Math.max(
      1,
      leadTimeDays +
        assumptions.sellThroughDays +
        payoutDelayDays +
        assumptions.horizonBufferDays,
      balanceDueDay ?? 0,
    ),
    1,
    3650,
  );

  const salesStartDay = Math.max(0, leadTimeDays);
  const targetUnits = Math.max(
    0,
    Math.ceil(unitsPlanned * assumptions.sellThroughTargetPct),
  );

  const unitsSoldByDay = buildUnitsSoldByDay({
    horizonDays,
    salesStartDay,
    sellThroughDays: assumptions.sellThroughDays,
    targetUnits,
  });

  const cashflows: Array<{ day: number; amountCents: number }> = [];
  if (depositAmountCents !== null && balanceAmountCents !== null) {
    if (depositAmountCents !== 0) {
      cashflows.push({ day: 0, amountCents: -depositAmountCents });
    }
    if (balanceAmountCents !== 0) {
      cashflows.push({
        day: balanceDueDay ?? salesStartDay,
        amountCents: -balanceAmountCents,
      });
    }
  } else if (totalLandedCostCents !== 0) {
    cashflows.push({ day: 0, amountCents: -totalLandedCostCents });
  }

  cashflows.push(
    ...buildRevenueCashflows({
      unitsSoldByDay,
      contributionPerUnitCents,
      payoutDelayDays,
      horizonDays,
    }),
  );

  cashflows.sort((a, b) => a.day - b.day);

  const input: StageKInputPayload = {
    horizonDays,
    cashflows,
    unitsPlanned,
    unitsSoldByDay,
    sellThroughTargetPct: assumptions.sellThroughTargetPct,
    ...(assumptions.salvageValueCents !== 0
      ? { salvageValueCents: assumptions.salvageValueCents }
      : {}),
  };

  const scenario: StageKScenarioPack = {
    version: "scenario-pack:v1",
    derivedAt: nowIso(),
    sources: {
      stageB,
      stageC,
      ...(stageM ? { stageM } : {}),
      ...(stageS ? { stageS } : {}),
    },
    ...(derivedSellThroughDays !== null && velocityPrior
      ? {
          priors: {
            velocity: {
              source: velocityPrior.source,
              velocityPerDay: velocityPrior.velocityPerDay,
              derivedSellThroughDays,
              unitsSoldTotal: velocityPrior.unitsSoldTotal ?? null,
              maxDay: velocityPrior.maxDay ?? null,
              createdAt: velocityPrior.createdAt ?? null,
              expiresAt: velocityPrior.expiresAt ?? null,
            },
          },
        }
      : {}),
    assumptions,
    derived: {
      unitsPlanned,
      contributionPerUnitCents,
      leadTimeDays,
      payoutDelayDays,
      totalLandedCostCents,
      depositAmountCents,
      balanceAmountCents,
      balanceDueDay: balanceDueDay ?? null,
    },
    model: {
      cashflow: "linear",
      sellThrough: "linear",
    },
  };

  return { input, scenario };
}

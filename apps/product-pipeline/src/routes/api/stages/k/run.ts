/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/stages/k/run.ts
// NOTE: Exceeds 350 lines due to inline Stage K math + API orchestration; follow-up: extract helpers into lib/pipeline/stage-k-run-helpers.ts.

import type { PipelineEventContext } from "../../_lib/types";
import { z } from "zod";
import { isCooldownActive } from "@/lib/pipeline/cooldown";
import {
  computeSensitivities,
  computeStageK,
  money,
  type StageKInput,
  type StageKResult,
} from "@acme/pipeline-engine";
import {
  buildStageKScenario,
  type VelocityPrior,
} from "@/lib/pipeline/stage-k-scenario";
import {
  fetchCandidateById,
  fetchLatestCooldownByFingerprint,
  getDb,
  nowIso,
  type PipelineEnv,
} from "../../_lib/db";
import { errorResponse, jsonResponse } from "../../_lib/response";

const moneySchema = z.union([z.number(), z.string()]);

const cashflowSchema = z.object({
  day: z.number().int().min(0).max(3650),
  amountCents: moneySchema,
});

const inputSchema = z.object({
  horizonDays: z.number().int().min(1).max(3650),
  cashflows: z.array(cashflowSchema).min(1),
  unitsPlanned: z.number().int().positive().optional(),
  unitsSoldByDay: z.array(z.number().int().min(0)).optional(),
  sellThroughTargetPct: z.number().min(0).max(1).optional(),
  salvageValueCents: moneySchema.optional(),
});

const bodySchema = z.object({
  candidateId: z.string().min(1),
  input: inputSchema,
  scenario: z.unknown().optional(),
  requestedBy: z.string().min(1).optional(),
  inputVersion: z.string().min(1).optional(),
});

type StageKInputJson = z.infer<typeof inputSchema>;

type StageKOutputSummary = {
  peakCashOutlayCents: string;
  paybackDay: number | null;
  sellThroughDay: number | null;
  annualizedCapitalReturnRate: number | null;
  returnBand: "low" | "medium" | "high" | "unknown";
};

type StageKOutputJson = {
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

type NormalizedMoney = string;

type NormalizedStageKInput = Omit<StageKInputJson, "cashflows" | "salvageValueCents"> & {
  cashflows: Array<{ day: number; amountCents: NormalizedMoney }>;
  salvageValueCents?: NormalizedMoney;
};

type StageRunRow = {
  id: string;
  input_json: string | null;
  output_json: string | null;
};

type VelocityPriorRow = {
  source: string;
  velocity_per_day: number | null;
  units_sold_total: number | null;
  max_day: number | null;
  created_at: string | null;
  expires_at: string | null;
};

const ENGINE_VERSION = "stage-k:v1";

function normalizeMoney(value: number | string): NormalizedMoney | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return String(Math.round(value));
  }
  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  return trimmed;
}

function toMoney(value: NormalizedMoney): bigint {
  return BigInt(value);
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function fetchLatestStageRun(
  db: PipelineEnv["PIPELINE_DB"],
  candidateId: string,
  stage: string,
): Promise<StageRunRow | null> {
  if (!db) return null;
  const result = await db
    .prepare(
      "SELECT id, input_json, output_json FROM stage_runs WHERE candidate_id = ? AND stage = ? AND status = 'succeeded' ORDER BY created_at DESC LIMIT 1",
    )
    .bind(candidateId, stage)
    .first<StageRunRow>();

  return result ?? null;
}

async function fetchLatestVelocityPrior(
  db: PipelineEnv["PIPELINE_DB"],
  candidateId: string,
): Promise<VelocityPrior | null> {
  if (!db) return null;
  const result = await db
    .prepare(
      `
      SELECT source, velocity_per_day, units_sold_total, max_day, created_at, expires_at
      FROM velocity_priors
      WHERE candidate_id = ?
        AND (expires_at IS NULL OR expires_at >= datetime('now'))
      ORDER BY created_at DESC
      LIMIT 1
    `,
    )
    .bind(candidateId)
    .first<VelocityPriorRow>();

  if (!result || result.velocity_per_day === null) return null;
  return {
    source: result.source,
    velocityPerDay: result.velocity_per_day,
    unitsSoldTotal: result.units_sold_total,
    maxDay: result.max_day,
    createdAt: result.created_at,
    expiresAt: result.expires_at,
  };
}

function normalizeInput(input: StageKInputJson): NormalizedStageKInput {
  const cashflows = input.cashflows.map((flow) => {
    const amountCents = normalizeMoney(flow.amountCents);
    if (amountCents === null) {
      throw new Error("invalid_money");
    }
    return { day: flow.day, amountCents };
  });

  let salvageValueCents: NormalizedMoney | undefined;
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
      amountCents: toMoney(flow.amountCents),
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
      ? { salvageValueCents: toMoney(input.salvageValueCents) }
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

export const onRequestPost = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, "invalid_body", {
      issues: parsed.error.flatten(),
    });
  }

  const { candidateId, input, scenario, requestedBy, inputVersion } = parsed.data;
  const db = getDb(env);
  const candidate = await fetchCandidateById(db, candidateId);
  if (!candidate) {
    return errorResponse(404, "candidate_not_found", { candidateId });
  }
  if (candidate.fingerprint) {
    const cooldown = await fetchLatestCooldownByFingerprint(
      db,
      candidate.fingerprint,
    );
    if (
      cooldown &&
      isCooldownActive(cooldown.severity, cooldown.recheck_after)
    ) {
      return errorResponse(409, "cooldown_active", {
        fingerprint: cooldown.fingerprint,
        reasonCode: cooldown.reason_code,
        severity: cooldown.severity,
        recheckAfter: cooldown.recheck_after,
        whatWouldChange: cooldown.what_would_change,
      });
    }
  }

  let normalizedInput: NormalizedStageKInput;
  try {
    normalizedInput = normalizeInput(input);
  } catch {
    return errorResponse(400, "invalid_money");
  }

  let resolvedScenario = scenario;
  if (resolvedScenario === undefined || resolvedScenario === null) {
    const stageB = await fetchLatestStageRun(db, candidateId, "B");
    if (!stageB) {
      return errorResponse(409, "stage_b_required", { candidateId });
    }
    const stageC = await fetchLatestStageRun(db, candidateId, "C");
    if (!stageC) {
      return errorResponse(409, "stage_c_required", { candidateId });
    }
    const stageM = await fetchLatestStageRun(db, candidateId, "M");
    const stageS = await fetchLatestStageRun(db, candidateId, "S");
    const velocityPrior = await fetchLatestVelocityPrior(db, candidateId);

    try {
      const { scenario: computedScenario } = buildStageKScenario({
        stageB: {
          runId: stageB.id,
          input: safeJsonParse(stageB.input_json),
          output: safeJsonParse(stageB.output_json),
        },
        stageC: {
          runId: stageC.id,
          input: safeJsonParse(stageC.input_json),
          output: safeJsonParse(stageC.output_json),
        },
        ...(stageM
          ? {
              stageM: {
                runId: stageM.id,
                input: safeJsonParse(stageM.input_json),
                output: safeJsonParse(stageM.output_json),
              },
            }
          : {}),
        ...(stageS
          ? {
              stageS: {
                runId: stageS.id,
                input: safeJsonParse(stageS.input_json),
                output: safeJsonParse(stageS.output_json),
              },
            }
          : {}),
        ...(velocityPrior ? { velocityPrior } : {}),
      });
      resolvedScenario = computedScenario;
    } catch (error) {
      console.error(error);
      return errorResponse(422, "scenario_build_failed", { candidateId });
    }
  }

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
    engineVersion: ENGINE_VERSION,
    inputHash,
    summary,
    result: serializeStageKResult(result),
    sensitivities,
  };

  const now = nowIso();
  const scenarioVersion =
    resolvedScenario && typeof resolvedScenario === "object"
      ? (resolvedScenario as { version?: unknown }).version
      : null;
  const resolvedInputVersion =
    inputVersion ??
    (typeof scenarioVersion === "string" && scenarioVersion.trim()
      ? scenarioVersion
      : "v1");

  const inputPayload = {
    input: normalizedInput,
    inputHash,
    inputVersion: resolvedInputVersion,
    ...(resolvedScenario !== undefined ? { scenario: resolvedScenario } : {}),
    ...(requestedBy ? { requestedBy } : {}),
  };

  await db.batch([
    db
      .prepare(
        "INSERT INTO stage_runs (id, candidate_id, stage, status, input_version, input_json, output_json, error_json, started_at, finished_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        crypto.randomUUID(),
        candidateId,
        "K",
        "succeeded",
        resolvedInputVersion,
        JSON.stringify(inputPayload),
        JSON.stringify(output),
        null,
        now,
        now,
        now,
      ),
    db
      .prepare("UPDATE candidates SET stage_status = ?, updated_at = ? WHERE id = ?")
      .bind("K_DONE", now, candidateId),
  ]);

  return jsonResponse({
    ok: true,
    candidateId,
    summary,
    inputHash,
  });
};

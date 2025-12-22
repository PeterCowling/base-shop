/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/stages/k/compose.ts

import type { D1Database, PipelineEventContext } from "../../_lib/types";
import { z } from "zod";
import {
  buildStageKScenario,
  type VelocityPrior,
  type StageKScenarioAssumptions,
} from "@/lib/pipeline/stage-k-scenario";
import { fetchCandidateById, getDb, type PipelineEnv } from "../../_lib/db";
import { errorResponse, jsonResponse } from "../../_lib/response";

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

const assumptionsSchema = z
  .object({
    sellThroughDays: z.number().int().min(1).max(3650).optional(),
    sellThroughTargetPct: z.number().min(0).max(1).optional(),
    horizonBufferDays: z.number().int().min(0).max(3650).optional(),
    salvageValueCents: z.number().int().min(0).optional(),
  })
  .optional();

const bodySchema = z.object({
  candidateId: z.string().min(1),
  assumptions: assumptionsSchema,
  requestedBy: z.string().min(1).optional(),
});

function safeJsonParse(value: string | null): unknown | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeAssumptions(
  input: z.infer<typeof assumptionsSchema> | undefined,
): Partial<StageKScenarioAssumptions> | undefined {
  if (!input) return undefined;
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  return entries.length > 0
    ? (Object.fromEntries(entries) as Partial<StageKScenarioAssumptions>)
    : undefined;
}

async function fetchLatestStageRun(
  db: D1Database,
  candidateId: string,
  stage: string,
): Promise<StageRunRow | null> {
  const result = await db
    .prepare(
      "SELECT id, input_json, output_json FROM stage_runs WHERE candidate_id = ? AND stage = ? AND status = 'succeeded' ORDER BY created_at DESC LIMIT 1",
    )
    .bind(candidateId, stage)
    .first<StageRunRow>();

  return result ?? null;
}

async function fetchLatestVelocityPrior(
  db: D1Database,
  candidateId: string,
): Promise<VelocityPrior | null> {
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

  const { candidateId, assumptions } = parsed.data;
  const db = getDb(env);
  const candidate = await fetchCandidateById(db, candidateId);
  if (!candidate) {
    return errorResponse(404, "candidate_not_found", { candidateId });
  }

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
  const normalizedAssumptions = normalizeAssumptions(assumptions);
  const velocityPrior = await fetchLatestVelocityPrior(db, candidateId);

  try {
    const { input, scenario } = buildStageKScenario({
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
      ...(normalizedAssumptions ? { assumptions: normalizedAssumptions } : {}),
    });

    return jsonResponse({
      ok: true,
      candidateId,
      input,
      scenario,
    });
  } catch (error) {
    console.error(error);
    return errorResponse(422, "scenario_build_failed", {
      candidateId,
    });
  }
};

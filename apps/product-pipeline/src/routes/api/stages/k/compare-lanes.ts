/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/stages/k/compare-lanes.ts

import type { PipelineEventContext } from "../../_lib/types";
import { z } from "zod";
import { computeStageK } from "@acme/pipeline-engine";
import {
  buildStageKScenario,
  type VelocityPrior,
} from "@/lib/pipeline/stage-k-scenario";
import { computeStageBOutput } from "@/lib/pipeline/stage-b";
import {
  buildAdjustedStageBInput,
  buildLaneWarnings,
  buildSummary,
  safeJsonParse,
  toStageKInput,
  unwrapStageBInput,
  type LaneVersionSnapshot,
  type StageKSummary,
} from "@/lib/pipeline/stage-k-lane-compare";
import {
  fetchCandidateById,
  getDb,
  type PipelineEnv,
} from "../../_lib/db";
import { errorResponse, jsonResponse } from "../../_lib/response";

const bodySchema = z.object({
  candidateId: z.string().min(1),
  laneVersionIds: z.array(z.string().min(1)).min(1).max(6),
});

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

  const { candidateId, laneVersionIds } = parsed.data;
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
  const velocityPrior = await fetchLatestVelocityPrior(db, candidateId);

  const baseStageBInput = unwrapStageBInput(safeJsonParse(stageB.input_json));
  if (
    !baseStageBInput ||
    !Number.isFinite(baseStageBInput.unitsPlanned) ||
    baseStageBInput.unitsPlanned <= 0 ||
    baseStageBInput.unitCostCents === undefined ||
    baseStageBInput.unitCostCents === null
  ) {
    return errorResponse(422, "stage_b_incomplete", { candidateId });
  }

  const stageBInputPayload = safeJsonParse(stageB.input_json);
  const stageBOutputPayload = safeJsonParse(stageB.output_json);
  const stageCInputPayload = safeJsonParse(stageC.input_json);
  const stageCOutputPayload = safeJsonParse(stageC.output_json);

  let baseSummary: StageKSummary;
  try {
    const { input: baseInput } = buildStageKScenario({
      stageB: {
        runId: stageB.id,
        input: stageBInputPayload,
        output: stageBOutputPayload,
      },
      stageC: {
        runId: stageC.id,
        input: stageCInputPayload,
        output: stageCOutputPayload,
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
    baseSummary = buildSummary(computeStageK(toStageKInput(baseInput)));
  } catch (error) {
    console.error(error);
    return errorResponse(422, "scenario_build_failed", { candidateId });
  }

  const uniqueIds = Array.from(new Set(laneVersionIds));
  const placeholders = uniqueIds.map(() => "?").join(", ");
  const laneQuery = `
    SELECT
      lane_versions.id,
      lane_versions.lane_id,
      lane_versions.status,
      lane_versions.confidence,
      lane_versions.expires_at,
      lane_versions.cost_basis,
      lane_versions.cost_amount,
      lane_versions.lead_time_base_days,
      logistics_lanes.name AS lane_name,
      logistics_lanes.model AS lane_model,
      logistics_lanes.incoterm AS lane_incoterm
    FROM lane_versions
    JOIN logistics_lanes
      ON logistics_lanes.id = lane_versions.lane_id
    WHERE lane_versions.id IN (${placeholders})
  `;
  const laneRows = await db
    .prepare(laneQuery)
    .bind(...uniqueIds)
    .all<LaneVersionSnapshot>();
  const laneVersions = laneRows.results ?? [];
  if (laneVersions.length === 0) {
    return errorResponse(404, "lane_versions_not_found", { candidateId });
  }

  const comparisons = laneVersions.map((row) => {
    const adjustedInput = buildAdjustedStageBInput(baseStageBInput, row);
    const stageBOutput = computeStageBOutput(adjustedInput);

    const { input } = buildStageKScenario({
      stageB: {
        runId: `lane-${row.id}`,
        input: { input: adjustedInput, inputVersion: "lane-compare" },
        output: stageBOutput,
      },
      stageC: {
        runId: stageC.id,
        input: stageCInputPayload,
        output: stageCOutputPayload,
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

    const summary = buildSummary(computeStageK(toStageKInput(input)));

    return {
      laneVersionId: row.id,
      laneId: row.lane_id,
      laneName: row.lane_name,
      laneModel: row.lane_model,
      laneIncoterm: row.lane_incoterm,
      laneStatus: row.status,
      laneConfidence: row.confidence,
      laneExpiresAt: row.expires_at,
      laneCostBasis: row.cost_basis,
      laneCostAmount: row.cost_amount,
      laneLeadTimeBaseDays: row.lead_time_base_days,
      warnings: buildLaneWarnings(row),
      summary,
    };
  });

  return jsonResponse({
    ok: true,
    candidateId,
    base: {
      summary: baseSummary,
      lane: baseStageBInput.lane ?? null,
    },
    comparisons,
  });
};

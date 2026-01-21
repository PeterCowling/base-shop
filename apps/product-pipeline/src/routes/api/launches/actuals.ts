/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/launches/actuals.ts

import { z } from "zod";

import {
  buildUnitsSoldByDay,
  computeStageKFromPayload,
  parseLaunchCsv,
  type StageKInputPayload,
} from "@/lib/pipeline/launch-actuals";
import { safeJsonParse, unwrapStageBInput } from "@/lib/pipeline/stage-k-lane-compare";

import { getDb, nowIso, type PipelineEnv } from "../_lib/db";
import { errorResponse, jsonResponse } from "../_lib/response";
import type { D1PreparedStatement, PipelineEventContext } from "../_lib/types";

const bodySchema = z.object({
  launchId: z.string().min(1),
  csv: z.string().min(1),
  actualCostAmount: z.number().min(0).optional(),
  actualLeadTimeDays: z.number().int().min(0).optional(),
  source: z.string().min(1).optional(),
  requestedBy: z.string().min(1).optional(),
});

function extractLaneMeta(value: unknown): { laneVersionId: string; laneId: string } | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const laneVersionId =
    typeof record["laneVersionId"] === "string" && record["laneVersionId"].trim()
      ? record["laneVersionId"]
      : null;
  const laneId =
    typeof record["laneId"] === "string" && record["laneId"].trim()
      ? record["laneId"]
      : null;
  if (!laneVersionId || !laneId) return null;
  return { laneVersionId, laneId };
}

function extractStageKInput(
  raw: string | null,
): StageKInputPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { input?: unknown };
    const candidate = parsed?.input ?? parsed;
    if (!candidate || typeof candidate !== "object") return null;
    const payload = candidate as StageKInputPayload;
    if (!Array.isArray(payload.cashflows)) return null;
    return payload;
  } catch {
    return null;
  }
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

  const {
    launchId,
    csv,
    source,
    requestedBy,
    actualCostAmount,
    actualLeadTimeDays,
  } = parsed.data;
  const db = getDb(env);
  const launch = await db
    .prepare("SELECT id, candidate_id FROM launch_plans WHERE id = ?")
    .bind(launchId)
    .first<{ id: string; candidate_id: string }>();
  if (!launch) {
    return errorResponse(404, "launch_not_found", { launchId });
  }

  const rows = parseLaunchCsv(csv);
  if (rows.length === 0) {
    return errorResponse(400, "invalid_csv");
  }

  const maxDay = rows.reduce((max, row) => Math.max(max, row.day), 0);
  const unitsSoldTotal = rows.reduce((sum, row) => sum + row.units, 0);
  const velocityPerDay = maxDay > 0 ? unitsSoldTotal / maxDay : null;

  const latestStageK = await db
    .prepare(
      "SELECT input_json FROM stage_runs WHERE candidate_id = ? AND stage = 'K' ORDER BY created_at DESC LIMIT 1",
    )
    .bind(launch.candidate_id)
    .first<{ input_json: string | null }>();
  const baseInput = extractStageKInput(latestStageK?.input_json ?? null);
  if (!baseInput) {
    return errorResponse(409, "stage_k_required");
  }

  const wantsLaneActuals =
    actualCostAmount !== undefined || actualLeadTimeDays !== undefined;
  let laneMeta: { laneVersionId: string; laneId: string } | null = null;
  if (wantsLaneActuals) {
    const latestStageB = await db
      .prepare(
        "SELECT input_json FROM stage_runs WHERE candidate_id = ? AND stage = 'B' ORDER BY created_at DESC LIMIT 1",
      )
      .bind(launch.candidate_id)
      .first<{ input_json: string | null }>();
    const stageBInput = unwrapStageBInput(
      safeJsonParse(latestStageB?.input_json ?? null),
    );
    laneMeta = extractLaneMeta(stageBInput?.lane);
  }

  const horizonDays = Math.max(baseInput.horizonDays ?? 0, maxDay);
  const unitsSoldByDay = buildUnitsSoldByDay(rows, horizonDays);
  const updatedInput: StageKInputPayload = {
    ...baseInput,
    horizonDays,
    unitsSoldByDay,
  };

  let computed;
  try {
    computed = await computeStageKFromPayload(updatedInput);
  } catch {
    return errorResponse(400, "invalid_stage_k_input");
  }

  const now = nowIso();
  const actualsId = crypto.randomUUID();
  const stageKRunId = crypto.randomUUID();
  const stageLRunId = crypto.randomUUID();
  const laneActualsId = wantsLaneActuals ? crypto.randomUUID() : null;
  const velocityPriorId =
    velocityPerDay !== null && Number.isFinite(velocityPerDay)
      ? crypto.randomUUID()
      : null;
  const inputPayload = {
    input: computed.normalizedInput,
    inputHash: computed.inputHash,
    inputVersion: "pilot_v1",
    ...(requestedBy ? { requestedBy } : {}),
  };

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        "INSERT INTO launch_actuals (id, launch_id, candidate_id, source, rows_json, units_sold_total, max_day, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        actualsId,
        launchId,
        launch.candidate_id,
        source ?? "csv",
        JSON.stringify(rows),
        unitsSoldTotal,
        maxDay,
        now,
      ),
    ...(velocityPriorId
      ? [
          db
            .prepare(
              "INSERT INTO velocity_priors (id, candidate_id, source, velocity_per_day, units_sold_total, max_day, notes, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(
              velocityPriorId,
              launch.candidate_id,
              "pilot_actuals",
              velocityPerDay,
              unitsSoldTotal,
              maxDay,
              requestedBy ?? null,
              null,
              now,
            ),
        ]
      : []),
    db
      .prepare(
        "INSERT INTO stage_runs (id, candidate_id, stage, status, input_version, input_json, output_json, error_json, started_at, finished_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        stageLRunId,
        launch.candidate_id,
        "L",
        "succeeded",
        "v1",
        JSON.stringify({
          launchId,
          actualsId,
          requestedBy,
        }),
        JSON.stringify({
          unitsSoldTotal,
          maxDay,
          velocityPerDay,
          rowsIngested: rows.length,
        }),
        null,
        now,
        now,
        now,
      ),
    db
      .prepare(
        "INSERT INTO stage_runs (id, candidate_id, stage, status, input_version, input_json, output_json, error_json, started_at, finished_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        stageKRunId,
        launch.candidate_id,
        "K",
        "succeeded",
        "pilot_v1",
        JSON.stringify(inputPayload),
        JSON.stringify(computed.output),
        null,
        now,
        now,
        now,
      ),
    db
      .prepare("UPDATE candidates SET stage_status = ?, updated_at = ? WHERE id = ?")
      .bind("L_DONE", now, launch.candidate_id),
    db
      .prepare("UPDATE launch_plans SET status = ?, updated_at = ? WHERE id = ?")
      .bind("ACTUALS_INGESTED", now, launchId),
  ];

  let resolvedLaneActualsId: string | null = null;
  if (laneActualsId && laneMeta) {
    const laneVersion = await db
      .prepare("SELECT id, lane_id FROM lane_versions WHERE id = ?")
      .bind(laneMeta.laneVersionId)
      .first<{ id: string; lane_id: string }>();
    if (laneVersion) {
      resolvedLaneActualsId = laneActualsId;
      statements.push(
        db
          .prepare(
            "INSERT INTO lane_actuals (id, lane_version_id, lane_id, source, actual_cost_amount, actual_lead_time_days, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          )
          .bind(
            laneActualsId,
            laneVersion.id,
            laneVersion.lane_id,
            source ?? "pilot_actuals",
            actualCostAmount ?? null,
            actualLeadTimeDays ?? null,
            requestedBy ?? null,
            now,
          ),
      );
    }
  }

  await db.batch(statements);

  return jsonResponse({
    ok: true,
    launchId,
    actualsId,
    stageKRunId,
    laneActualsId: resolvedLaneActualsId,
    summary: computed.summary,
  });
};

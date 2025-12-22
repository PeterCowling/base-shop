/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/logistics/lane-versions/[id]/actuals.ts

import type { PipelineEventContext } from "../../../_lib/types";
import { z } from "zod";
import { getDb, nowIso, type PipelineEnv } from "../../../_lib/db";
import { errorResponse, jsonResponse } from "../../../_lib/response";

const createSchema = z
  .object({
    actualCostAmount: z.number().min(0).optional(),
    actualLeadTimeDays: z.number().int().min(0).optional(),
    source: z.string().min(1).optional(),
    notes: z.string().min(1).optional(),
    promoteConfidence: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.actualCostAmount === undefined &&
      data.actualLeadTimeDays === undefined
    ) {
      ctx.addIssue({ code: "custom", path: [], message: "missing_actuals" });
    }
  });

type VersionRow = {
  id: string;
  lane_id: string;
  confidence: string;
  cost_amount: number | null;
  lead_time_base_days: number | null;
};

type ActualsSummaryRow = {
  actuals_count: number | null;
  actual_cost_avg: number | null;
  actual_lead_time_avg: number | null;
};

function buildVariance(actual: number | null, quoted: number | null): number | null {
  if (actual === null || quoted === null || quoted === 0) return null;
  return (actual - quoted) / quoted;
}

function shouldPromoteToC3(
  actualsCount: number,
  costVariance: number | null,
  leadVariance: number | null,
): boolean {
  if (actualsCount < 2) return false;
  const checks = [costVariance, leadVariance].filter(
    (value): value is number => value !== null,
  );
  if (checks.length === 0) return false;
  return checks.every((value) => Math.abs(value) <= 0.1);
}

export const onRequestPost = async ({
  params,
  request,
  env,
}: PipelineEventContext<PipelineEnv, { id: string }>) => {
  const versionId = String(params["id"]);
  const raw = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, "invalid_body", {
      issues: parsed.error.flatten(),
    });
  }

  const { actualCostAmount, actualLeadTimeDays, source, notes, promoteConfidence } =
    parsed.data;
  const db = getDb(env);

  const version = await db
    .prepare(
      "SELECT id, lane_id, confidence, cost_amount, lead_time_base_days FROM lane_versions WHERE id = ?",
    )
    .bind(versionId)
    .first<VersionRow>();

  if (!version) {
    return errorResponse(404, "lane_version_not_found", { versionId });
  }

  const id = crypto.randomUUID();
  const now = nowIso();

  await db
    .prepare(
      "INSERT INTO lane_actuals (id, lane_version_id, lane_id, source, actual_cost_amount, actual_lead_time_days, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      id,
      versionId,
      version.lane_id,
      source ?? null,
      actualCostAmount ?? null,
      actualLeadTimeDays ?? null,
      notes ?? null,
      now,
    )
    .run();

  const summary = await db
    .prepare(
      "SELECT COUNT(*) AS actuals_count, AVG(actual_cost_amount) AS actual_cost_avg, AVG(actual_lead_time_days) AS actual_lead_time_avg FROM lane_actuals WHERE lane_version_id = ?",
    )
    .bind(versionId)
    .first<ActualsSummaryRow>();

  const actualsCount = summary?.actuals_count ?? 0;
  const actualCostAvg = summary?.actual_cost_avg ?? null;
  const actualLeadTimeAvg = summary?.actual_lead_time_avg ?? null;
  const costVariancePct = buildVariance(actualCostAvg, version.cost_amount);
  const leadTimeVariancePct = buildVariance(
    actualLeadTimeAvg,
    version.lead_time_base_days,
  );

  let promoted = false;
  if (
    promoteConfidence &&
    version.confidence !== "C3" &&
    shouldPromoteToC3(actualsCount, costVariancePct, leadTimeVariancePct)
  ) {
    await db
      .prepare("UPDATE lane_versions SET confidence = ?, updated_at = ? WHERE id = ?")
      .bind("C3", now, versionId)
      .run();
    promoted = true;
  }

  return jsonResponse({
    ok: true,
    actuals: {
      id,
      laneVersionId: versionId,
      laneId: version.lane_id,
      source: source ?? null,
      actualCostAmount: actualCostAmount ?? null,
      actualLeadTimeDays: actualLeadTimeDays ?? null,
      notes: notes ?? null,
      createdAt: now,
    },
    summary: {
      actualsCount,
      actualCostAvg,
      actualLeadTimeAvg,
      costVariancePct,
      leadTimeVariancePct,
      promoted,
    },
  });
};

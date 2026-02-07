/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/stages/p/run-all.ts

import { z } from "zod";

import { getDb, type PipelineEnv } from "../../_lib/db";
import { errorResponse, jsonResponse } from "../../_lib/response";
import type { PipelineEventContext } from "../../_lib/types";

import { onRequestPost as runStageP } from "./run";

const filterSchema = z.object({
  status: z.array(z.string().min(1)).optional(),
  source: z.string().min(1).optional(),
  sourceContext: z.string().min(1).optional(),
  triageBand: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
  promotionLimit: z.number().int().min(0).max(500).optional(),
  requestedBy: z.string().min(1).optional(),
  inputVersion: z.string().min(1).optional(),
  overridePromotions: z
    .array(
      z.object({
        leadId: z.string().min(1),
        reason: z.string().min(1),
        requestedBy: z.string().min(1).optional(),
      }),
    )
    .optional(),
});

function buildPlaceholders(count: number): string {
  return Array.from({ length: count }, () => "?").join(", ");
}

export const onRequestPost = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const raw = await request.json().catch(() => null);
  const parsed = filterSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, "invalid_body", { issues: parsed.error.flatten() });
  }

  const {
    status,
    source,
    sourceContext,
    triageBand,
    search,
    promotionLimit,
    requestedBy,
    inputVersion,
    overridePromotions,
  } = parsed.data;

  const db = getDb(env);
  const conditions: string[] = [];
  const binds: Array<string> = [];

  const statuses = status && status.length > 0 ? status : ["NEW", "ON_HOLD"];
  if (statuses.length > 0) {
    conditions.push(`status IN (${buildPlaceholders(statuses.length)})`);
    binds.push(...statuses);
  }
  if (source) {
    conditions.push("source = ?");
    binds.push(source);
  }
  if (sourceContext) {
    conditions.push("source_context LIKE ?");
    binds.push(`%${sourceContext}%`);
  }
  if (triageBand) {
    conditions.push("triage_band = ?");
    binds.push(triageBand);
  }
  if (search) {
    conditions.push("(title LIKE ? OR url LIKE ?)");
    const pattern = `%${search}%`;
    binds.push(pattern, pattern);
  }

  let query = "SELECT id FROM leads";
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += " ORDER BY created_at DESC";

  const result = await db.prepare(query).bind(...binds).all<{ id: string }>();
  const leadIds = (result.results ?? []).map((row) => row.id);
  if (leadIds.length === 0) {
    return jsonResponse({
      ok: true,
      processed: 0,
      promoted: 0,
      promotionCap: 0,
      dailyPromotionLimit: 0,
      dailyPromotionsUsed: 0,
      dailyPromotionRemaining: 0,
      results: [],
    });
  }

  const proxyRequest = new Request("https://internal.stage-p/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leadIds,
      promotionLimit,
      requestedBy,
      inputVersion,
      overridePromotions,
    }),
  });

  return runStageP({ request: proxyRequest, env, params: {} });
};
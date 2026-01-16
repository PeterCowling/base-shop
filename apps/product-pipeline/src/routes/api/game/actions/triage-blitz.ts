/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/game/actions/triage-blitz.ts

import type { PipelineEventContext } from "../../_lib/types";
import { z } from "zod";
import { getDb, type PipelineEnv } from "../../_lib/db";
import { jsonResponse } from "../../_lib/response";
import { onRequestPost as runStageP } from "../../stages/p/run";

const bodySchema = z
  .object({
    leadCount: z.number().int().min(1).max(200).optional(),
  })
  .optional();

type LeadRow = { id: string };

export const onRequestPost = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonResponse(
      {
        ok: false,
        mission: "triage-blitz",
        summary: "Invalid mission payload",
        details: parsed.error.flatten(),
      },
      400,
    );
  }

  const leadCount = parsed.data?.leadCount ?? 40;
  const db = getDb(env);
  const leadsResult = await db
    .prepare(
      "SELECT id FROM leads WHERE status IN (?, ?) ORDER BY created_at DESC LIMIT ?",
    )
    .bind("NEW", "ON_HOLD", leadCount)
    .all<LeadRow>();

  const leadIds = (leadsResult.results ?? []).map((row) => row.id);
  if (leadIds.length === 0) {
    return jsonResponse({
      ok: true,
      mission: "triage-blitz",
      summary: "No leads available for triage",
      details: { leadCount },
    });
  }

  const stageRequest = new Request(new URL("/api/stages/p/run", request.url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leadIds,
      promotionLimit: 2,
      requestedBy: "mission-control",
    }),
  });

  const stageResponse = await runStageP({
    request: stageRequest,
    env,
    params: {},
  });
  const payload = (await stageResponse.json().catch(() => null)) as
    | {
        ok?: boolean;
        processed?: number;
        promoted?: number;
        promotionCap?: number;
        results?: unknown;
      }
    | null;

  if (!stageResponse.ok || payload?.ok !== true) {
    return jsonResponse(
      {
        ok: false,
        mission: "triage-blitz",
        summary: "Stage P run failed",
        details: payload,
      },
      500,
    );
  }

  const processed = payload.processed ?? leadIds.length;
  const promoted = payload.promoted ?? 0;

  return jsonResponse({
    ok: true,
    mission: "triage-blitz",
    summary: `Stage P processed ${processed} leads; promoted ${promoted}`,
    details: payload,
  });
};

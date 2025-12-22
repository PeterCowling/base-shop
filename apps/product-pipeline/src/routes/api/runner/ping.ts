/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/runner/ping.ts

import type { PipelineEventContext } from "../_lib/types";
import { z } from "zod";
import { getDb, nowIso, type PipelineEnv } from "../_lib/db";
import { errorResponse, jsonResponse } from "../_lib/response";

const bodySchema = z.object({
  runnerId: z.string().min(1),
  mode: z.enum(["fetch", "playwright"]).optional(),
  headless: z.boolean().optional(),
  humanGate: z.boolean().optional(),
  sessionProfile: z.string().min(1).optional(),
  playbook: z.string().min(1).optional(),
  sessionRotation: z.enum(["none", "daily", "per-job", "per-candidate"]).optional(),
  claimMode: z.enum(["queue", "runner"]).optional(),
  captureEnabled: z.boolean().optional(),
});

function compactDetails(details: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined),
  );
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

  const { runnerId, ...rest } = parsed.data;
  const details = compactDetails(rest);
  const db = getDb(env);
  const now = nowIso();

  await db
    .prepare(
      "INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(
      crypto.randomUUID(),
      "runner",
      runnerId,
      "runner.heartbeat",
      JSON.stringify(details),
      now,
    )
    .run();

  return jsonResponse({ ok: true, runnerId, receivedAt: now });
};

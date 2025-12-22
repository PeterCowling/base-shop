/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/launches/decision.ts

import type { D1PreparedStatement, PipelineEventContext } from "../_lib/types";
import { z } from "zod";
import { getDb, nowIso, type PipelineEnv } from "../_lib/db";
import { errorResponse, jsonResponse } from "../_lib/response";

const bodySchema = z.object({
  launchId: z.string().min(1),
  decision: z.enum(["SCALE", "KILL"]),
  notes: z.string().min(1).optional(),
  requestedBy: z.string().min(1).optional(),
});

type LaunchRow = {
  id: string;
  candidate_id: string;
};

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

  const { launchId, decision, notes, requestedBy } = parsed.data;
  const db = getDb(env);
  const launch = await db
    .prepare("SELECT id, candidate_id FROM launch_plans WHERE id = ?")
    .bind(launchId)
    .first<LaunchRow>();
  if (!launch) {
    return errorResponse(404, "launch_not_found", { launchId });
  }

  const now = nowIso();
  const decisionId = crypto.randomUUID();
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        "INSERT INTO launch_decisions (id, launch_id, candidate_id, decision, notes, decided_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        decisionId,
        launchId,
        launch.candidate_id,
        decision,
        notes ?? null,
        requestedBy ?? null,
        now,
      ),
    db
      .prepare(
        "UPDATE candidates SET decision = ?, decision_reason = ?, updated_at = ? WHERE id = ?",
      )
      .bind(decision, "launch_decision", now, launch.candidate_id),
    db
      .prepare("UPDATE launch_plans SET updated_at = ? WHERE id = ?")
      .bind(now, launchId),
  ];

  await db.batch(statements);

  return jsonResponse({
    ok: true,
    launchId,
    decisionId,
  });
};

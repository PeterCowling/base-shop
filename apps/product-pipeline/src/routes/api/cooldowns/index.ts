/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/cooldowns/index.ts

import { z } from "zod";

import {
  computeRecheckAfter,
  type CooldownSeverity,
  isCooldownActive,
} from "@/lib/pipeline/cooldown";

import {
  type CooldownRow,
  fetchCandidateById,
  getDb,
  nowIso,
  type PipelineEnv,
} from "../_lib/db";
import { errorResponse, jsonResponse } from "../_lib/response";
import type { PipelineEventContext } from "../_lib/types";

const createSchema = z
  .object({
    candidateId: z.string().min(1).optional(),
    fingerprint: z.string().min(1).optional(),
    reasonCode: z.string().min(1),
    severity: z.enum(["permanent", "long_cooldown", "short_cooldown"]),
    recheckAfter: z.string().min(1).optional(),
    recheckAfterDays: z.number().int().min(1).max(3650).optional(),
    whatWouldChange: z.string().min(1),
    snapshot: z.unknown().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.candidateId && !data.fingerprint) {
      ctx.addIssue({
        code: "custom",
        path: ["candidateId"],
        message: "candidate_or_fingerprint_required",
      });
    }
  });

function parseLimit(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(100, Math.max(1, parsed));
}

function normalizeCooldown(row: CooldownRow) {
  return {
    id: row.id,
    fingerprint: row.fingerprint,
    reasonCode: row.reason_code,
    severity: row.severity,
    recheckAfter: row.recheck_after,
    whatWouldChange: row.what_would_change,
    createdAt: row.created_at,
    active: isCooldownActive(row.severity, row.recheck_after),
  };
}

export const onRequestGet = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const url = new URL(request.url);
  const fingerprintParam = url.searchParams.get("fingerprint");
  const candidateId = url.searchParams.get("candidate_id");
  const activeOnly = url.searchParams.get("active") === "true";
  const limit = parseLimit(url.searchParams.get("limit"), 20);

  const db = getDb(env);
  let fingerprint = fingerprintParam;
  if (!fingerprint && candidateId) {
    const candidate = await fetchCandidateById(db, candidateId);
    fingerprint = candidate?.fingerprint ?? null;
  }

  if (!fingerprint) {
    return errorResponse(400, "missing_fingerprint");
  }

  const rows = await db
    .prepare(
      "SELECT id, fingerprint, reason_code, severity, recheck_after, what_would_change, snapshot_json, created_at FROM cooldowns WHERE fingerprint = ? ORDER BY created_at DESC LIMIT ?",
    )
    .bind(fingerprint, limit)
    .all<CooldownRow>();

  let cooldowns = (rows.results ?? []).map(normalizeCooldown);
  if (activeOnly) {
    cooldowns = cooldowns.filter((item) => item.active);
  }

  return jsonResponse({ ok: true, fingerprint, cooldowns });
};

export const onRequestPost = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const raw = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, "invalid_body", {
      issues: parsed.error.flatten(),
    });
  }

  const {
    candidateId,
    fingerprint: fingerprintParam,
    reasonCode,
    severity,
    recheckAfter,
    recheckAfterDays,
    whatWouldChange,
    snapshot,
  } = parsed.data;

  const db = getDb(env);
  let fingerprint = fingerprintParam ?? null;
  if (!fingerprint && candidateId) {
    const fetched = await fetchCandidateById(db, candidateId);
    fingerprint = fetched?.fingerprint ?? null;
  }

  if (!fingerprint) {
    return errorResponse(400, "fingerprint_not_found");
  }

  let computedRecheck: string | null = null;
  if (severity !== "permanent") {
    if (recheckAfter) {
      const parsedDate = Date.parse(recheckAfter);
      if (Number.isNaN(parsedDate)) {
        return errorResponse(400, "invalid_recheck_after");
      }
      computedRecheck = new Date(parsedDate).toISOString();
    } else {
      const daysOverride = recheckAfterDays ?? undefined;
      computedRecheck = computeRecheckAfter(
        severity as CooldownSeverity,
        daysOverride,
      );
    }
  }

  const now = nowIso();
  const id = crypto.randomUUID();
  const snapshotJson =
    snapshot === undefined ? null : JSON.stringify(snapshot);

  const statements = [
    db
      .prepare(
        "INSERT INTO cooldowns (id, fingerprint, reason_code, severity, recheck_after, what_would_change, snapshot_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        id,
        fingerprint,
        reasonCode,
        severity,
        computedRecheck,
        whatWouldChange,
        snapshotJson,
        now,
      ),
  ];

  if (candidateId) {
    const decision = severity === "permanent" ? "REJECTED" : "HOLD";
    statements.push(
      db
        .prepare(
          "UPDATE candidates SET decision = ?, decision_reason = ?, stage_status = ?, updated_at = ? WHERE id = ?",
        )
        .bind(decision, reasonCode, "COOLDOWN", now, candidateId),
    );
  }

  await db.batch(statements);

  return jsonResponse(
    {
      ok: true,
      cooldown: {
        id,
        fingerprint,
        reasonCode,
        severity,
        recheckAfter: computedRecheck,
        whatWouldChange,
        createdAt: now,
        active: isCooldownActive(severity, computedRecheck),
      },
    },
    201,
  );
};

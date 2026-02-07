/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/stages/p/run.ts

import { z } from "zod";

import { buildCooldownPlan, isCooldownActive } from "@/lib/pipeline/cooldown";
import { fingerprintLead } from "@/lib/pipeline/fingerprint";
import { triageLead } from "@/lib/pipeline/triage";

import {
  fetchCooldownsByFingerprints,
  fetchLeadsByIds,
  getDb,
  nowIso,
  type PipelineEnv,
} from "../../_lib/db";
import { errorResponse, jsonResponse } from "../../_lib/response";
import type { D1Database, D1PreparedStatement, PipelineEventContext } from "../../_lib/types";

const DEFAULT_DAILY_PROMOTION_LIMIT = 5;

const bodySchema = z.object({
  leadIds: z.array(z.string().min(1)).min(1),
  promotionLimit: z.number().int().min(0).max(500).optional(),
  requestedBy: z.string().min(1).optional(),
  inputVersion: z.string().min(1).optional(),
});

function buildPlaceholders(count: number): string {
  return Array.from({ length: count }, () => "?").join(", ");
}

function parseDailyPromotionLimit(env: PipelineEnv): number {
  const raw = env.PIPELINE_PROMOTION_DAILY_LIMIT;
  if (!raw) return DEFAULT_DAILY_PROMOTION_LIMIT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_DAILY_PROMOTION_LIMIT;
  }
  return parsed;
}

async function fetchDailyPromotionCount(db: D1Database): Promise<number> {
  const result = await db
    .prepare(
      "SELECT COUNT(*) AS count FROM candidates WHERE date(created_at) = date('now')",
    )
    .first<{ count: number }>();
  return result?.count ?? 0;
}

type CandidateFingerprintRow = {
  fingerprint: string | null;
  lead_id: string | null;
  created_at: string | null;
};

async function fetchCandidateFingerprintMap(
  db: D1Database,
  fingerprints: string[],
): Promise<Map<string, string | null>> {
  if (fingerprints.length === 0) return new Map();
  const placeholders = buildPlaceholders(fingerprints.length);
  const result = await db
    .prepare(
      `SELECT fingerprint, lead_id, created_at FROM candidates WHERE fingerprint IN (${placeholders}) ORDER BY created_at DESC`,
    )
    .bind(...fingerprints)
    .all<CandidateFingerprintRow>();
  const map = new Map<string, string | null>();
  for (const row of result.results ?? []) {
    if (!row.fingerprint) continue;
    if (!map.has(row.fingerprint)) {
      map.set(row.fingerprint, row.lead_id ?? null);
    }
  }
  return map;
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

  const { leadIds, promotionLimit, requestedBy, inputVersion } = parsed.data;
  const db = getDb(env);
  const leads = await fetchLeadsByIds(db, leadIds);
  const leadMap = new Map(leads.map((lead) => [lead.id, lead]));
  const missing = leadIds.filter((id) => !leadMap.has(id));
  if (missing.length > 0) {
    return errorResponse(404, "leads_not_found", { missing });
  }

  const scored = leads.map((lead) => {
    const fingerprint = fingerprintLead({ title: lead.title, url: lead.url });
    return {
      lead,
      fingerprint,
      triage: triageLead({
        id: lead.id,
        source: lead.source,
        sourceContext: lead.source_context,
        title: lead.title,
        url: lead.url,
        priceBand: lead.price_band,
      }),
    };
  });

  const fingerprintGroups = new Map<
    string,
    { leadId: string; score: number }[]
  >();
  for (const item of scored) {
    if (!item.fingerprint) continue;
    const group = fingerprintGroups.get(item.fingerprint) ?? [];
    group.push({ leadId: item.lead.id, score: item.triage.score });
    fingerprintGroups.set(item.fingerprint, group);
  }

  const primaryLeadIds = new Set<string>();
  const primaryLeadByFingerprint = new Map<string, string>();
  for (const [fingerprint, group] of fingerprintGroups.entries()) {
    if (group.length < 2) continue;
    group.sort((a, b) => b.score - a.score);
    const [first] = group;
    if (!first) continue;
    primaryLeadIds.add(first.leadId);
    primaryLeadByFingerprint.set(fingerprint, first.leadId);
  }

  const fingerprints = Array.from(
    new Set(
      scored
        .map((item) => item.fingerprint)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const candidateFingerprintMap = await fetchCandidateFingerprintMap(
    db,
    fingerprints,
  );
  const existingFingerprints = new Set(candidateFingerprintMap.keys());
  const existingCooldowns = await fetchCooldownsByFingerprints(db, fingerprints);

  const dedupeHoldIds = new Set<string>();
  for (const item of scored) {
    if (!item.fingerprint) continue;
    const group = fingerprintGroups.get(item.fingerprint);
    const isBatchDuplicate =
      group !== undefined &&
      group.length > 1 &&
      !primaryLeadIds.has(item.lead.id);
    const isExistingDuplicate = existingFingerprints.has(item.fingerprint);
    if (isBatchDuplicate || isExistingDuplicate) {
      dedupeHoldIds.add(item.lead.id);
    }
  }

  const promotable = scored
    .filter(
      (item) =>
        item.triage.action === "PROMOTE_TO_CANDIDATE" &&
        !dedupeHoldIds.has(item.lead.id),
    )
    .sort((a, b) => b.triage.score - a.triage.score);
  const dailyPromotionLimit = parseDailyPromotionLimit(env);
  const dailyPromotionsUsed = await fetchDailyPromotionCount(db);
  const dailyPromotionRemaining = Math.max(
    0,
    dailyPromotionLimit - dailyPromotionsUsed,
  );
  const promotionCap = Math.min(
    promotionLimit ?? promotable.length,
    promotable.length,
    dailyPromotionRemaining,
  );
  const promotedIds = new Set(
    promotable.slice(0, promotionCap).map((item) => item.lead.id),
  );

  const now = nowIso();
  const statements: D1PreparedStatement[] = [];
  const results = scored.map((item) => {
    const { lead, triage, fingerprint } = item;
    let action = triage.action;
    const isDuplicate = dedupeHoldIds.has(lead.id);
    const existingCooldown = fingerprint
      ? existingCooldowns.get(fingerprint) ?? null
      : null;
    const cooldownActive = existingCooldown
      ? isCooldownActive(existingCooldown.severity, existingCooldown.recheck_after)
      : false;
    const isExistingDuplicate = Boolean(
      fingerprint && existingFingerprints.has(fingerprint),
    );
    const batchGroup = fingerprint ? fingerprintGroups.get(fingerprint) : null;
    const isBatchDuplicate =
      Boolean(batchGroup && batchGroup.length > 1) &&
      !primaryLeadIds.has(lead.id);
    const primaryBatchLeadId = fingerprint
      ? primaryLeadByFingerprint.get(fingerprint) ?? null
      : null;
    const candidateLeadId = fingerprint
      ? candidateFingerprintMap.get(fingerprint) ?? null
      : null;
    const duplicateOf =
      candidateLeadId && candidateLeadId !== lead.id
        ? candidateLeadId
        : isBatchDuplicate && primaryBatchLeadId && primaryBatchLeadId !== lead.id
          ? primaryBatchLeadId
          : null;

    const dedupeReasons: string[] = [];
    if (isExistingDuplicate) dedupeReasons.push("duplicate_existing");
    if (isBatchDuplicate) dedupeReasons.push("duplicate_batch");
    const cooldownReasons: string[] = [];
    if (cooldownActive) {
      cooldownReasons.push("cooldown_active");
      if (existingCooldown?.reason_code) {
        cooldownReasons.push(existingCooldown.reason_code);
      }
    }
    let reasons = Array.from(
      new Set([...cooldownReasons, ...dedupeReasons, ...triage.reasons]),
    ).slice(0, 3);

    if (cooldownActive) {
      action = "REJECT_WITH_COOLDOWN";
    }
    if (isDuplicate && action !== "REJECT_WITH_COOLDOWN") {
      action = "HOLD_FOR_MANUAL_REVIEW";
    }

    if (action === "PROMOTE_TO_CANDIDATE" && !promotedIds.has(lead.id)) {
      action = "HOLD_FOR_MANUAL_REVIEW";
      reasons = Array.from(
        new Set([...reasons, "promotion_budget"]),
      ).slice(0, 3);
    }

    const cooldownPlan =
      action === "REJECT_WITH_COOLDOWN" && !cooldownActive
        ? buildCooldownPlan(triage)
        : null;
    if (cooldownPlan && !reasons.includes(cooldownPlan.reasonCode)) {
      reasons = Array.from(
        new Set([cooldownPlan.reasonCode, ...reasons]),
      ).slice(0, 3);
    }
    const cooldownSeverity =
      cooldownPlan?.severity ?? existingCooldown?.severity ?? "short_cooldown";
    const status =
      action === "PROMOTE_TO_CANDIDATE"
        ? "PROMOTED"
        : action === "HOLD_FOR_MANUAL_REVIEW"
          ? "ON_HOLD"
          : cooldownSeverity === "permanent"
            ? "REJECTED"
            : "ON_HOLD";

    const candidateId =
      action === "PROMOTE_TO_CANDIDATE" ? crypto.randomUUID() : null;

    statements.push(
      db
        .prepare(
          "UPDATE leads SET triage_score = ?, triage_band = ?, triage_reasons = ?, status = ?, fingerprint = ?, duplicate_of = ?, updated_at = ? WHERE id = ?",
        )
        .bind(
          triage.score,
          triage.band,
          JSON.stringify(reasons),
          status,
          fingerprint ?? null,
          duplicateOf,
          now,
          lead.id,
        ),
    );

    if (candidateId) {
      statements.push(
        db
          .prepare(
            "INSERT INTO candidates (id, lead_id, fingerprint, stage_status, decision, decision_reason, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          )
          .bind(
            candidateId,
            lead.id,
            fingerprint ?? null,
            "P_DONE",
            null,
            null,
            now,
            now,
          ),
      );
    }

    if (action === "REJECT_WITH_COOLDOWN" && cooldownPlan && fingerprint) {
      statements.push(
        db
          .prepare(
            "INSERT INTO cooldowns (id, fingerprint, reason_code, severity, recheck_after, what_would_change, snapshot_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          )
          .bind(
            crypto.randomUUID(),
            fingerprint,
            cooldownPlan.reasonCode,
            cooldownPlan.severity,
            cooldownPlan.recheckAfter,
            cooldownPlan.whatWouldChange,
            JSON.stringify({
              leadId: lead.id,
              score: triage.score,
              band: triage.band,
              reasons: triage.reasons,
              action,
            }),
            now,
          ),
      );
    }

    const stageRunInput = {
      leadId: lead.id,
      requestedBy,
      inputVersion: inputVersion ?? "v1",
    };
    const stageRunOutput = {
      score: triage.score,
      band: triage.band,
      reasons,
      action,
    };

    statements.push(
      db
        .prepare(
          "INSERT INTO stage_runs (id, candidate_id, stage, status, input_version, input_json, output_json, error_json, started_at, finished_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          crypto.randomUUID(),
          candidateId,
          "P",
          "succeeded",
          inputVersion ?? "v1",
          JSON.stringify(stageRunInput),
          JSON.stringify(stageRunOutput),
          null,
          now,
          now,
          now,
        ),
    );

    return {
      leadId: lead.id,
      score: triage.score,
      band: triage.band,
      reasons,
      action,
      candidateId,
    };
  });

  if (statements.length > 0) {
    await db.batch(statements);
  }

  return jsonResponse({
    ok: true,
    processed: results.length,
    promoted: promotedIds.size,
    promotionCap,
    dailyPromotionLimit,
    dailyPromotionsUsed,
    dailyPromotionRemaining,
    results,
  });
};

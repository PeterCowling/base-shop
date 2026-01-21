/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/stages/m/queue.ts

import { z } from "zod";

import { isCooldownActive } from "@/lib/pipeline/cooldown";
import type { StageMJobInput } from "@/lib/pipeline/runner-contract";

import {
  fetchCandidateById,
  fetchLatestCooldownByFingerprint,
  getDb,
  nowIso,
  type PipelineEnv,
} from "../../_lib/db";
import { errorResponse, jsonResponse } from "../../_lib/response";
import type {
  D1Database,
  D1PreparedStatement,
  PipelineEventContext,
} from "../../_lib/types";

const DEFAULT_AMAZON_DAILY_LIMIT = 20;
const DEFAULT_TAOBAO_DAILY_LIMIT = 10;
const CAPTURE_PROFILE_PATTERN = /^[a-zA-Z0-9._-]+$/;

const bodySchema = z
  .object({
    candidateId: z.string().min(1),
    kind: z.enum(["amazon_search", "amazon_listing", "taobao_listing"]),
    captureMode: z.enum(["queue", "runner"]).optional(),
    captureProfile: z.string().min(1).optional(),
    marketplace: z.string().min(1).optional(),
    query: z.string().min(1).optional(),
    url: z.string().url().optional(),
    maxResults: z.number().int().min(1).max(100).optional(),
    requestedBy: z.string().min(1).optional(),
    inputVersion: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "amazon_search" && !data.query) {
      ctx.addIssue({ code: "custom", path: ["query"], message: "required" });
    }
    if (
      (data.kind === "amazon_listing" || data.kind === "taobao_listing") &&
      !data.url
    ) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "required" });
    }
    if (
      (data.kind === "amazon_search" || data.kind === "amazon_listing") &&
      !data.marketplace
    ) {
      ctx.addIssue({ code: "custom", path: ["marketplace"], message: "required" });
    }
  });

function parseDailyLimit(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function resolveStageMBudget(
  kind: StageMJobInput["kind"],
  env: PipelineEnv,
): { site: "amazon" | "taobao"; dailyLimit: number } {
  const site = kind.startsWith("amazon") ? "amazon" : "taobao";
  const dailyLimit =
    site === "amazon"
      ? parseDailyLimit(
          env.PIPELINE_STAGE_M_AMAZON_DAILY_LIMIT,
          DEFAULT_AMAZON_DAILY_LIMIT,
        )
      : parseDailyLimit(
          env.PIPELINE_STAGE_M_TAOBAO_DAILY_LIMIT,
          DEFAULT_TAOBAO_DAILY_LIMIT,
        );
  return { site, dailyLimit };
}

function resolveCaptureMode(
  kind: StageMJobInput["kind"],
  env: PipelineEnv,
  requested?: "queue" | "runner",
): "queue" | "runner" {
  if (requested) return requested;
  const envOverride = kind.startsWith("amazon")
    ? env.PIPELINE_STAGE_M_CAPTURE_MODE_AMAZON
    : env.PIPELINE_STAGE_M_CAPTURE_MODE_TAOBAO;
  if (envOverride === "runner" || envOverride === "queue") {
    return envOverride;
  }
  return "queue";
}

function parseCaptureProfileAllowlist(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function resolveCaptureProfileAllowlist(
  kind: StageMJobInput["kind"],
  env: PipelineEnv,
): string[] {
  return kind.startsWith("amazon")
    ? parseCaptureProfileAllowlist(env.PIPELINE_STAGE_M_CAPTURE_PROFILES_AMAZON)
    : parseCaptureProfileAllowlist(env.PIPELINE_STAGE_M_CAPTURE_PROFILES_TAOBAO);
}

async function logCaptureProfileViolation(
  db: D1Database,
  candidateId: string,
  details: Record<string, unknown>,
): Promise<void> {
  try {
    await db
      .prepare(
        "INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(
        crypto.randomUUID(),
        "candidate",
        candidateId,
        "stage_m.capture_profile_violation",
        JSON.stringify(details),
        nowIso(),
      )
      .run();
  } catch (error) {
    console.warn("Stage M capture profile audit failed.", error);
  }
}

async function fetchStageMDailyCount(
  db: D1Database,
  site: "amazon" | "taobao",
): Promise<number> {
  const likePattern =
    site === "amazon" ? '%"kind":"amazon_%' : '%"kind":"taobao_%';
  const result = await db
    .prepare(
      "SELECT COUNT(*) AS count FROM stage_runs WHERE stage = ? AND date(created_at) = date('now') AND input_json LIKE ?",
    )
    .bind("M", likePattern)
    .first<{ count: number }>();
  return result?.count ?? 0;
}

type StageMQueueMessage = {
  jobId: string;
  candidateId: string;
  stage: "M";
  kind: StageMJobInput["kind"];
  input: StageMJobInput;
  enqueuedAt: string;
  source: "api";
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

  const {
    candidateId,
    kind,
    captureMode,
    captureProfile,
    marketplace,
    query,
    url,
    maxResults,
    requestedBy,
    inputVersion,
  } = parsed.data;

  const db = getDb(env);
  const candidate = await fetchCandidateById(db, candidateId);
  if (!candidate) {
    return errorResponse(404, "candidate_not_found", { candidateId });
  }
  if (candidate.fingerprint) {
    const cooldown = await fetchLatestCooldownByFingerprint(
      db,
      candidate.fingerprint,
    );
    if (
      cooldown &&
      isCooldownActive(cooldown.severity, cooldown.recheck_after)
    ) {
      return errorResponse(409, "cooldown_active", {
        fingerprint: cooldown.fingerprint,
        reasonCode: cooldown.reason_code,
        severity: cooldown.severity,
        recheckAfter: cooldown.recheck_after,
        whatWouldChange: cooldown.what_would_change,
      });
    }
  }

  const trimmedCaptureProfile = captureProfile?.trim() ?? "";
  const effectiveCaptureMode = resolveCaptureMode(kind, env, captureMode);
  if (effectiveCaptureMode === "runner") {
    if (!trimmedCaptureProfile) {
      await logCaptureProfileViolation(db, candidateId, {
        reason: "capture_profile_required",
        kind,
        captureMode: effectiveCaptureMode,
        captureProfile: null,
      });
      return errorResponse(422, "capture_profile_required", {
        reasonCode: "capture_profile_required",
      });
    }
    if (!CAPTURE_PROFILE_PATTERN.test(trimmedCaptureProfile)) {
      await logCaptureProfileViolation(db, candidateId, {
        reason: "capture_profile_invalid",
        kind,
        captureMode: effectiveCaptureMode,
        captureProfile: trimmedCaptureProfile,
      });
      return errorResponse(422, "capture_profile_invalid", {
        reasonCode: "capture_profile_invalid",
      });
    }
    const allowlist = resolveCaptureProfileAllowlist(kind, env);
    if (allowlist.length > 0 && !allowlist.includes(trimmedCaptureProfile)) {
      await logCaptureProfileViolation(db, candidateId, {
        reason: "capture_profile_not_allowed",
        kind,
        captureMode: effectiveCaptureMode,
        captureProfile: trimmedCaptureProfile,
        allowlist,
      });
      return errorResponse(403, "capture_profile_not_allowed", {
        reasonCode: "capture_profile_not_allowed",
      });
    }
  }

  const { site, dailyLimit } = resolveStageMBudget(kind, env);
  const dailyUsed = await fetchStageMDailyCount(db, site);
  const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);
  if (dailyRemaining <= 0) {
    return errorResponse(429, "budget_exceeded", {
      reasonCode: "budget_exceeded",
      site,
      dailyLimit,
      dailyUsed,
      dailyRemaining,
    });
  }

  const jobId = crypto.randomUUID();
  const now = nowIso();
  const jobInput: StageMJobInput = {
    kind,
    maxResults: maxResults ?? 20,
    ...(marketplace ? { marketplace } : {}),
    ...(query ? { query } : {}),
    ...(url ? { url } : {}),
    ...(requestedBy ? { notes: requestedBy } : {}),
    ...(trimmedCaptureProfile ? { captureProfile: trimmedCaptureProfile } : {}),
    ...(effectiveCaptureMode ? { captureMode: effectiveCaptureMode } : {}),
  };

  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        "INSERT INTO stage_runs (id, candidate_id, stage, status, input_version, input_json, output_json, error_json, started_at, finished_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        jobId,
        candidateId,
        "M",
        "queued",
        inputVersion ?? "v1",
        JSON.stringify(jobInput),
        null,
        null,
        null,
        null,
        now,
      ),
    db
      .prepare("UPDATE candidates SET stage_status = ?, updated_at = ? WHERE id = ?")
      .bind("M_QUEUED", now, candidateId),
  ];

  await db.batch(statements);

  if (env.PIPELINE_QUEUE && effectiveCaptureMode === "queue") {
    try {
      const message: StageMQueueMessage = {
        jobId,
        candidateId,
        stage: "M",
        kind,
        input: jobInput,
        enqueuedAt: now,
        source: "api",
      };
      await env.PIPELINE_QUEUE.send(message);
    } catch (error) {
      console.warn("Stage M queue send failed.", error);
    }
  }

  return jsonResponse({
    ok: true,
    jobId,
    candidateId,
    status: "queued",
    captureMode: effectiveCaptureMode,
  });
};

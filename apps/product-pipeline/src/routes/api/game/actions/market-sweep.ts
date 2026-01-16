/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/game/actions/market-sweep.ts

import type { PipelineEventContext } from "../../_lib/types";
import { z } from "zod";
import { getDb, type PipelineEnv } from "../../_lib/db";
import { jsonResponse } from "../../_lib/response";
import { onRequestPost as queueStageM } from "../../stages/m/queue";

type StageMKind = "amazon_search" | "amazon_listing" | "taobao_listing";

const bodySchema = z
  .object({
    candidateCount: z.number().int().min(1).max(50).optional(),
    kind: z.enum(["amazon_search", "amazon_listing", "taobao_listing"]),
    captureMode: z.enum(["runner", "queue"]).optional(),
    captureProfile: z.string().min(1).optional(),
    marketplace: z.string().min(1).optional(),
    maxResults: z.number().int().min(1).max(100).optional(),
  })
  .optional();

type CandidateSeedRow = {
  candidate_id: string;
  lead_title: string | null;
  lead_url: string | null;
};

function queryFromLeadTitle(value: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  if (trimmed.length <= 120) return trimmed;
  return trimmed.slice(0, 120).trim();
}

function urlFromLead(value: string | null): string | null {
  const raw = value?.trim() ?? "";
  if (!raw) return null;
  try {
    // Validate against zod's .url() expectations.
    new URL(raw);
    return raw;
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
    return jsonResponse(
      {
        ok: false,
        mission: "market-sweep",
        summary: "Invalid mission payload",
        details: parsed.error.flatten(),
      },
      400,
    );
  }

  const candidateCount = parsed.data?.candidateCount ?? 8;
  const kind: StageMKind = parsed.data?.kind ?? "amazon_search";
  const captureMode = parsed.data?.captureMode;
  const captureProfile = parsed.data?.captureProfile;
  const marketplace = parsed.data?.marketplace;
  const maxResults = parsed.data?.maxResults;

  const db = getDb(env);
  const candidatesResult = await db
    .prepare(
      `
      SELECT
        candidates.id AS candidate_id,
        leads.title AS lead_title,
        leads.url AS lead_url
      FROM candidates
      LEFT JOIN leads ON leads.id = candidates.lead_id
      WHERE candidates.stage_status = ?
      ORDER BY candidates.created_at DESC
      LIMIT ?
    `,
    )
    .bind("P_DONE", candidateCount)
    .all<CandidateSeedRow>();

  const seeds = candidatesResult.results ?? [];
  if (seeds.length === 0) {
    return jsonResponse({
      ok: true,
      mission: "market-sweep",
      summary: "No candidates ready for market sweep",
      details: { candidateCount, kind },
    });
  }

  const queued: Array<{ candidateId: string; jobId: string; captureMode?: string }> =
    [];
  const failures: Array<{
    candidateId: string;
    status: number;
    error?: string;
    details?: unknown;
  }> = [];
  const skipped: Array<{ candidateId: string; reason: string }> = [];

  for (const seed of seeds) {
    const candidateId = seed.candidate_id;
    const query = kind === "amazon_search" ? queryFromLeadTitle(seed.lead_title) : null;
    const url = kind !== "amazon_search" ? urlFromLead(seed.lead_url) : null;

    if (kind === "amazon_search" && !query) {
      skipped.push({ candidateId, reason: "missing_query" });
      continue;
    }
    if (kind !== "amazon_search" && !url) {
      skipped.push({ candidateId, reason: "missing_url" });
      continue;
    }

    const stageRequest = new Request(new URL("/api/stages/m/queue", request.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId,
        kind,
        ...(captureMode ? { captureMode } : {}),
        ...(captureProfile ? { captureProfile } : {}),
        ...(marketplace ? { marketplace } : {}),
        ...(query ? { query } : {}),
        ...(url ? { url } : {}),
        ...(maxResults ? { maxResults } : {}),
        requestedBy: "mission-control",
      }),
    });

    const stageResponse = await queueStageM({
      request: stageRequest,
      env,
      params: {},
    });
    const payload = (await stageResponse.json().catch(() => null)) as
      | {
          ok?: boolean;
          jobId?: string;
          candidateId?: string;
          status?: string;
          captureMode?: string;
          error?: string;
          details?: unknown;
        }
      | null;

    if (stageResponse.ok && payload?.ok === true && payload.jobId) {
      const entry: { candidateId: string; jobId: string; captureMode?: string } =
        { candidateId, jobId: payload.jobId };
      if (payload.captureMode) {
        entry.captureMode = payload.captureMode;
      }
      queued.push(entry);
      continue;
    }

    const failure: {
      candidateId: string;
      status: number;
      error?: string;
      details?: unknown;
    } = {
      candidateId,
      status: stageResponse.status,
      details: payload?.details ?? payload,
    };
    if (payload?.error) {
      failure.error = payload.error;
    }
    failures.push(failure);

    if (stageResponse.status === 429) {
      break;
    }
  }

  const ok = queued.length > 0 || failures.length === 0;
  const summary = `Stage M queued ${queued.length}/${seeds.length} candidates (${kind})`;

  return jsonResponse(
    {
      ok,
      mission: "market-sweep",
      summary,
      details: {
        kind,
        requested: {
          candidateCount,
          captureMode,
          captureProfile,
          marketplace,
          maxResults,
        },
        attempted: seeds.map((seed) => seed.candidate_id),
        queued,
        skipped,
        failures,
      },
    },
    ok ? 200 : 500,
  );
};

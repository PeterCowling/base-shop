/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/leads/index.ts

import type { PipelineEventContext } from "../_lib/types";
import { z } from "zod";
import { fingerprintLead } from "@/lib/pipeline/fingerprint";
import { getDb, nowIso, type LeadRow, type PipelineEnv } from "../_lib/db";
import { errorResponse, jsonResponse } from "../_lib/response";

const createSchema = z
  .object({
    source: z.string().min(1),
    sourceContext: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    url: z.string().url().optional(),
    priceBand: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.title && !data.url) {
      ctx.addIssue({ code: "custom", path: ["title"], message: "required" });
    }
  });

function parseIntParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseReasons(value: string | null): string[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((item) => String(item));
  } catch {
    return null;
  }
}

export const onRequestGet = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const db = getDb(env);
  const url = new URL(request.url);
  const limit = parseIntParam(url.searchParams.get("limit"), 50, 1, 200);
  const offset = parseIntParam(url.searchParams.get("offset"), 0, 0, 10_000);
  const status = url.searchParams.get("status");
  const source = url.searchParams.get("source");
  const sourceContext = url.searchParams.get("source_context");
  const triageBand = url.searchParams.get("triage_band");
  const search = url.searchParams.get("q");

  const conditions: string[] = [];
  const binds: Array<string | number> = [];

  if (status) {
    conditions.push("status = ?");
    binds.push(status);
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

  let query =
    "SELECT id, source, source_context, title, url, price_band, fingerprint, duplicate_of, status, triage_score, triage_band, triage_reasons, created_at, updated_at FROM leads";
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  binds.push(limit, offset);

  const result = await db.prepare(query).bind(...binds).all<LeadRow>();
  const leads = (result.results ?? []).map((row) => ({
    id: row.id,
    source: row.source,
    sourceContext: row.source_context,
    title: row.title,
    url: row.url,
    priceBand: row.price_band,
    fingerprint: row.fingerprint,
    duplicateOf: row.duplicate_of,
    status: row.status,
    triageScore: row.triage_score,
    triageBand: row.triage_band,
    triageReasons: parseReasons(row.triage_reasons),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return jsonResponse({ ok: true, leads, limit, offset });
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

  const db = getDb(env);
  const now = nowIso();
  const id = crypto.randomUUID();
  const { source, sourceContext, title, url, priceBand } = parsed.data;
  const fingerprint = fingerprintLead({
    title: title ?? null,
    url: url ?? null,
  });

  await db
    .prepare(
      "INSERT INTO leads (id, source, source_context, title, url, price_band, fingerprint, duplicate_of, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      id,
      source,
      sourceContext ?? null,
      title ?? null,
      url ?? null,
      priceBand ?? null,
      fingerprint,
      null,
      "NEW",
      now,
      now,
    )
    .run();

  return jsonResponse(
    {
      ok: true,
      lead: {
        id,
        source,
        sourceContext: sourceContext ?? null,
        title: title ?? null,
        url: url ?? null,
        priceBand: priceBand ?? null,
        fingerprint,
        duplicateOf: null,
        status: "NEW",
        triageScore: null,
        triageBand: null,
        triageReasons: null,
        createdAt: now,
        updatedAt: now,
      },
    },
    201,
  );
};

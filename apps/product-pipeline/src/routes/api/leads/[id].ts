/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/leads/[id].ts

import { z } from "zod";

import { fingerprintLead } from "@/lib/pipeline/fingerprint";

import {
  type CandidateRow,
  getDb,
  type LeadRow,
  nowIso,
  type PipelineEnv,
} from "../_lib/db";
import { errorResponse, jsonResponse } from "../_lib/response";
import type { PipelineEventContext } from "../_lib/types";

const updateSchema = z
  .object({
    source: z.string().min(1).nullable().optional(),
    sourceContext: z.string().min(1).nullable().optional(),
    title: z.string().min(1).nullable().optional(),
    url: z.string().url().nullable().optional(),
    priceBand: z.string().min(1).nullable().optional(),
    status: z.string().min(1).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const hasUpdate = Object.values(data).some((value) => value !== undefined);
    if (!hasUpdate) {
      ctx.addIssue({ code: "custom", path: [], message: "empty_update" });
    }
  });

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

function mapLead(row: LeadRow) {
  return {
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
  };
}

export const onRequestGet = async ({
  params,
  env,
}: PipelineEventContext<PipelineEnv, { id: string }>) => {
  const leadId = String(params["id"]);
  const db = getDb(env);

  const lead = await db
    .prepare(
      "SELECT id, source, source_context, title, url, price_band, fingerprint, duplicate_of, status, triage_score, triage_band, triage_reasons, created_at, updated_at FROM leads WHERE id = ?",
    )
    .bind(leadId)
    .first<LeadRow>();

  if (!lead) {
    return errorResponse(404, "lead_not_found", { leadId });
  }

  const candidates = await db
    .prepare(
      "SELECT id, lead_id, fingerprint, stage_status, decision, decision_reason, created_at, updated_at FROM candidates WHERE lead_id = ?",
    )
    .bind(leadId)
    .all<CandidateRow>();

  return jsonResponse({
    ok: true,
    lead: mapLead(lead),
    candidates: (candidates.results ?? []).map((row) => ({
      id: row.id,
      leadId: row.lead_id,
      stageStatus: row.stage_status,
    })),
  });
};

export const onRequestPatch = async ({
  params,
  request,
  env,
}: PipelineEventContext<PipelineEnv, { id: string }>) => {
  const leadId = String(params["id"]);
  const raw = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, "invalid_body", {
      issues: parsed.error.flatten(),
    });
  }

  const db = getDb(env);
  const update = parsed.data;
  const fields: string[] = [];
  const binds: Array<string | null> = [];
  let fingerprint: string | null | undefined;

  if (update.title !== undefined || update.url !== undefined) {
    const existing = await db
      .prepare("SELECT title, url FROM leads WHERE id = ?")
      .bind(leadId)
      .first<LeadRow>();
    if (!existing) {
      return errorResponse(404, "lead_not_found", { leadId });
    }
    const nextTitle = update.title !== undefined ? update.title : existing.title;
    const nextUrl = update.url !== undefined ? update.url : existing.url;
    fingerprint = fingerprintLead({ title: nextTitle, url: nextUrl });
  }

  if (update.source !== undefined) {
    fields.push("source = ?");
    binds.push(update.source);
  }
  if (update.sourceContext !== undefined) {
    fields.push("source_context = ?");
    binds.push(update.sourceContext);
  }
  if (update.title !== undefined) {
    fields.push("title = ?");
    binds.push(update.title);
  }
  if (update.url !== undefined) {
    fields.push("url = ?");
    binds.push(update.url);
  }
  if (update.priceBand !== undefined) {
    fields.push("price_band = ?");
    binds.push(update.priceBand);
  }
  if (update.status !== undefined) {
    fields.push("status = ?");
    binds.push(update.status);
  }
  if (fingerprint !== undefined) {
    fields.push("fingerprint = ?");
    binds.push(fingerprint);
  }

  const now = nowIso();
  const query = `UPDATE leads SET ${fields.join(", ")}, updated_at = ? WHERE id = ?`;
  binds.push(now, leadId);

  const result = await db.prepare(query).bind(...binds).run();
  if ((result.meta?.changes ?? 0) === 0) {
    return errorResponse(404, "lead_not_found", { leadId });
  }

  const lead = await db
    .prepare(
      "SELECT id, source, source_context, title, url, price_band, fingerprint, duplicate_of, status, triage_score, triage_band, triage_reasons, created_at, updated_at FROM leads WHERE id = ?",
    )
    .bind(leadId)
    .first<LeadRow>();

  if (!lead) {
    return errorResponse(404, "lead_not_found", { leadId });
  }

  return jsonResponse({ ok: true, lead: mapLead(lead) });
};

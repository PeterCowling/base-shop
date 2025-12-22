/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/suppliers/[id]/terms.ts

import type { PipelineEventContext } from "../../_lib/types";
import { z } from "zod";
import { getDb, nowIso, type PipelineEnv } from "../../_lib/db";
import { errorResponse, jsonResponse } from "../../_lib/response";

const createSchema = z
  .object({
    incoterms: z.string().min(1).optional(),
    paymentTerms: z.string().min(1).optional(),
    moq: z.number().int().positive().optional(),
    currency: z.string().min(1).optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasValue = Object.values(data).some(
      (value) => value !== undefined && value !== "",
    );
    if (!hasValue) {
      ctx.addIssue({ code: "custom", path: [], message: "empty_terms" });
    }
  });

type TermRow = {
  id: string;
  supplier_id: string;
  incoterms: string | null;
  payment_terms: string | null;
  moq: number | null;
  currency: string | null;
  notes: string | null;
  created_at: string | null;
};

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

export const onRequestGet = async ({
  request,
  params,
  env,
}: PipelineEventContext<PipelineEnv, { id: string }>) => {
  const supplierId = String(params["id"]);
  const db = getDb(env);

  const supplier = await db
    .prepare("SELECT id FROM suppliers WHERE id = ?")
    .bind(supplierId)
    .first<{ id: string }>();
  if (!supplier) {
    return errorResponse(404, "supplier_not_found", { supplierId });
  }

  const url = new URL(request.url);
  const limit = parseIntParam(url.searchParams.get("limit"), 10, 1, 100);
  const offset = parseIntParam(url.searchParams.get("offset"), 0, 0, 10_000);

  const result = await db
    .prepare(
      "SELECT id, supplier_id, incoterms, payment_terms, moq, currency, notes, created_at FROM supplier_terms WHERE supplier_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
    )
    .bind(supplierId, limit, offset)
    .all<TermRow>();

  const terms = (result.results ?? []).map((row) => ({
    id: row.id,
    supplierId: row.supplier_id,
    incoterms: row.incoterms,
    paymentTerms: row.payment_terms,
    moq: row.moq,
    currency: row.currency,
    notes: row.notes,
    createdAt: row.created_at,
  }));

  return jsonResponse({ ok: true, supplierId, terms, limit, offset });
};

export const onRequestPost = async ({
  request,
  params,
  env,
}: PipelineEventContext<PipelineEnv, { id: string }>) => {
  const supplierId = String(params["id"]);
  const raw = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, "invalid_body", {
      issues: parsed.error.flatten(),
    });
  }

  const db = getDb(env);
  const supplier = await db
    .prepare("SELECT id FROM suppliers WHERE id = ?")
    .bind(supplierId)
    .first<{ id: string }>();
  if (!supplier) {
    return errorResponse(404, "supplier_not_found", { supplierId });
  }

  const id = crypto.randomUUID();
  const now = nowIso();
  const { incoterms, paymentTerms, moq, currency, notes } = parsed.data;

  await db.batch([
    db
      .prepare(
        "INSERT INTO supplier_terms (id, supplier_id, incoterms, payment_terms, moq, currency, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        id,
        supplierId,
        incoterms ?? null,
        paymentTerms ?? null,
        moq ?? null,
        currency ?? null,
        notes ?? null,
        now,
      ),
    db
      .prepare("UPDATE suppliers SET updated_at = ? WHERE id = ?")
      .bind(now, supplierId),
  ]);

  return jsonResponse(
    {
      ok: true,
      term: {
        id,
        supplierId,
        incoterms: incoterms ?? null,
        paymentTerms: paymentTerms ?? null,
        moq: moq ?? null,
        currency: currency ?? null,
        notes: notes ?? null,
        createdAt: now,
      },
    },
    201,
  );
};

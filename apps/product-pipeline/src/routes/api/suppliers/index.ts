/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/suppliers/index.ts

import { z } from "zod";

import { getDb, nowIso, type PipelineEnv } from "../_lib/db";
import { errorResponse, jsonResponse } from "../_lib/response";
import type { PipelineEventContext } from "../_lib/types";

const createSchema = z.object({
  name: z.string().min(1),
  status: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  contact: z.record(z.string()).optional(),
});

type SupplierListRow = {
  id: string;
  name: string;
  status: string | null;
  country: string | null;
  contact_json: string | null;
  term_id: string | null;
  term_incoterms: string | null;
  term_payment_terms: string | null;
  term_moq: number | null;
  term_currency: string | null;
  term_notes: string | null;
  term_created_at: string | null;
  term_count: number | null;
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

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export const onRequestGet = async ({
  request,
  env,
}: PipelineEventContext<PipelineEnv>) => {
  const url = new URL(request.url);
  const limit = parseIntParam(url.searchParams.get("limit"), 50, 1, 200);
  const offset = parseIntParam(url.searchParams.get("offset"), 0, 0, 10_000);

  const db = getDb(env);
  const result = await db
    .prepare(
      `
      SELECT
        suppliers.id,
        suppliers.name,
        suppliers.status,
        suppliers.country,
        suppliers.contact_json,
        latest_terms.id as term_id,
        latest_terms.incoterms as term_incoterms,
        latest_terms.payment_terms as term_payment_terms,
        latest_terms.moq as term_moq,
        latest_terms.currency as term_currency,
        latest_terms.notes as term_notes,
        latest_terms.created_at as term_created_at,
        term_counts.term_count as term_count
      FROM suppliers
      LEFT JOIN (
        SELECT st1.*
        FROM supplier_terms st1
        INNER JOIN (
          SELECT supplier_id, MAX(created_at) AS latest_created_at
          FROM supplier_terms
          GROUP BY supplier_id
        ) latest
        ON st1.supplier_id = latest.supplier_id
        AND st1.created_at = latest.latest_created_at
      ) AS latest_terms
      ON latest_terms.supplier_id = suppliers.id
      LEFT JOIN (
        SELECT supplier_id, COUNT(*) as term_count
        FROM supplier_terms
        GROUP BY supplier_id
      ) AS term_counts
      ON term_counts.supplier_id = suppliers.id
      ORDER BY suppliers.created_at DESC
      LIMIT ? OFFSET ?
    `,
    )
    .bind(limit, offset)
    .all<SupplierListRow>();

  const suppliers = (result.results ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    country: row.country,
    contact: safeJsonParse<Record<string, string>>(row.contact_json),
    termCount: row.term_count ?? 0,
    latestTerm: row.term_id
      ? {
          id: row.term_id,
          incoterms: row.term_incoterms,
          paymentTerms: row.term_payment_terms,
          moq: row.term_moq,
          currency: row.term_currency,
          notes: row.term_notes,
          createdAt: row.term_created_at,
        }
      : null,
  }));

  return jsonResponse({ ok: true, suppliers, limit, offset });
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

  const { name, status, country, contact } = parsed.data;
  const db = getDb(env);
  const id = crypto.randomUUID();
  const now = nowIso();
  const contactJson = contact ? JSON.stringify(contact) : null;

  await db
    .prepare(
      "INSERT INTO suppliers (id, name, status, country, contact_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      id,
      name,
      status ?? null,
      country ?? null,
      contactJson,
      now,
      now,
    )
    .run();

  return jsonResponse(
    {
      ok: true,
      supplier: {
        id,
        name,
        status: status ?? null,
        country: country ?? null,
        contact: contact ?? null,
        createdAt: now,
        updatedAt: now,
      },
    },
    201,
  );
};

/* i18n-exempt file -- PP-1100 internal pipeline API [ttl=2026-06-30] */
// apps/product-pipeline/src/routes/api/logistics/quote-baskets/index.ts

import { z } from "zod";

import { getDb, nowIso, type PipelineEnv } from "../../_lib/db";
import { errorResponse, jsonResponse } from "../../_lib/response";
import type { PipelineEventContext } from "../../_lib/types";

type QuoteBasketRow = {
  id: string;
  name: string;
  profile_type: string | null;
  origin: string | null;
  destination: string | null;
  destination_type: string | null;
  incoterm: string | null;
  carton_count: number | null;
  units_per_carton: number | null;
  weight_kg: number | null;
  cbm: number | null;
  dimensions_cm: string | null;
  hazmat_flag: number | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const createSchema = z.object({
  name: z.string().min(1),
  profileType: z.string().min(1).optional(),
  origin: z.string().min(1).optional(),
  destination: z.string().min(1).optional(),
  destinationType: z.string().min(1).optional(),
  incoterm: z.string().min(1).optional(),
  cartonCount: z.number().int().min(0).optional(),
  unitsPerCarton: z.number().int().min(0).optional(),
  weightKg: z.number().min(0).optional(),
  cbm: z.number().min(0).optional(),
  dimensionsCm: z.string().min(1).optional(),
  hazmatFlag: z.boolean().optional(),
  notes: z.string().min(1).optional(),
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
      "SELECT id, name, profile_type, origin, destination, destination_type, incoterm, carton_count, units_per_carton, weight_kg, cbm, dimensions_cm, hazmat_flag, notes, created_at, updated_at FROM quote_basket_profiles ORDER BY created_at DESC LIMIT ? OFFSET ?",
    )
    .bind(limit, offset)
    .all<QuoteBasketRow>();

  const profiles = (result.results ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    profileType: row.profile_type,
    origin: row.origin,
    destination: row.destination,
    destinationType: row.destination_type,
    incoterm: row.incoterm,
    cartonCount: row.carton_count,
    unitsPerCarton: row.units_per_carton,
    weightKg: row.weight_kg,
    cbm: row.cbm,
    dimensionsCm: row.dimensions_cm,
    hazmatFlag: row.hazmat_flag === 1,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return jsonResponse({ ok: true, profiles, limit, offset });
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
    name,
    profileType,
    origin,
    destination,
    destinationType,
    incoterm,
    cartonCount,
    unitsPerCarton,
    weightKg,
    cbm,
    dimensionsCm,
    hazmatFlag,
    notes,
  } = parsed.data;

  const db = getDb(env);
  const id = crypto.randomUUID();
  const now = nowIso();
  const hazmatValue = hazmatFlag ? 1 : 0;

  await db
    .prepare(
      "INSERT INTO quote_basket_profiles (id, name, profile_type, origin, destination, destination_type, incoterm, carton_count, units_per_carton, weight_kg, cbm, dimensions_cm, hazmat_flag, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      id,
      name,
      profileType ?? null,
      origin ?? null,
      destination ?? null,
      destinationType ?? null,
      incoterm ?? null,
      cartonCount ?? null,
      unitsPerCarton ?? null,
      weightKg ?? null,
      cbm ?? null,
      dimensionsCm ?? null,
      hazmatValue,
      notes ?? null,
      now,
      now,
    )
    .run();

  return jsonResponse(
    {
      ok: true,
      profile: {
        id,
        name,
        profileType: profileType ?? null,
        origin: origin ?? null,
        destination: destination ?? null,
        destinationType: destinationType ?? null,
        incoterm: incoterm ?? null,
        cartonCount: cartonCount ?? null,
        unitsPerCarton: unitsPerCarton ?? null,
        weightKg: weightKg ?? null,
        cbm: cbm ?? null,
        dimensionsCm: dimensionsCm ?? null,
        hazmatFlag: hazmatValue === 1,
        notes: notes ?? null,
        createdAt: now,
        updatedAt: now,
      },
    },
    201,
  );
};

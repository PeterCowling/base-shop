/**
 * Business OS ID Allocation
 *
 * D1-backed, collision-proof ID allocator for Business OS entities.
 *
 * Uses the `business_os_metadata` table as an atomic counter store.
 *
 * @packageDocumentation
 */

import "server-only";

import { z } from "zod";

import type { D1Database } from "../d1/types";

const BusinessCodeSchema = z.string().regex(/^[A-Z][A-Z0-9]{1,9}$/);

function pad3(value: number): string {
  return String(value).padStart(3, "0");
}

async function allocateCounter(params: {
  db: D1Database;
  key: string;
}): Promise<number> {
  const { db, key } = params;
  const now = new Date().toISOString();

  const row = await db
    .prepare(
      `
      INSERT INTO business_os_metadata (key, value, updated_at)
      VALUES (?, '1', ?)
      ON CONFLICT(key) DO UPDATE SET
        value = CAST(value AS INTEGER) + 1,
        updated_at = excluded.updated_at
      RETURNING value
    `
    )
    .bind(key, now)
    .first<{ value: string | null }>();

  const parsed = Number.parseInt(row?.value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Failed to allocate counter for key: ${key}`);
  }

  return parsed;
}

export async function allocateNextCardId(
  db: D1Database,
  businessCode: string
): Promise<string> {
  const business = BusinessCodeSchema.parse(businessCode);
  const counter = await allocateCounter({
    db,
    key: `counter:card:${business}`,
  });

  return `${business}-${pad3(counter)}`;
}

export async function allocateNextIdeaId(
  db: D1Database,
  businessCode: string
): Promise<string> {
  const business = BusinessCodeSchema.parse(businessCode);
  const counter = await allocateCounter({
    db,
    key: `counter:idea:${business}`,
  });

  return `${business}-OPP-${pad3(counter)}`;
}

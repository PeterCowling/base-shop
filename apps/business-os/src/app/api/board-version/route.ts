/**
 * Board Version Endpoint
 * BOS-D1-07: Returns version signal for board auto-refresh
 *
 * Version signal = MAX(updated_at) across cards and ideas.
 * When version changes, board should refresh.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/d1.server";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const business = searchParams.get("business");

    // Query cards for max updated_at
    const cardsQuery =
      business && business !== "global"
        ? db
            // i18n-exempt -- BOS-D1-07 SQL query [ttl=2026-03-31]
            .prepare(
              "SELECT MAX(updated_at) as max_updated FROM business_os_cards WHERE business = ?"
            )
            .bind(business)
        : // i18n-exempt -- BOS-D1-07 SQL query [ttl=2026-03-31]
          db.prepare("SELECT MAX(updated_at) as max_updated FROM business_os_cards");

    // Query ideas for max created_at (ideas don't have updated_at)
    const ideasQuery =
      business && business !== "global"
        ? db
            // i18n-exempt -- BOS-D1-07 SQL query [ttl=2026-03-31]
            .prepare(
              "SELECT MAX(created_at) as max_created FROM business_os_ideas WHERE business = ?"
            )
            .bind(business)
        : // i18n-exempt -- BOS-D1-07 SQL query [ttl=2026-03-31]
          db.prepare("SELECT MAX(created_at) as max_created FROM business_os_ideas");

    const [cardsResult, ideasResult] = await Promise.all([
      cardsQuery.first<{ max_updated: string | null }>(),
      ideasQuery.first<{ max_created: string | null }>(),
    ]);

    // Get the latest timestamp from either cards or ideas
    const timestamps = [
      cardsResult?.max_updated,
      ideasResult?.max_created,
    ].filter((t): t is string => t !== null && t !== undefined);

    const version =
      timestamps.length > 0
        ? timestamps.reduce((latest, current) =>
            current > latest ? current : latest
          )
        : new Date().toISOString();

    return NextResponse.json({
      version,
      // i18n-exempt -- BOS-D1-07 field key [ttl=2026-03-31]
      business: business || "global",
    });
  } catch (error) {
    return NextResponse.json(
      {
        // i18n-exempt -- BOS-D1-07 Phase 0 API error message [ttl=2026-03-31]
        error: "Failed to fetch board version",
        // i18n-exempt -- BOS-D1-07 Phase 0 API error message [ttl=2026-03-31]
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

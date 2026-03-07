import { NextResponse } from "next/server";

import { inboxApiErrorResponse } from "@/lib/inbox/api-route-helpers";
import { getInboxDb } from "@/lib/inbox/db.server";

import { requireStaffAuth } from "../../_shared/staff-auth";

type DraftStatsRow = {
  outcome: string;
  count: number;
};

type DraftStatsResponse = {
  totalDrafted: number;
  sentAsGenerated: number;
  sentAfterEdit: number;
  regenerated: number;
  dismissed: number;
  rates: {
    sentAsGeneratedRate: number;
    sentAfterEditRate: number;
    regeneratedRate: number;
    dismissedRate: number;
  };
  days: number | null;
  insufficient: boolean;
};

export async function GET(request: Request) {
  const auth = await requireStaffAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const url = new URL(request.url);
    const daysParam = url.searchParams.get("days");

    let days: number | null = null;
    if (daysParam !== null) {
      const parsed = Number.parseInt(daysParam, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json(
          { success: false, error: "days must be a positive integer" },
          { status: 400 },
        );
      }
      days = parsed;
    }

    const db = getInboxDb();
    const timeFilter = days
      ? `AND te.timestamp >= datetime('now', '-${days} days')`
      : "";

    // Classify each thread's draft outcome based on event sequences.
    // For each thread that has a "drafted" event, determine the terminal outcome:
    // - sent_as_generated: "sent" exists, no "draft_edited" between last "drafted" and "sent"
    // - sent_after_edit: "sent" exists, "draft_edited" between last "drafted" and "sent"
    // - regenerated: another "drafted" event follows the current one (multiple drafts)
    // - dismissed: "dismissed" event exists after "drafted"
    //
    // We use a CTE to find the latest "drafted" event per thread, then check
    // what events followed it.
    const query = `
      WITH latest_drafted AS (
        SELECT
          thread_id,
          MAX(timestamp) AS drafted_at
        FROM thread_events
        WHERE event_type = 'drafted'
        ${timeFilter.replace("te.", "")}
        GROUP BY thread_id
      ),
      thread_outcomes AS (
        SELECT
          ld.thread_id,
          ld.drafted_at,
          CASE
            WHEN EXISTS (
              SELECT 1 FROM thread_events te
              WHERE te.thread_id = ld.thread_id
                AND te.event_type = 'sent'
                AND te.timestamp > ld.drafted_at
            ) AND EXISTS (
              SELECT 1 FROM thread_events te
              WHERE te.thread_id = ld.thread_id
                AND te.event_type = 'draft_edited'
                AND te.timestamp > ld.drafted_at
                AND te.timestamp < (
                  SELECT MIN(te2.timestamp) FROM thread_events te2
                  WHERE te2.thread_id = ld.thread_id
                    AND te2.event_type = 'sent'
                    AND te2.timestamp > ld.drafted_at
                )
            ) THEN 'sent_after_edit'
            WHEN EXISTS (
              SELECT 1 FROM thread_events te
              WHERE te.thread_id = ld.thread_id
                AND te.event_type = 'sent'
                AND te.timestamp > ld.drafted_at
            ) THEN 'sent_as_generated'
            WHEN EXISTS (
              SELECT 1 FROM thread_events te
              WHERE te.thread_id = ld.thread_id
                AND te.event_type = 'dismissed'
                AND te.timestamp > ld.drafted_at
            ) THEN 'dismissed'
            ELSE 'pending'
          END AS outcome
        FROM latest_drafted ld
      )
      SELECT outcome, COUNT(*) AS count
      FROM thread_outcomes
      WHERE outcome != 'pending'
      GROUP BY outcome
    `;

    const result = await db.prepare(query).all<DraftStatsRow>();
    const rows = result.results ?? [];

    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.outcome] = row.count;
    }

    const sentAsGenerated = counts["sent_as_generated"] ?? 0;
    const sentAfterEdit = counts["sent_after_edit"] ?? 0;
    const dismissed = counts["dismissed"] ?? 0;

    // Count total threads that had a drafted event (including pending ones)
    const totalQuery = `
      SELECT COUNT(DISTINCT thread_id) AS total
      FROM thread_events
      WHERE event_type = 'drafted'
      ${timeFilter.replace("te.", "")}
    `;
    const totalResult = await db.prepare(totalQuery).first<{ total: number }>();
    const totalDrafted = totalResult?.total ?? 0;

    // Regenerated = threads with multiple drafted events in the time window
    const regenQuery = `
      SELECT COUNT(*) AS count
      FROM (
        SELECT thread_id
        FROM thread_events
        WHERE event_type = 'drafted'
        ${timeFilter.replace("te.", "")}
        GROUP BY thread_id
        HAVING COUNT(*) > 1
      )
    `;
    const regenResult = await db.prepare(regenQuery).first<{ count: number }>();
    const regenerated = regenResult?.count ?? 0;

    const rate = (n: number) => (totalDrafted > 0 ? Math.round((n / totalDrafted) * 1000) / 10 : 0);

    const data: DraftStatsResponse = {
      totalDrafted,
      sentAsGenerated,
      sentAfterEdit,
      regenerated,
      dismissed,
      rates: {
        sentAsGeneratedRate: rate(sentAsGenerated),
        sentAfterEditRate: rate(sentAfterEdit),
        regeneratedRate: rate(regenerated),
        dismissedRate: rate(dismissed),
      },
      days,
      insufficient: totalDrafted === 0,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return inboxApiErrorResponse(error);
  }
}

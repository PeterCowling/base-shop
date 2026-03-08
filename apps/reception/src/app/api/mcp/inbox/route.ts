import { NextResponse } from "next/server";

import {
  buildThreadSummaryFromRow,
  isThreadVisibleInInbox,
} from "@/lib/inbox/api-models.server";
import { inboxApiErrorResponse } from "@/lib/inbox/api-route-helpers";
import { isPrimeThreadVisibleInInbox, listPrimeInboxThreadSummaries } from "@/lib/inbox/prime-review.server";
import {
  type InboxThreadStatus,
  inboxThreadStatuses,
  listThreadsWithLatestDraft,
} from "@/lib/inbox/repositories.server";

import { requireStaffAuth } from "../_shared/staff-auth";

export const dynamic = "force-dynamic";

function parseNumberParam(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseStatusParam(value: string | null): InboxThreadStatus | undefined {
  if (!value) {
    return undefined;
  }
  return inboxThreadStatuses.includes(value as InboxThreadStatus)
    ? (value as InboxThreadStatus)
    : undefined;
}

export async function GET(request: Request) {
  const auth = await requireStaffAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const url = new URL(request.url);
    const limit = parseNumberParam(url.searchParams.get("limit"), 50);
    const offset = parseNumberParam(url.searchParams.get("offset"), 0);
    const status = parseStatusParam(url.searchParams.get("status"));

    const rows = await listThreadsWithLatestDraft({
      status,
      limit,
      offset,
    });

    const visibleRows = status ? rows : rows.filter((row) => isThreadVisibleInInbox(row));
    let primeRows: Awaited<ReturnType<typeof listPrimeInboxThreadSummaries>> = [];
    try {
      primeRows = await listPrimeInboxThreadSummaries(status);
    } catch (error) {
      console.error("Failed to load Prime review thread summaries:", error);
    }

    const filteredPrimeRows = status
      ? primeRows.filter((row) => row.status === status)
      : primeRows.filter((row) => isPrimeThreadVisibleInInbox({ reviewStatus: row.status }));

    return NextResponse.json({
      success: true,
      data: [
        ...visibleRows.map((row) => buildThreadSummaryFromRow(row)),
        ...filteredPrimeRows,
      ],
    });
  } catch (error) {
    return inboxApiErrorResponse(error);
  }
}

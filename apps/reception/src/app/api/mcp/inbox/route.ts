import { NextResponse } from "next/server";

import {
  buildThreadSummary,
  isThreadVisibleInInbox,
} from "@/lib/inbox/api-models.server";
import { inboxApiErrorResponse } from "@/lib/inbox/api-route-helpers";
import {
  getThread,
  type InboxThreadStatus,
  inboxThreadStatuses,
  listThreads,
} from "@/lib/inbox/repositories.server";

import { requireStaffAuth } from "../_shared/staff-auth";

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

    const threads = await listThreads({
      status,
      limit,
      offset,
    });

    const visibleThreads = status ? threads : threads.filter((thread) => isThreadVisibleInInbox(thread));
    const records = await Promise.all(
      visibleThreads.map(async (thread) => getThread(thread.id)),
    );

    return NextResponse.json({
      success: true,
      data: records
        .filter((record): record is NonNullable<typeof record> => Boolean(record))
        .map((record) => buildThreadSummary(record)),
    });
  } catch (error) {
    return inboxApiErrorResponse(error);
  }
}

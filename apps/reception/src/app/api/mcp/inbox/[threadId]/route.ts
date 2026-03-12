import { NextResponse } from "next/server";

import {
  buildThreadSummary,
  getCurrentDraft,
  parseThreadMetadata,
  serializeDraft,
  serializeMessage,
} from "@/lib/inbox/api-models.server";
import {
  inboxApiErrorResponse,
  notFoundResponse,
} from "@/lib/inbox/api-route-helpers";
import {
  getPrimeInboxThreadDetail,
  isPrimeInboxThreadId,
} from "@/lib/inbox/prime-review.server";
import { getThread, getThreadMessages } from "@/lib/inbox/repositories.server";

import { requireStaffAuth } from "../../_shared/staff-auth";

const DEFAULT_MESSAGE_LIMIT = 20;

function parseIntParam(value: string | null, fallback: number): number {
  if (value === null) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ threadId: string }> | { threadId: string } },
) {
  const auth = await requireStaffAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const params = await context.params;
  if (isPrimeInboxThreadId(params.threadId)) {
    try {
      const detail = await getPrimeInboxThreadDetail(params.threadId);
      if (!detail) {
        return notFoundResponse(`Thread ${params.threadId} not found`);
      }

      return NextResponse.json({
        success: true,
        data: detail,
      });
    } catch (error) {
      return inboxApiErrorResponse(error);
    }
  }

  const record = await getThread(params.threadId);
  if (!record) {
    return notFoundResponse(`Thread ${params.threadId} not found`);
  }

  try {
    const url = new URL(request.url);
    const limit = parseIntParam(url.searchParams.get("limit"), DEFAULT_MESSAGE_LIMIT);
    const offset = parseIntParam(url.searchParams.get("offset"), 0);

    const paginated = await getThreadMessages(
      { threadId: params.threadId, limit, offset },
    );

    const currentDraft = getCurrentDraft(record);
    return NextResponse.json({
      success: true,
      data: {
        thread: buildThreadSummary(record),
        campaign: null,
        metadata: parseThreadMetadata(record.thread.metadata_json),
        messages: paginated.messages.map((message) => serializeMessage(message)),
        totalMessages: paginated.totalMessages,
        messageOffset: paginated.offset,
        events: record.events,
        admissionOutcomes: record.admissionOutcomes,
        currentDraft: currentDraft ? serializeDraft(currentDraft) : null,
        messageBodiesSource: "d1" as const,
        warning: null,
      },
    });
  } catch (error) {
    return inboxApiErrorResponse(error);
  }
}

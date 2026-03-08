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
import { getThread } from "@/lib/inbox/repositories.server";

import { requireStaffAuth } from "../../_shared/staff-auth";

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
    const currentDraft = getCurrentDraft(record);
    return NextResponse.json({
      success: true,
      data: {
        thread: buildThreadSummary(record),
        campaign: null,
        metadata: parseThreadMetadata(record.thread.metadata_json),
        messages: record.messages.map((message) => serializeMessage(message)),
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

import { NextResponse } from "next/server";

import { getGmailThread } from "@/lib/gmail-client";
import {
  buildThreadSummary,
  getCurrentDraft,
  mergeMessagesWithGmailThread,
  parseThreadMetadata,
  serializeDraft,
} from "@/lib/inbox/api-models.server";
import {
  inboxApiErrorResponse,
  notFoundResponse,
} from "@/lib/inbox/api-route-helpers";
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
  const record = await getThread(params.threadId);
  if (!record) {
    return notFoundResponse(`Thread ${params.threadId} not found`);
  }

  let gmailThread = null;
  let warning: string | null = null;
  try {
    gmailThread = await getGmailThread(params.threadId);
  } catch (error) {
    warning = error instanceof Error ? error.message : String(error);
  }

  try {
    const currentDraft = getCurrentDraft(record);
    return NextResponse.json({
      success: true,
      data: {
        thread: buildThreadSummary(record),
        metadata: parseThreadMetadata(record.thread.metadata_json),
        messages: mergeMessagesWithGmailThread(record.messages, gmailThread),
        events: record.events,
        admissionOutcomes: record.admissionOutcomes,
        currentDraft: currentDraft ? serializeDraft(currentDraft) : null,
        messageBodiesSource: gmailThread ? "gmail" : "d1",
        warning,
      },
    });
  } catch (error) {
    return inboxApiErrorResponse(error);
  }
}

import { NextResponse } from "next/server";

import { createGmailDraft, sendGmailDraft } from "@/lib/gmail-client";
import {
  getCurrentDraft,
  parseThreadMetadata,
  serializeDraft,
} from "@/lib/inbox/api-models.server";
import {
  badRequestResponse,
  inboxApiErrorResponse,
  notFoundResponse,
} from "@/lib/inbox/api-route-helpers";
import {
  isPrimeInboxThreadId,
  sendPrimeInboxThread,
} from "@/lib/inbox/prime-review.server";
import {
  getThread,
  updateDraft,
  updateThreadStatus,
} from "@/lib/inbox/repositories.server";
import { recordInboxEvent } from "@/lib/inbox/telemetry.server";

import { requireStaffAuth } from "../../../_shared/staff-auth";

export async function POST(
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
      const result = await sendPrimeInboxThread(params.threadId, auth.uid);
      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error) {
      return inboxApiErrorResponse(error);
    }
  }

  const record = await getThread(params.threadId);
  if (!record) {
    return notFoundResponse(`Thread ${params.threadId} not found`);
  }

  const currentDraft = getCurrentDraft(record);
  if (!currentDraft) {
    return badRequestResponse("No draft exists for this thread");
  }

  const recipientEmails = currentDraft.recipient_emails_json
    ? (JSON.parse(currentDraft.recipient_emails_json) as string[])
    : [];
  if (recipientEmails.length === 0) {
    return badRequestResponse("Draft has no recipients");
  }

  try {
    const created = await createGmailDraft({
      to: recipientEmails,
      subject: currentDraft.subject ?? record.thread.subject ?? "Re: Guest inquiry",
      bodyPlain: currentDraft.plain_text,
      bodyHtml: currentDraft.html ?? undefined,
      threadId: params.threadId,
    });

    if (!created.id) {
      throw new Error("Gmail draft creation did not return a draft id");
    }

    const sent = await sendGmailDraft(created.id);
    const metadata = parseThreadMetadata(record.thread.metadata_json);

    const approvedDraft = await updateDraft({
      draftId: currentDraft.id,
      gmailDraftId: created.id,
      status: "approved",
      createdByUid: auth.uid,
    });

    const sentDraft = await updateDraft({
      draftId: currentDraft.id,
      gmailDraftId: created.id,
      status: "sent",
      createdByUid: auth.uid,
    });

    await updateThreadStatus({
      threadId: params.threadId,
      status: "sent",
      metadata: {
        ...metadata,
        needsManualDraft: false,
        lastDraftId: sentDraft?.id ?? currentDraft.id,
      },
    });

    await recordInboxEvent({
      threadId: params.threadId,
      eventType: "approved",
      actorUid: auth.uid,
      metadata: {
        draftId: approvedDraft?.id ?? currentDraft.id,
      },
    });

    await recordInboxEvent({
      threadId: params.threadId,
      eventType: "sent",
      actorUid: auth.uid,
      metadata: {
        draftId: sentDraft?.id ?? currentDraft.id,
        gmailDraftId: created.id,
        gmailMessageId: sent.id ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        draft: sentDraft ? serializeDraft(sentDraft) : null,
        sentMessageId: sent.id ?? null,
      },
    });
  } catch (error) {
    return inboxApiErrorResponse(error);
  }
}

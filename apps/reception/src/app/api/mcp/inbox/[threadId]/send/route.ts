import { NextResponse } from "next/server";
import { z } from "zod";

import { createGmailDraft, sendGmailDraft } from "@/lib/gmail-client";
import {
  getCurrentDraft,
  parseJsonArray,
  parseThreadMetadataFromRow,
  serializeDraft,
} from "@/lib/inbox/api-models.server";
import {
  badRequestResponse,
  conflictResponse,
  inboxApiErrorResponse,
  invalidJsonResponse,
  invalidPayloadResponse,
  notFoundResponse,
  readJsonPayload,
} from "@/lib/inbox/api-route-helpers";
import {
  getPrimeInboxThreadDetail,
  isPrimeInboxThreadId,
  sendPrimeInboxThread,
} from "@/lib/inbox/prime-review.server";
import { matchTemplates } from "@/lib/inbox/prime-templates";
import {
  getThread,
  updateDraft,
  updateThreadStatus,
} from "@/lib/inbox/repositories.server";
import { recordInboxEvent } from "@/lib/inbox/telemetry.server";

import { requireStaffAuth } from "../../../_shared/staff-auth";

const sendDraftPayloadSchema = z
  .object({
    expectedUpdatedAt: z.string().datetime().optional(),
  })
  .strict();

export async function POST(
  request: Request,
  context: { params: Promise<{ threadId: string }> | { threadId: string } },
) {
  const auth = await requireStaffAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  let rawPayload: unknown;
  try {
    rawPayload = await readJsonPayload(request);
  } catch {
    return invalidJsonResponse();
  }

  const parsedPayload = sendDraftPayloadSchema.safeParse(rawPayload);
  if (!parsedPayload.success) {
    return invalidPayloadResponse(parsedPayload.error, "Invalid send payload");
  }

  const params = await context.params;
  if (isPrimeInboxThreadId(params.threadId)) {
    try {
      // Capture draft state before send for telemetry
      const detailBeforeSend = await getPrimeInboxThreadDetail(params.threadId);
      const draftBeforeSend = detailBeforeSend?.currentDraft ?? null;

      const result = await sendPrimeInboxThread(params.threadId, auth.uid, auth.roles);

      // Log prime_manual_reply when a Prime draft is sent without a template
      if (!draftBeforeSend?.templateUsed) {
        const latestInbound = detailBeforeSend?.messages
          ?.filter((m) => m.direction === "inbound")
          .pop();
        const guestSnippet = (
          latestInbound?.bodyPlain
          ?? latestInbound?.snippet
          ?? ""
        ).slice(0, 200);
        const detected = matchTemplates(guestSnippet);

        void recordInboxEvent({
          threadId: params.threadId,
          eventType: "prime_manual_reply",
          actorUid: auth.uid,
          metadata: {
            guestQuestionSnippet: guestSnippet,
            detectedCategory: detected[0]?.category ?? null,
          },
        });
      }

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

  // Optimistic lock: reject if the draft was modified since the caller last saw it
  if (parsedPayload.data.expectedUpdatedAt) {
    if (currentDraft.updated_at !== parsedPayload.data.expectedUpdatedAt) {
      void recordInboxEvent({
        threadId: params.threadId,
        eventType: "send_failed",
        actorUid: auth.uid,
        metadata: { errorCategory: "optimistic_lock_conflict" },
      });
      return conflictResponse(
        "Draft was modified since you last viewed it. Reload the draft and try again.",
      );
    }
  }

  const recipientEmails = parseJsonArray(currentDraft.recipient_emails_json);
  if (recipientEmails.length === 0) {
    return badRequestResponse("Draft has no recipients");
  }

  try {
    let gmailDraftId: string;

    if (currentDraft.gmail_draft_id) {
      // Idempotency guard: a previous attempt already created this Gmail draft.
      // Skip creation and use the existing draft ID to avoid sending a duplicate.
      // This fires when the route is retried after a crash between createGmailDraft
      // and the D1 write below. The rate should be near zero in normal operation;
      // a non-zero rate in production signals crash-retries are occurring.
      gmailDraftId = currentDraft.gmail_draft_id;
      void recordInboxEvent({
        threadId: params.threadId,
        eventType: "send_duplicate_blocked",
        actorUid: auth.uid,
        metadata: { emailId: params.threadId, gmailDraftId },
      });
    } else {
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

      // Write gmailDraftId to D1 BEFORE sending. If the process crashes after
      // this write but before sendGmailDraft completes, the next retry will
      // detect the ID, skip creation, and proceed to send. If this D1 write
      // fails, the retry will call createGmailDraft() again; the first draft
      // is orphaned (never sent, never re-sent — safe).
      await updateDraft({
        draftId: currentDraft.id,
        gmailDraftId: created.id,
        createdByUid: auth.uid,
      });

      gmailDraftId = created.id;
    }

    const sent = await sendGmailDraft(gmailDraftId);
    const metadata = parseThreadMetadataFromRow(record.thread);

    const approvedDraft = await updateDraft({
      draftId: currentDraft.id,
      gmailDraftId,
      status: "approved",
      createdByUid: auth.uid,
    });

    const sentDraft = await updateDraft({
      draftId: currentDraft.id,
      gmailDraftId,
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
        gmailDraftId,
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
    void recordInboxEvent({
      threadId: params.threadId,
      eventType: "send_failed",
      actorUid: auth.uid,
      metadata: { errorCategory: "gmail_error" },
    });
    return inboxApiErrorResponse(error);
  }
}

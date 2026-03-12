import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getCurrentDraft,
  getLatestInboundStoredMessage,
  parseJsonArray,
  parseThreadMetadataFromRow,
  serializeDraft,
} from "@/lib/inbox/api-models.server";
import {
  ensureReplySubject,
  inboxApiErrorResponse,
  invalidJsonResponse,
  invalidPayloadResponse,
  notFoundResponse,
  readJsonPayload,
} from "@/lib/inbox/api-route-helpers";
import {
  getPrimeInboxThreadDetail,
  isPrimeInboxThreadId,
  savePrimeInboxDraft,
} from "@/lib/inbox/prime-review.server";
import {
  createDraft,
  getThread,
  updateDraft,
  updateThreadStatus,
} from "@/lib/inbox/repositories.server";
import { recordInboxEvent } from "@/lib/inbox/telemetry.server";

import { requireStaffAuth } from "../../../_shared/staff-auth";

const updateDraftPayloadSchema = z
  .object({
    subject: z.string().min(1).optional(),
    recipientEmails: z.array(z.string().email()).min(1).optional(),
    plainText: z.string().min(1),
    html: z.string().min(1).nullable().optional(),
  })
  .strict();

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
        data: {
          threadId: params.threadId,
          draft: detail.currentDraft,
          needsManualDraft: false,
        },
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
  return NextResponse.json({
    success: true,
    data: {
      threadId: params.threadId,
      draft: currentDraft ? serializeDraft(currentDraft) : null,
      needsManualDraft: Boolean(parseThreadMetadataFromRow(record.thread).needsManualDraft),
    },
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ threadId: string }> | { threadId: string } },
) {
  const auth = await requireStaffAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const params = await context.params;
  if (isPrimeInboxThreadId(params.threadId)) {
    let primeRawPayload: unknown;
    try {
      primeRawPayload = await readJsonPayload(request);
    } catch {
      return invalidJsonResponse();
    }

    const parsedPrimePayload = updateDraftPayloadSchema.safeParse(primeRawPayload);
    if (!parsedPrimePayload.success) {
      return invalidPayloadResponse(parsedPrimePayload.error, "Invalid draft update payload");
    }

    try {
      const draft = await savePrimeInboxDraft(
        params.threadId,
        { plainText: parsedPrimePayload.data.plainText },
        auth.uid,
      );

      return NextResponse.json({
        success: true,
        data: {
          draft,
        },
      });
    } catch (error) {
      return inboxApiErrorResponse(error);
    }
  }

  const record = await getThread(params.threadId);
  if (!record) {
    return notFoundResponse(`Thread ${params.threadId} not found`);
  }

  let rawPayload: unknown;
  try {
    rawPayload = await readJsonPayload(request);
  } catch {
    return invalidJsonResponse();
  }

  const parsedPayload = updateDraftPayloadSchema.safeParse(rawPayload);
  if (!parsedPayload.success) {
    return invalidPayloadResponse(parsedPayload.error, "Invalid draft update payload");
  }

  try {
    const currentDraft = getCurrentDraft(record);
    const latestInbound = getLatestInboundStoredMessage(record);
    const metadata = parseThreadMetadataFromRow(record.thread);
    const subject = ensureReplySubject(
      parsedPayload.data.subject ?? currentDraft?.subject ?? record.thread.subject,
    );
    const recipientEmails =
      parsedPayload.data.recipientEmails
      ?? (
        currentDraft?.recipient_emails_json
          ? parseJsonArray(currentDraft.recipient_emails_json)
          : latestInbound?.sender_email
            ? [latestInbound.sender_email]
            : []
      );

    const draft = currentDraft
      ? await updateDraft({
          draftId: currentDraft.id,
          status: "edited",
          subject,
          recipientEmails,
          plainText: parsedPayload.data.plainText,
          html: parsedPayload.data.html ?? currentDraft.html,
          createdByUid: auth.uid,
        })
      : await createDraft({
          threadId: params.threadId,
          status: "edited",
          subject,
          recipientEmails,
          plainText: parsedPayload.data.plainText,
          html: parsedPayload.data.html ?? null,
          createdByUid: auth.uid,
        });

    await updateThreadStatus({
      threadId: params.threadId,
      status: record.thread.status === "resolved" ? "resolved" : "drafted",
      metadata: {
        ...metadata,
        needsManualDraft: false,
        lastDraftId: draft?.id ?? currentDraft?.id ?? null,
      },
    });

    await recordInboxEvent({
      threadId: params.threadId,
      eventType: "draft_edited",
      actorUid: auth.uid,
      metadata: {
        draftId: draft?.id ?? currentDraft?.id ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        draft: draft ? serializeDraft(draft) : null,
      },
    });
  } catch (error) {
    return inboxApiErrorResponse(error);
  }
}

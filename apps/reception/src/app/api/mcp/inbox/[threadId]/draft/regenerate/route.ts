import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getCurrentDraft,
  getLatestInboundStoredMessage,
  parseJsonArray,
  parseMessagePayload,
  parseThreadMetadataFromRow,
  serializeDraft,
} from "@/lib/inbox/api-models.server";
import {
  conflictResponse,
  ensureReplySubject,
  inboxApiErrorResponse,
  invalidJsonResponse,
  invalidPayloadResponse,
  notFoundResponse,
  readJsonPayload,
} from "@/lib/inbox/api-route-helpers";
import { generateAgentDraft } from "@/lib/inbox/draft-pipeline.server";
import { isPrimeInboxThreadId } from "@/lib/inbox/prime-review.server";
import {
  createDraft,
  getThread,
  updateDraft,
  updateThreadStatus,
} from "@/lib/inbox/repositories.server";
import { recordInboxEvent } from "@/lib/inbox/telemetry.server";
import { boundMessages } from "@/lib/inbox/thread-context";

import { requireStaffAuth } from "../../../../_shared/staff-auth";

const regeneratePayloadSchema = z
  .object({
    force: z.boolean().optional(),
  })
  .strict();

// eslint-disable-next-line complexity -- INBOX-0006 orchestration handler; splitting would add indirection without reducing real complexity
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

  const parsedPayload = regeneratePayloadSchema.safeParse(rawPayload);
  if (!parsedPayload.success) {
    return invalidPayloadResponse(parsedPayload.error, "Invalid draft regenerate payload");
  }

  const params = await context.params;

  // Prime threads do not support server-side draft regeneration.
  // The channel adapter sets supportsDraftRegenerate: false, so the UI
  // should never reach here, but guard explicitly in case of direct API calls.
  if (isPrimeInboxThreadId(params.threadId)) {
    return NextResponse.json(
      { success: false, error: "Draft regeneration is not supported for Prime threads." },
      { status: 400 },
    );
  }

  const record = await getThread(params.threadId);
  if (!record) {
    return notFoundResponse(`Thread ${params.threadId} not found`);
  }

  const currentDraft = getCurrentDraft(record);
  if (currentDraft?.status === "edited" && !parsedPayload.data.force) {
    return conflictResponse("Draft has staff edits. Retry with force=true to overwrite it.");
  }

  // Idempotency guard: if a generated draft was created very recently
  // (within 10 seconds), return it rather than creating a duplicate.
  // Protects against double-click / rapid successive requests.
  const RECENT_DRAFT_WINDOW_MS = 10_000;
  if (
    currentDraft
    && currentDraft.status === "generated"
    && !parsedPayload.data.force
  ) {
    const draftAge = Date.now() - new Date(currentDraft.created_at).getTime();
    if (draftAge <= RECENT_DRAFT_WINDOW_MS) {
      return NextResponse.json({
        success: true,
        data: {
          draft: serializeDraft(currentDraft),
          idempotent: true,
        },
      });
    }
  }

  const latestInbound = getLatestInboundStoredMessage(record);
  const latestPayload = latestInbound ? parseMessagePayload(latestInbound.payload_json) : {};
  const threadMessages = record.messages.map((message) => {
    const payload = parseMessagePayload(message.payload_json);
    return {
      from: payload.from ?? message.sender_email ?? "Unknown sender",
      date: message.sent_at ?? message.created_at,
      snippet: payload.body?.plain ?? message.snippet ?? "",
    };
  });

  const threadMetadata = parseThreadMetadataFromRow(record.thread);

  try {
    const regenerated = await generateAgentDraft({
      from: latestPayload.from ?? latestInbound?.sender_email ?? undefined,
      subject: latestInbound?.subject ?? record.thread.subject ?? undefined,
      body: latestPayload.body?.plain ?? latestInbound?.snippet ?? "",
      threadContext: {
        messages: boundMessages(threadMessages),
        ...(threadMetadata.guestBookingRef ? { bookingRef: threadMetadata.guestBookingRef } : {}),
      },
      bookingRef: threadMetadata.guestBookingRef || undefined,
      guestName: threadMetadata.guestFirstName || undefined,
      guestRoomNumbers: threadMetadata.guestRoomNumbers?.length ? threadMetadata.guestRoomNumbers : undefined,
    });

    if (regenerated.status === "error" || !regenerated.plainText) {
      throw new Error(regenerated.error?.message ?? "Unable to regenerate draft");
    }

    const subject = ensureReplySubject(currentDraft?.subject ?? record.thread.subject);
    const recipientEmails =
      currentDraft?.recipient_emails_json
        ? parseJsonArray(currentDraft.recipient_emails_json)
        : latestInbound?.sender_email
          ? [latestInbound.sender_email]
          : [];

    const draft = currentDraft
      ? await updateDraft({
          draftId: currentDraft.id,
          status: "generated",
          subject,
          recipientEmails,
          plainText: regenerated.plainText,
          html: regenerated.html,
          templateUsed: regenerated.templateUsed?.subject ?? null,
          quality: regenerated.qualityResult ?? undefined,
          interpret: regenerated.interpretResult ?? undefined,
          createdByUid: auth.uid,
          originalPlainText: regenerated.plainText,
          originalHtml: regenerated.html ?? null,
        })
      : await createDraft({
          threadId: params.threadId,
          status: "generated",
          subject,
          recipientEmails,
          plainText: regenerated.plainText,
          html: regenerated.html,
          originalPlainText: regenerated.plainText,
          originalHtml: regenerated.html ?? null,
          templateUsed: regenerated.templateUsed?.subject ?? null,
          quality: regenerated.qualityResult ?? undefined,
          interpret: regenerated.interpretResult ?? undefined,
          createdByUid: auth.uid,
        });

    await updateThreadStatus({
      threadId: params.threadId,
      status: "drafted",
      metadata: {
        ...threadMetadata,
        needsManualDraft: false,
        draftFailureCode: null,
        draftFailureMessage: null,
        lastDraftId: draft?.id ?? null,
        lastDraftTemplateSubject: regenerated.templateUsed?.subject ?? null,
        lastDraftQualityPassed: regenerated.qualityResult?.passed ?? false,
      },
    });

    await recordInboxEvent({
      threadId: params.threadId,
      eventType: "drafted",
      actorUid: auth.uid,
      metadata: {
        draftId: draft?.id ?? currentDraft?.id ?? null,
        templateUsed: regenerated.templateUsed?.subject ?? null,
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

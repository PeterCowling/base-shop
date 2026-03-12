import { NextResponse } from "next/server";

import { markGmailThreadRead } from "@/lib/gmail-client";
import { extractSenderDomain } from "@/lib/inbox/admission";
import { parseThreadMetadataFromRow } from "@/lib/inbox/api-models.server";
import {
  conflictResponse,
  inboxApiErrorResponse,
  notFoundResponse,
} from "@/lib/inbox/api-route-helpers";
import {
  dismissPrimeInboxThread,
  isPrimeInboxThreadId,
} from "@/lib/inbox/prime-review.server";
import {
  getThread,
  recordAdmission,
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
      const thread = await dismissPrimeInboxThread(params.threadId, auth.uid);
      if (!thread) {
        return notFoundResponse(`Thread ${params.threadId} not found`);
      }

      return NextResponse.json({
        success: true,
        data: {
          thread,
          gmailMarkedRead: false,
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

  if (record.thread.status === "resolved") {
    return conflictResponse("Thread is already resolved");
  }

  if (record.thread.status === "auto_archived") {
    return conflictResponse("Thread is already archived");
  }

  try {
    const metadata = parseThreadMetadataFromRow(record.thread);

    // Extract sender context from the latest inbound message
    const inboundMessages = record.messages.filter(
      (m) => m.direction === "inbound",
    );
    const latestInbound = inboundMessages.at(-1);
    const senderEmail = latestInbound?.sender_email ?? null;
    const senderDomain = senderEmail ? extractSenderDomain(senderEmail) : null;

    await markGmailThreadRead(params.threadId);

    await recordAdmission({
      threadId: params.threadId,
      decision: "auto-archive",
      source: "staff_override",
      matchedRule: "staff-not-relevant",
      sourceMetadata: {
        senderEmail,
        senderDomain,
        originalAdmissionDecision: metadata.latestAdmissionDecision ?? null,
        dismissedByUid: auth.uid,
      },
    });

    const thread = await updateThreadStatus({
      threadId: params.threadId,
      status: "auto_archived",
      metadata: {
        ...metadata,
        needsManualDraft: false,
      },
    });

    await recordInboxEvent({
      threadId: params.threadId,
      eventType: "dismissed",
      actorUid: auth.uid,
    });

    return NextResponse.json({
      success: true,
      data: {
        thread,
        gmailMarkedRead: true,
      },
    });
  } catch (error) {
    return inboxApiErrorResponse(error);
  }
}

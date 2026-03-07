import { NextResponse } from "next/server";

import { parseThreadMetadata } from "@/lib/inbox/api-models.server";
import {
  conflictResponse,
  inboxApiErrorResponse,
  notFoundResponse,
} from "@/lib/inbox/api-route-helpers";
import {
  getThread,
  recordAdmission,
  updateThreadStatus,
} from "@/lib/inbox/repositories.server";
import { recordInboxEvent } from "@/lib/inbox/telemetry.server";

import { requireStaffAuth } from "../../../_shared/staff-auth";

function extractSenderDomain(email: string | null | undefined): string | null {
  if (!email) return null;
  const atIndex = email.lastIndexOf("@");
  return atIndex >= 0 ? email.slice(atIndex + 1) : null;
}

export async function POST(
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

  if (record.thread.status === "resolved") {
    return conflictResponse("Thread is already resolved");
  }

  if (record.thread.status === "auto_archived") {
    return conflictResponse("Thread is already archived");
  }

  try {
    const metadata = parseThreadMetadata(record.thread.metadata_json);

    // Extract sender context from the latest inbound message
    const inboundMessages = record.messages.filter(
      (m) => m.direction === "inbound",
    );
    const latestInbound = inboundMessages.at(-1);
    const senderEmail = latestInbound?.sender_email ?? null;
    const senderDomain = extractSenderDomain(senderEmail);

    // Record feedback data first — this is the primary value of the dismiss action.
    // If this fails, the thread status is unchanged and the user can retry.
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
      },
    });
  } catch (error) {
    return inboxApiErrorResponse(error);
  }
}

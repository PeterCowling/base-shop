import { NextResponse } from "next/server";

import { parseThreadMetadata } from "@/lib/inbox/api-models.server";
import {
  inboxApiErrorResponse,
  notFoundResponse,
} from "@/lib/inbox/api-route-helpers";
import { getThread, updateThreadStatus } from "@/lib/inbox/repositories.server";
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
  const record = await getThread(params.threadId);
  if (!record) {
    return notFoundResponse(`Thread ${params.threadId} not found`);
  }

  try {
    const metadata = parseThreadMetadata(record.thread.metadata_json);
    const thread = await updateThreadStatus({
      threadId: params.threadId,
      status: "resolved",
      metadata: {
        ...metadata,
        needsManualDraft: false,
      },
    });

    await recordInboxEvent({
      threadId: params.threadId,
      eventType: "resolved",
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

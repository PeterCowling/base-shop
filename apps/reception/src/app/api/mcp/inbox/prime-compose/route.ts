import { NextResponse } from "next/server";

import {
  buildPrimeInboxThreadId,
  staffBroadcastSend,
} from "@/lib/inbox/prime-review.server";
import { recordInboxEvent } from "@/lib/inbox/telemetry.server";

import { requireStaffAuth } from "../../_shared/staff-auth";

export async function POST(request: Request) {
  const auth = await requireStaffAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" }, // i18n-exempt -- INBOX-101 machine-readable API error [ttl=2026-12-31]
      { status: 400 },
    );
  }

  const text =
    typeof (rawBody as Record<string, unknown>)?.text === "string"
      ? ((rawBody as Record<string, unknown>).text as string).trim()
      : "";

  if (!text) {
    return NextResponse.json(
      { success: false, error: "text is required" }, // i18n-exempt -- INBOX-101 machine-readable API error [ttl=2026-12-31]
      { status: 400 },
    );
  }

  let broadcastResult: Awaited<ReturnType<typeof staffBroadcastSend>>;
  try {
    broadcastResult = await staffBroadcastSend({
      text,
      actorUid: auth.uid,
      roles: auth.roles,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to send broadcast" }, // i18n-exempt -- INBOX-101 machine-readable API error [ttl=2026-12-31]
      { status: 502 },
    );
  }

  if (!broadcastResult) {
    return NextResponse.json(
      { success: false, error: "Prime messaging not configured" }, // i18n-exempt -- INBOX-101 machine-readable API error [ttl=2026-12-31]
      { status: 503 },
    );
  }

  // WHOLE_HOSTEL_BROADCAST_CHANNEL_ID lives in the Prime app and is not importable here.
  // The literal 'broadcast_whole_hostel' is stable by definition:
  // buildBroadcastChannelId('whole_hostel') = BROADCAST_CHANNEL_PREFIX + '_' + 'whole_hostel'
  const broadcastPrefixedId = buildPrimeInboxThreadId("broadcast_whole_hostel");

  // Fire-and-forget: intentional. The broadcast was already sent successfully above.
  // prime_broadcast_initiated is a CRITICAL_EVENT_TYPE so recordInboxEvent will
  // await logInboxEvent (throws on DB failure). The void means a DB failure after
  // the 200 response is returned will surface as an unhandled rejection in the
  // Next.js runtime (logged to server stderr) but will NOT affect the caller.
  // Acceptable trade-off: the operator already received the broadcast; a missed
  // telemetry write should not surface as a 500 to the client.
  void recordInboxEvent({
    threadId: broadcastPrefixedId,
    eventType: "prime_broadcast_initiated",
    actorUid: auth.uid,
    metadata: { textLength: text.length },
  });

  return NextResponse.json({ success: true });
}

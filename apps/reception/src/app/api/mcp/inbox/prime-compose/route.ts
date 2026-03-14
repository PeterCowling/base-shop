import { NextResponse } from "next/server";

import {
  buildPrimeInboxThreadId,
  initiatePrimeOutboundThread,
  sendPrimeInboxThread,
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

  let initiateResult: Awaited<ReturnType<typeof initiatePrimeOutboundThread>>;
  try {
    initiateResult = await initiatePrimeOutboundThread({
      text,
      actorUid: auth.uid,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to send broadcast" }, // i18n-exempt -- INBOX-101 machine-readable API error [ttl=2026-12-31]
      { status: 502 },
    );
  }

  if (!initiateResult) {
    return NextResponse.json(
      { success: false, error: "Prime messaging not configured" }, // i18n-exempt -- INBOX-101 machine-readable API error [ttl=2026-12-31]
      { status: 503 },
    );
  }

  const broadcastPrefixedId = buildPrimeInboxThreadId(
    initiateResult.detail.thread.id,
  );

  try {
    await sendPrimeInboxThread(broadcastPrefixedId, auth.uid);
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to send broadcast" }, // i18n-exempt -- INBOX-101 machine-readable API error [ttl=2026-12-31]
      { status: 502 },
    );
  }

  void recordInboxEvent({
    threadId: broadcastPrefixedId,
    eventType: "prime_broadcast_initiated",
    actorUid: auth.uid,
    metadata: { textLength: text.length },
  });

  return NextResponse.json({ success: true });
}

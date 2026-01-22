import { NextResponse } from "next/server";

import { hasAdminSession } from "../../../../../../lib/accessAdmin";
import { updateAccessRequest } from "../../../../../../lib/accessStore";

export const runtime = "nodejs";

function summarizeRequest(request: {
  id: string;
  handle: string;
  referredBy: string;
  note: string;
  createdAt: string;
  status: string;
  inviteId?: string;
  requestIp: string;
}) {
  return {
    id: request.id,
    handle: request.handle,
    referredBy: request.referredBy,
    note: request.note,
    createdAt: request.createdAt,
    status: request.status,
    inviteId: request.inviteId,
    requestIp: request.requestIp,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const authenticated = await hasAdminSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { requestId } = await params;
  if (!requestId) {
    return NextResponse.json({ ok: false, error: "missing" }, { status: 400 });
  }

  const updated = await updateAccessRequest({
    requestId,
    status: "dismissed",
  });
  if (!updated.request) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    request: summarizeRequest(updated.request),
    storeMode: updated.storeMode,
  });
}

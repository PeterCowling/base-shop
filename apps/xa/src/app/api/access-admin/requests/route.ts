import { NextResponse } from "next/server";

import { hasAdminSession } from "../../../../lib/accessAdmin";
import { listAccessRequests } from "../../../../lib/accessStore";

export const runtime = "edge";

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

export async function GET(request: Request) {
  const authenticated = await hasAdminSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { requests, storeMode } = await listAccessRequests();
  const sorted = [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({
    ok: true,
    requests: sorted.map(summarizeRequest),
    storeMode,
  });
}

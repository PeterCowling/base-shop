import { NextResponse } from "next/server";

import { hasAdminSession } from "../../../../../../lib/accessAdmin";
import { revokeInvite } from "../../../../../../lib/accessStore";

export const runtime = "edge";

function summarizeInvite(invite: {
  id: string;
  codeHint: string;
  label?: string;
  createdAt: string;
  expiresAt?: string;
  maxUses?: number;
  uses: number;
  revokedAt?: string;
  lastUsedAt?: string;
  requestId?: string;
}) {
  let status = "active";
  if (invite.revokedAt) status = "revoked";
  else if (invite.expiresAt && Date.parse(invite.expiresAt) <= Date.now()) {
    status = "expired";
  } else if (invite.maxUses && invite.uses >= invite.maxUses) {
    status = "exhausted";
  }
  return { ...invite, status };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  const authenticated = await hasAdminSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { inviteId } = await params;
  if (!inviteId) {
    return NextResponse.json({ ok: false, error: "missing" }, { status: 400 });
  }

  const { invite, storeMode } = await revokeInvite(inviteId);
  if (!invite) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, invite: summarizeInvite(invite), storeMode });
}

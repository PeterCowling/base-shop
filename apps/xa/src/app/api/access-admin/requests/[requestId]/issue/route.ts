/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy admin issue flow pending i18n overhaul */
import { NextResponse } from "next/server";

import { hasAdminSession } from "../../../../../../lib/accessAdmin";
import {
  createInvite,
  listAccessRequests,
  updateAccessRequest,
} from "../../../../../../lib/accessStore";

export const runtime = "nodejs";

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
  return {
    id: invite.id,
    codeHint: invite.codeHint,
    label: invite.label,
    createdAt: invite.createdAt,
    expiresAt: invite.expiresAt,
    maxUses: invite.maxUses,
    uses: invite.uses,
    revokedAt: invite.revokedAt,
    lastUsedAt: invite.lastUsedAt,
    requestId: invite.requestId,
  };
}

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

function sanitizeMaxUses(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), 100);
}

function sanitizeExpiresAt(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return undefined;
  return new Date(parsed).toISOString();
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

  const { requests } = await listAccessRequests();
  const entry = requests.find((item) => item.id === requestId);
  if (!entry) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (entry.status !== "pending") {
    return NextResponse.json({ ok: false, error: "already_processed" }, { status: 400 });
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  const maxUses = sanitizeMaxUses(payload.maxUses, 1);
  const expiresAt = sanitizeExpiresAt(payload.expiresAt);
  const label = entry.handle ? `Request: ${entry.handle}` : "Invite request";

  const { code, invite, storeMode } = await createInvite({
    label,
    maxUses,
    expiresAt,
    requestId,
  });
  const updated = await updateAccessRequest({
    requestId,
    status: "approved",
    inviteId: invite.id,
  });

  return NextResponse.json({
    ok: true,
    code,
    invite: summarizeInvite(invite),
    request: updated.request ? summarizeRequest(updated.request) : null,
    storeMode: storeMode ?? updated.storeMode,
  });
}

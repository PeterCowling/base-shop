import { NextResponse } from "next/server";

import { hasAdminSession } from "../../../../lib/accessAdmin";
import { createInvite, listInvites } from "../../../../lib/accessStore";

export const runtime = "nodejs";

function sanitizeMaxUses(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.min(Math.floor(parsed), 1000);
}

function sanitizeLabel(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 80) : undefined;
}

function sanitizeExpiresAt(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return undefined;
  return new Date(parsed).toISOString();
}

function toInviteSummary(invite: {
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

export async function GET(request: Request) {
  const authenticated = await hasAdminSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { invites, storeMode } = await listInvites();
  return NextResponse.json({
    ok: true,
    invites: invites.map(toInviteSummary),
    storeMode,
  });
}

export async function POST(request: Request) {
  const authenticated = await hasAdminSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const label = sanitizeLabel(payload.label);
  const maxUses = sanitizeMaxUses(payload.maxUses);
  const expiresAt = sanitizeExpiresAt(payload.expiresAt);

  const { code, invite, storeMode } = await createInvite({
    label,
    maxUses,
    expiresAt,
  });

  return NextResponse.json({
    ok: true,
    code,
    invite: toInviteSummary(invite),
    storeMode,
  });
}

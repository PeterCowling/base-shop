import { NextResponse } from "next/server";

function parseAllowlistedIps(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function firstForwardedValue(raw: string | null): string {
  return (raw ?? "").split(",")[0]?.trim() ?? "";
}

export function getRequesterIpFromHeaders(headers: Headers): string {
  const cfConnectingIp = firstForwardedValue(headers.get("cf-connecting-ip"));
  if (cfConnectingIp) return cfConnectingIp;

  const forwarded = firstForwardedValue(headers.get("x-forwarded-for"));
  if (forwarded) return forwarded;

  return firstForwardedValue(headers.get("x-real-ip"));
}

export function isUploaderIpAllowedByHeaders(headers: Headers): boolean {
  const allowlisted = parseAllowlistedIps(process.env.XA_UPLOADER_ALLOWED_IPS);
  if (!allowlisted.size) return true;

  const requesterIp = getRequesterIpFromHeaders(headers);
  if (!requesterIp) return false;
  return allowlisted.has(requesterIp);
}

export function uploaderAccessDeniedJsonResponse(): NextResponse {
  return NextResponse.json({ ok: false }, { status: 404 });
}

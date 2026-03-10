import { NextResponse } from "next/server";

import { getTrustedRequestIpFromHeaders } from "./requestIp";

function parseAllowlistedIps(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

export function getRequesterIpFromHeaders(headers: Headers): string {
  return getTrustedRequestIpFromHeaders(headers);
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

import { NextResponse } from "next/server";

import { getTrustedRequestIpFromHeaders } from "./requestIp";
import { uploaderLog } from "./uploaderLogger";

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

/**
 * Module-level flag for once-per-process coherence warning deduplication.
 * When the allowlist is non-empty but XA_TRUST_PROXY_IP_HEADERS is disabled,
 * the IP check cannot extract real client IPs — all requests will be denied.
 * This warning fires once to avoid log spam on every request.
 */
let coherenceWarningEmitted = false;

/**
 * Check coherence between allowlist configuration and proxy trust headers.
 * Warns once per process if the allowlist is configured but proxy trust is disabled.
 */
function checkIpCoherence(allowlisted: Set<string>): void {
  if (coherenceWarningEmitted) return;
  if (!allowlisted.size) return;

  const trustProxy = process.env.XA_TRUST_PROXY_IP_HEADERS;
  if (trustProxy && trustProxy !== "0" && trustProxy !== "false") return;

  coherenceWarningEmitted = true;
  uploaderLog("warn", "security_coherence_mismatch", {
    message:
      "IP allowlist is configured but XA_TRUST_PROXY_IP_HEADERS is disabled. " +
      "All requests will be denied because client IPs cannot be extracted from proxy headers.",
    allowlistSize: allowlisted.size,
  });
}

/**
 * Test-only reset for coherence warning deduplication flag.
 * Allows tests to verify warning emission and deduplication behavior
 * without module-level flag persistence across test cases.
 */
export function _resetCoherenceWarningForTest(): void {
  if (process.env.NODE_ENV !== "test") return;
  coherenceWarningEmitted = false;
}

export function isUploaderIpAllowedByHeaders(headers: Headers): boolean {
  const allowlisted = parseAllowlistedIps(process.env.XA_UPLOADER_ALLOWED_IPS);

  // Deny-all when allowlist is not configured (empty or unset).
  // This is the primary security hardening: previously returned true (allow-all).
  if (!allowlisted.size) return false;

  checkIpCoherence(allowlisted);

  const requesterIp = getRequesterIpFromHeaders(headers);
  if (!requesterIp) return false;
  return allowlisted.has(requesterIp);
}

export function uploaderAccessDeniedJsonResponse(): NextResponse {
  return NextResponse.json({ ok: false }, { status: 404 });
}

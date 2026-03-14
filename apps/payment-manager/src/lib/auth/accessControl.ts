import { NextResponse } from "next/server";

import { pmLog } from "./pmLog";
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

/**
 * Module-level flag for once-per-process coherence warning deduplication.
 * When the allowlist is non-empty but PAYMENT_MANAGER_TRUST_PROXY_IP_HEADERS is disabled,
 * the IP check cannot extract real client IPs — all requests will be denied.
 * This warning fires once to avoid log spam on every request.
 */
let coherenceWarningEmitted = false;

/**
 * Module-level flag for once-per-process allowlist-unconfigured warning.
 * When PAYMENT_MANAGER_ALLOWED_IPS is unset or empty, every request is denied
 * with a silent 404. This warning fires once so fresh deployments are diagnosable.
 */
let allowlistUnconfiguredWarningEmitted = false;

/**
 * Check coherence between allowlist configuration and proxy trust headers.
 * Warns once per process if the allowlist is configured but proxy trust is disabled.
 */
function checkIpCoherence(allowlisted: Set<string>): void {
  if (coherenceWarningEmitted) return;
  if (!allowlisted.size) return;

  const trustProxy = process.env.PAYMENT_MANAGER_TRUST_PROXY_IP_HEADERS;
  if (trustProxy && trustProxy !== "0" && trustProxy !== "false") return;

  coherenceWarningEmitted = true;
  pmLog("warn", "security_coherence_mismatch", {
    message:
      "IP allowlist is configured but PAYMENT_MANAGER_TRUST_PROXY_IP_HEADERS is disabled. " +
      "All requests will be denied because client IPs cannot be extracted from proxy headers.",
    allowlistSize: allowlisted.size,
  });
}

/**
 * Test-only reset for coherence warning deduplication flags.
 */
export function _resetCoherenceWarningForTest(): void {
  if (process.env.NODE_ENV !== "test") return;
  coherenceWarningEmitted = false;
  allowlistUnconfiguredWarningEmitted = false;
}

/**
 * Returns true when the requester's IP is in the PAYMENT_MANAGER_ALLOWED_IPS list.
 * Deny-all when the env var is unset or empty.
 */
export function isPmIpAllowed(headers: Headers): boolean {
  const allowlisted = parseAllowlistedIps(process.env.PAYMENT_MANAGER_ALLOWED_IPS);

  // Deny-all when allowlist is not configured (empty or unset).
  // Warn once per process so fresh deployments are diagnosable — without this, the app
  // silently returns 404 for all requests with no indication of why.
  if (!allowlisted.size) {
    if (!allowlistUnconfiguredWarningEmitted) {
      allowlistUnconfiguredWarningEmitted = true;
      pmLog("warn", "ip_allowlist_unconfigured", {
        message: // i18n-exempt -- PM-0001 internal server log, not UI copy [ttl=2027-12-31]
          "PAYMENT_MANAGER_ALLOWED_IPS is not set - all requests will be denied. " +
          "Set this env var to one or more comma-separated IP addresses to allow access.",
      });
    }
    return false;
  }

  checkIpCoherence(allowlisted);

  const requesterIp = getRequesterIpFromHeaders(headers);
  if (!requesterIp) return false;
  return allowlisted.has(requesterIp);
}

export function pmAccessDeniedResponse(): NextResponse {
  return NextResponse.json({ ok: false }, { status: 404 });
}

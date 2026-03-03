import type { ReadonlyURLSearchParams } from "next/navigation";

import { isValidPax, isValidStayRange } from "@/utils/bookingDateRules";

export const RECOVERY_RESUME_TTL_DAYS = 7;
export const RECOVERY_CAPTURE_RETENTION_DAYS = 30;
export const RECOVERY_CONSENT_VERSION = "2026-03-01-email-recovery-v1";
export const RECOVERY_CAPTURE_STORE_KEY = "brikette.recovery_capture.v1";

export type RecoveryResumeState = "none" | "valid" | "expired" | "invalid";

export type RecoveryQuoteContext = {
  checkin: string;
  checkout: string;
  pax: number;
  source_route: string;
  room_id?: string;
  rate_plan?: "nr" | "flex";
};

export type StoredRecoveryCapture = RecoveryQuoteContext & {
  lead_capture_id: string;
  resume_link: string;
  resume_expires_at: string;
  recovery_channel: "email";
  consent_version: string;
  consent_granted_at: string;
  retention_expires_at: string;
};

type RecoveryResumeStatus = {
  state: RecoveryResumeState;
  expiresAtMs: number | null;
};

function readPositiveInt(raw: string | null): number | null {
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function buildRecoveryResumeLink(
  context: RecoveryQuoteContext,
  opts: { pathname: string; origin?: string; nowMs?: number } = {
    pathname: "/",
  },
): { resumeLink: string; resumeExpiresAt: string } {
  const nowMs = opts.nowMs ?? Date.now();
  const expiresAtMs = nowMs + RECOVERY_RESUME_TTL_DAYS * 24 * 60 * 60 * 1000;
  const origin =
    opts.origin ??
    (typeof window !== "undefined" ? window.location.origin : "https://hostel-positano.com");

  const url = new URL(opts.pathname, origin);
  url.searchParams.set("checkin", context.checkin);
  url.searchParams.set("checkout", context.checkout);
  url.searchParams.set("pax", String(context.pax));
  url.searchParams.set("rq_exp_ms", String(expiresAtMs));
  url.searchParams.set("rq_src", context.source_route);
  if (context.room_id) url.searchParams.set("rq_room", context.room_id);
  if (context.rate_plan) url.searchParams.set("rq_rate", context.rate_plan);

  return {
    resumeLink: url.toString(),
    resumeExpiresAt: new Date(expiresAtMs).toISOString(),
  };
}

export function readRecoveryResumeStatus(
  params: URLSearchParams | ReadonlyURLSearchParams | null,
  nowMs: number = Date.now(),
): RecoveryResumeStatus {
  if (!params) return { state: "none", expiresAtMs: null };
  const exp = readPositiveInt(params.get("rq_exp_ms"));
  if (!exp) return { state: "none", expiresAtMs: null };

  const checkin = params.get("checkin");
  const checkout = params.get("checkout");
  const pax = readPositiveInt(params.get("pax"));
  if (!checkin || !checkout || pax === null) {
    return { state: "invalid", expiresAtMs: exp };
  }
  if (!isValidStayRange(checkin, checkout) || !isValidPax(pax)) {
    return { state: "invalid", expiresAtMs: exp };
  }
  if (exp <= nowMs) {
    return { state: "expired", expiresAtMs: exp };
  }
  return { state: "valid", expiresAtMs: exp };
}

export function clearRecoveryResumeParams(
  params: URLSearchParams | ReadonlyURLSearchParams | null,
): URLSearchParams {
  const next = new URLSearchParams(params?.toString() ?? "");
  [
    "checkin",
    "checkout",
    "pax",
    "rq_exp_ms",
    "rq_src",
    "rq_room",
    "rq_rate",
  ].forEach((key) => next.delete(key));
  next.set("rebuild_quote", "1");
  return next;
}

export function persistRecoveryCapture(
  payload: StoredRecoveryCapture,
  opts: { storage?: Storage | null; maxEntries?: number } = {},
): void {
  const storage = opts.storage ?? (typeof window !== "undefined" ? window.localStorage : null);
  if (!storage) return;
  const maxEntries = opts.maxEntries ?? 20;
  try {
    const existingRaw = storage.getItem(RECOVERY_CAPTURE_STORE_KEY);
    const existing = existingRaw ? (JSON.parse(existingRaw) as StoredRecoveryCapture[]) : [];
    const next = [payload, ...existing].slice(0, maxEntries);
    storage.setItem(RECOVERY_CAPTURE_STORE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage write failures.
  }
}

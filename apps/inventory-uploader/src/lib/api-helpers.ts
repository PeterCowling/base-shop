import { NextResponse } from "next/server";

export const INVENTORY_LIMIT_MAX = 250;
export const INVENTORY_LIMIT_DEFAULT = 50;

export function parseSafeLimit(searchParams: URLSearchParams): number {
  const raw = Number(searchParams.get("limit") ?? String(INVENTORY_LIMIT_DEFAULT));
  return Number.isFinite(raw)
    ? Math.max(1, Math.min(INVENTORY_LIMIT_MAX, Math.floor(raw)))
    : INVENTORY_LIMIT_DEFAULT;
}

export function apiError(err: unknown, status = 500): NextResponse {
  const message = err instanceof Error ? err.message : "Unknown error";
  return NextResponse.json({ ok: false, error: message }, { status });
}

/** Extracts the `message` string from an API error response, or returns the fallback. */
export function getApiErrorMessage(json: unknown, fallback = "Request failed."): string {
  if (
    json &&
    typeof json === "object" &&
    "message" in json &&
    typeof (json as Record<string, unknown>).message === "string"
  ) {
    return (json as Record<string, unknown>).message as string;
  }
  return fallback;
}

// apps/brikette/src/utils/entryAttribution.ts
// Session-storage-first attribution carrier for the Brikette cohesive sales funnel.
// Persists click attribution across multi-step journeys (content page → compare → handoff).
// Incognito / private-browsing failure modes are handled silently — analytics degrade to
// click-only event, not an error.

const STORAGE_KEY = "_brik_attr" as const;

export interface EntryAttributionPayload {
  source_surface: string;
  source_cta: string;
  resolved_intent: string;
  product_type: string | null;
  decision_mode: string;
  destination_funnel: string;
  locale: string;
  fallback_triggered: boolean;
  next_page?: string | null;
  deal?: string;
}

/**
 * Write attribution to session storage (primary carrier).
 * Fails silently if session storage is unavailable (incognito, storage full, etc.).
 */
export function writeAttribution(payload: EntryAttributionPayload): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage access errors (incognito / QuotaExceededError / SecurityError).
  }
}

/**
 * Read attribution from session storage.
 * Returns null on any error or when no attribution has been written.
 * Must NOT be called on SSR (will always return null server-side).
 */
export function readAttribution(): EntryAttributionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") return null;
    return parsed as EntryAttributionPayload;
  } catch {
    return null;
  }
}

/**
 * Decorate a destination URL with attribution params as query-string fallback.
 * Use when session storage may be unavailable (incognito / cross-origin context).
 * Appends _bsrc (source_surface), _bint (resolved_intent), _bfun (destination_funnel).
 * Callers use this when constructing router.push or href targets.
 */
export function decorateUrlWithAttribution(
  url: string,
  payload: EntryAttributionPayload,
): string {
  try {
    const [base, existingQuery] = url.split("?");
    const params = new URLSearchParams(existingQuery ?? "");
    params.set("_bsrc", payload.source_surface);
    params.set("_bint", payload.resolved_intent);
    params.set("_bfun", payload.destination_funnel);
    return `${base}?${params.toString()}`;
  } catch {
    return url;
  }
}

/**
 * Clear attribution from session storage (call after handoff event emitted).
 * Fails silently on any storage error.
 */
export function clearAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage access errors.
  }
}

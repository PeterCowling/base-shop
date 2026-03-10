import type { ReadonlyURLSearchParams } from "next/navigation";

import { isValidPax, isValidStayRange } from "@/utils/bookingDateRules";

export type BookingSearch = {
  checkin: string;
  checkout: string;
  pax: number;
};

export type BookingSearchSource = "url" | "shared_store" | "empty";

export type BookingValidationError =
  | "invalid_stay_range"
  | "invalid_pax";

export type HydratedBookingSearch = {
  search: BookingSearch | null;
  source: BookingSearchSource;
  hasValidSearch: boolean;
  validationErrors: BookingValidationError[];
  store_expires_at: string | null;
};

export const BOOKING_SEARCH_STORE_KEY = "brikette.booking_search.v1";
export const BOOKING_SEARCH_TTL_MS = 30 * 60 * 1000;

type BookingSearchStorePayload = BookingSearch & {
  expires_at_ms: number;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

function parsePositiveInt(raw: string | null): number | null {
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseDate(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!ISO_DATE_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export function readBookingSearchFromUrl(
  params: URLSearchParams | ReadonlyURLSearchParams | null,
  paxKeys: string[] = ["pax", "guests", "adults"],
): BookingSearch | null {
  if (!params) return null;
  const checkin = parseDate(params.get("checkin"));
  const checkout = parseDate(params.get("checkout"));
  if (!checkin || !checkout) return null;

  let pax: number | null = null;
  for (const key of paxKeys) {
    pax = parsePositiveInt(params.get(key));
    if (pax !== null) break;
  }
  if (pax === null) return null;

  return { checkin, checkout, pax };
}

function validateBookingSearch(search: BookingSearch): {
  hasValidSearch: boolean;
  validationErrors: BookingValidationError[];
} {
  const validationErrors: BookingValidationError[] = [];
  if (!isValidStayRange(search.checkin, search.checkout)) {
    validationErrors.push("invalid_stay_range");
  }
  if (!isValidPax(search.pax)) {
    validationErrors.push("invalid_pax");
  }
  return {
    hasValidSearch: validationErrors.length === 0,
    validationErrors,
  };
}

export function persistBookingSearch(
  search: BookingSearch,
  opts: { ttlMs?: number; storage?: Storage | null } = {},
): void {
  const storage = opts.storage ?? (typeof window !== "undefined" ? window.localStorage : null);
  if (!storage) return;
  const ttlMs = opts.ttlMs ?? BOOKING_SEARCH_TTL_MS;
  const payload: BookingSearchStorePayload = {
    ...search,
    expires_at_ms: Date.now() + ttlMs,
  };
  try {
    storage.setItem(BOOKING_SEARCH_STORE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage write failures.
  }
}

export function clearBookingSearch(opts: { storage?: Storage | null } = {}): void {
  const storage = opts.storage ?? (typeof window !== "undefined" ? window.localStorage : null);
  if (!storage) return;
  try {
    storage.removeItem(BOOKING_SEARCH_STORE_KEY);
  } catch {
    // Ignore storage write failures.
  }
}

export function readBookingSearchFromStore(
  opts: { nowMs?: number; storage?: Storage | null } = {},
): { search: BookingSearch; store_expires_at: string } | null {
  const storage = opts.storage ?? (typeof window !== "undefined" ? window.localStorage : null);
  if (!storage) return null;
  const nowMs = opts.nowMs ?? Date.now();
  const raw = storage.getItem(BOOKING_SEARCH_STORE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<BookingSearchStorePayload>;
    const checkin = parseDate(typeof parsed.checkin === "string" ? parsed.checkin : null);
    const checkout = parseDate(typeof parsed.checkout === "string" ? parsed.checkout : null);
    const pax = Number.isFinite(parsed.pax) ? Number(parsed.pax) : null;
    const expiresAtMs = Number.isFinite(parsed.expires_at_ms) ? Number(parsed.expires_at_ms) : null;
    if (!checkin || !checkout || pax === null || expiresAtMs === null) return null;
    if (expiresAtMs <= nowMs) return null;
    return {
      search: { checkin, checkout, pax },
      store_expires_at: new Date(expiresAtMs).toISOString(),
    };
  } catch {
    return null;
  }
}

export function hydrateBookingSearch(
  params: URLSearchParams | ReadonlyURLSearchParams | null,
  opts: { nowMs?: number; storage?: Storage | null; paxKeys?: string[] } = {},
): HydratedBookingSearch {
  const fromUrl = readBookingSearchFromUrl(params, opts.paxKeys);
  if (fromUrl) {
    const validation = validateBookingSearch(fromUrl);
    return {
      search: fromUrl,
      source: "url",
      hasValidSearch: validation.hasValidSearch,
      validationErrors: validation.validationErrors,
      store_expires_at: null,
    };
  }

  const fromStore = readBookingSearchFromStore({ nowMs: opts.nowMs, storage: opts.storage });
  if (fromStore) {
    const validation = validateBookingSearch(fromStore.search);
    return {
      search: fromStore.search,
      source: "shared_store",
      hasValidSearch: validation.hasValidSearch,
      validationErrors: validation.validationErrors,
      store_expires_at: fromStore.store_expires_at,
    };
  }

  return {
    search: null,
    source: "empty",
    hasValidSearch: false,
    validationErrors: [],
    store_expires_at: null,
  };
}

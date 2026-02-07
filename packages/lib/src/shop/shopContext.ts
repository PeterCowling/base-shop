import type { EnvLabel } from "../context/types";

export const SHOP_ID_HEADER = "x-shop-id";
export const REQUEST_ID_HEADER = "x-request-id";

export type ShopContext = {
  shopId: string;
  requestId: string;
  environment: EnvLabel;
  host?: string;
  canonicalHost?: string;
  runtimeId?: string;
};

function newRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
}

export function getShopIdFromHeaders(headers: Headers): string | undefined {
  const raw = headers.get(SHOP_ID_HEADER);
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export function requireShopIdFromHeaders(headers: Headers): string {
  const shopId = getShopIdFromHeaders(headers);
  if (!shopId) {
    throw new Error("Missing shop context"); // i18n-exempt -- internal error message
  }
  return shopId;
}

export function getRequestIdFromHeaders(headers: Headers): string | undefined {
  const raw = headers.get(REQUEST_ID_HEADER);
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export function getOrCreateRequestId(headers: Headers): string {
  return getRequestIdFromHeaders(headers) ?? newRequestId();
}

export function stripSpoofableShopHeaders(headers: Headers): Headers {
  const next = new Headers(headers);
  next.delete(SHOP_ID_HEADER);
  return next;
}

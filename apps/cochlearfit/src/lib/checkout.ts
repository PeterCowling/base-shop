import { buildApiUrl } from "@/lib/api";
import type { CartItem } from "@/types/cart";
import type { CheckoutSessionResponse } from "@/types/checkout";
import type { Locale } from "@/types/locale";

export type CheckoutSessionRequest = {
  items: Array<Pick<CartItem, "variantId" | "quantity">>;
  locale: Locale;
};

export type CheckoutSessionCreateResponse = {
  id: string;
  url: string;
};

export async function createCheckoutSession(
  payload: CheckoutSessionRequest
): Promise<CheckoutSessionCreateResponse> {
  const response = await fetch(buildApiUrl("/api/checkout/session"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // i18n-exempt -- CF-1002 dev-only error message [ttl=2026-12-31]
    throw new Error("Failed to create checkout session");
  }

  return (await response.json()) as CheckoutSessionCreateResponse;
}

export async function fetchCheckoutSession(
  sessionId: string
): Promise<CheckoutSessionResponse> {
  const response = await fetch(buildApiUrl(`/api/checkout/session/${sessionId}`), {
    method: "GET",
  });

  if (!response.ok) {
    // i18n-exempt -- CF-1002 dev-only error message [ttl=2026-12-31]
    throw new Error("Failed to fetch checkout session");
  }

  return (await response.json()) as CheckoutSessionResponse;
}

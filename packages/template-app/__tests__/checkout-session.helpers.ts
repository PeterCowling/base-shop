// Small helper only: build Next.js request with cookie
import { CART_COOKIE } from "@acme/platform-core/cartCookie";
import { asNextJson } from "@acme/test-utils";

export function createRequest(
  body: any,
  cookie: string,
  url = "http://store.example/api/checkout-session",
  headers: Record<string, string> = {}
) {
  return asNextJson(body, { cookies: { [CART_COOKIE]: cookie }, url, headers });
}

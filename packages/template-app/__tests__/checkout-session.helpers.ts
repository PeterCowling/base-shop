// Small helper only: build Next.js request with cookie
import { asNextJson } from "@acme/test-utils";
import { CART_COOKIE } from "@platform-core/cartCookie";

export function createRequest(
  body: any,
  cookie: string,
  url = "http://store.example/api/checkout-session",
  headers: Record<string, string> = {}
) {
  return asNextJson(body, { cookies: { [CART_COOKIE]: cookie }, url, headers });
}

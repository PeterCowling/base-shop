import { jest } from "@jest/globals";
import { PRODUCTS } from "@platform-core/products";
import { POST as CART_POST } from "../../../../apps/shop-abc/src/app/api/cart/route";
import { POST as CHECKOUT_POST } from "../../../../apps/shop-abc/src/app/api/checkout-session/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

jest.mock("@/lib/stripeServer", () => ({
  __esModule: true,
  stripe: { checkout: { sessions: { create: jest.fn() } } },
}));

jest.mock("@platform-core/pricing", () => ({
  priceForDays: jest.fn(async () => 10),
}));

import { stripe } from "@/lib/stripeServer";
const stripeCreate = stripe.checkout.sessions.create as jest.Mock;

function cartReq(body: any, cookie?: string): Parameters<typeof CART_POST>[0] {
  return {
    json: async () => body,
    cookies: {
      get: (_: string) => (cookie ? { name: "c", value: cookie } : undefined),
    },
    nextUrl: Object.assign(new URL("http://test/api/cart"), {
      clone: () => new URL("http://test/api/cart"),
    }),
  } as any;
}

function checkoutReq(
  body: any,
  cookie: string
): Parameters<typeof CHECKOUT_POST>[0] {
  return {
    json: async () => body,
    cookies: { get: (_: string) => ({ name: "c", value: cookie }) },
    nextUrl: Object.assign(new URL("http://test/api/checkout-session"), {
      clone: () => new URL("http://test/api/checkout-session"),
    }),
  } as any;
}

afterEach(() => jest.resetAllMocks());

test("add to cart then create checkout session", async () => {
  const sku = PRODUCTS[0];
  const res = await CART_POST(cartReq({ sku, qty: 1 }));
  const header = res.headers.get("Set-Cookie")!;
  const cookie = header.split("=")[1].split(";")[0];

  await CHECKOUT_POST(checkoutReq({}, cookie));
  expect(stripeCreate).toHaveBeenCalled();
  const args = stripeCreate.mock.calls[0][0];
  expect(args.metadata.subtotal).toBe("10");
  expect(args.line_items).toHaveLength(2);
});

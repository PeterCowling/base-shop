// packages/template-app/__tests__/checkout-session.test.ts
import { encodeCartCookie, cartLineId } from "../../platform-core/src/cartCookie";
import { createCart, setCart } from "../../platform-core/src/cartStore";
import { PRODUCTS } from "../../platform-core/src/products";
import { calculateRentalDays } from "../../lib/src/date";
import { POST } from "../src/api/checkout-session/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

jest.mock("../../lib/src/stripeServer.server", () => ({
  stripe: { checkout: { sessions: { create: jest.fn() } } },
}));

jest.mock("../../platform-core/src/pricing", () => ({
  priceForDays: jest.fn(async () => 10),
  convertCurrency: jest.fn(async (v: number) => v),
}));

jest.mock("@upstash/redis", () => ({ Redis: class {} }));

import { stripe } from "../../lib/src/stripeServer.server";
const stripeCreate = stripe.checkout.sessions.create as jest.Mock;

function createRequest(
  body: any,
  cookie: string,
  url = "http://store.example/api/checkout-session"
): Parameters<typeof POST>[0] {
  return {
    json: async () => body,
    cookies: { get: () => ({ name: "", value: cookie }) },
    nextUrl: Object.assign(new URL(url), { clone: () => new URL(url) }),
  } as any;
}

test("builds Stripe session with correct items and metadata", async () => {
  jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  stripeCreate.mockResolvedValue({
    id: "sess_test",
    payment_intent: { client_secret: "cs_test" },
  });

  const sku = PRODUCTS[0];
  const id = cartLineId(sku.id, "40");
  const cart = { [id]: { sku, qty: 2, size: "40" } };
  const cartId = await createCart();
  await setCart(cartId, cart);
  const cookie = encodeCartCookie(cartId);
  const returnDate = "2025-01-02";
  const expectedDays = calculateRentalDays(returnDate);
  const req = createRequest({ returnDate }, cookie);

  const res = await POST(req);
  const body = await res.json();

  expect(stripeCreate).toHaveBeenCalled();
  const args = stripeCreate.mock.calls[0][0];

  expect(args.line_items).toHaveLength(2);
  expect(args.line_items[0].price_data.unit_amount).toBe(1000);
  expect(args.line_items[1].price_data.unit_amount).toBe(sku.deposit * 100);
  expect(args.metadata.rentalDays).toBe(expectedDays.toString());
  expect(args.metadata.sizes).toBe(JSON.stringify({ [sku.id]: "40" }));
  expect(args.metadata.subtotal).toBe("20");
  expect(body.clientSecret).toBe("cs_test");
});

test("returns 400 when returnDate is invalid", async () => {
  const sku = PRODUCTS[0];
  const id2 = cartLineId(sku.id);
  const cart = { [id2]: { sku, qty: 1 } };
  const cartId = await createCart();
  await setCart(cartId, cart);
  const cookie = encodeCartCookie(cartId);
  const req = createRequest({ returnDate: "invalid" }, cookie);
  const res = await POST(req);
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/invalid/i);
});

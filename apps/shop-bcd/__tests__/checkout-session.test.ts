// apps/shop-bcd/__tests__/checkout-session.test.ts
import { encodeCartCookie } from "@/lib/cartCookie";
import { PRODUCTS } from "@platform-core/products";
import { calculateRentalDays } from "@date-utils";
import { POST } from "../src/api/checkout-session/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

jest.mock("@stripe", () => ({
  stripe: { checkout: { sessions: { create: jest.fn() } } },
}));

jest.mock("@platform-core/pricing", () => ({
  priceForDays: jest.fn(async () => 10),
  convertCurrency: jest.fn(async (n: number) => n),
}));
jest.mock("@platform-core/tax", () => ({
  getTaxRate: jest.fn(async () => 0.2),
}));

import { stripe } from "@stripe";
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
  const size = "40";
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 2, size } };
  const cookie = encodeCartCookie(cart);
  const returnDate = "2025-01-02";
  const expectedDays = calculateRentalDays(returnDate);
  const req = createRequest({ returnDate, currency: "EUR", taxRegion: "EU" }, cookie);

  const res = await POST(req);
  const body = await res.json();

  expect(stripeCreate).toHaveBeenCalled();
  const args = stripeCreate.mock.calls[0][0];

  expect(args.line_items).toHaveLength(3);
  expect(args.line_items[0].price_data.unit_amount).toBe(1000);
  expect(args.line_items[1].price_data.unit_amount).toBe(sku.deposit * 100);
  expect(args.line_items[2].price_data.unit_amount).toBe(400);
  expect(args.metadata.rentalDays).toBe(expectedDays.toString());
  expect(args.metadata.sizes).toBe(JSON.stringify({ [sku.id]: size }));
  expect(args.metadata.subtotal).toBe("20");
  expect(body.clientSecret).toBe("cs_test");
});

test("responds with 400 on invalid returnDate", async () => {
  const sku = PRODUCTS[0];
  const size = sku.sizes[0];
  const cart = { [`${sku.id}:${size}`]: { sku, qty: 1, size } };
  const cookie = encodeCartCookie(cart);
  const req = createRequest({ returnDate: "not-a-date", currency: "EUR", taxRegion: "EU" }, cookie);
  const res = await POST(req);
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/invalid/i);
});


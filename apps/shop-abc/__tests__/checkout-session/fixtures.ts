import { encodeCartCookie } from "@platform-core/src/cartCookie";
import { PRODUCTS } from "@platform-core/products";
import * as dateUtils from "@acme/date-utils";
const { calculateRentalDays } = dateUtils;
import { POST } from "../../src/app/api/checkout-session/route";
import { findCoupon } from "@platform-core/coupons";
import { getTaxRate } from "@platform-core/tax";
import { ReadableStream } from "node:stream/web";
import { stripe } from "@acme/stripe";
import { convertCurrency } from "@platform-core/pricing";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

jest.mock("@acme/stripe", () => ({
  stripe: { checkout: { sessions: { create: jest.fn() } } },
}));

jest.mock("@platform-core/pricing", () => ({
  priceForDays: jest.fn(async () => 10),
  convertCurrency: jest.fn(async (n: number) => n),
}));

jest.mock("@platform-core/coupons", () => ({ findCoupon: jest.fn() }));
jest.mock("@platform-core/tax", () => ({ getTaxRate: jest.fn() }));

jest.mock("@upstash/redis", () => ({ Redis: class {} }));
jest.mock("@platform-core/analytics", () => ({ trackEvent: jest.fn() }));
jest.mock("@auth", () => ({
  requirePermission: jest.fn(async () => ({ customerId: "c1" })),
}));

let mockCart: any;
jest.mock("@platform-core/src/cartStore", () => ({
  getCart: jest.fn(async () => mockCart),
}));

const stripeCreate = stripe.checkout.sessions.create as jest.Mock;
const findCouponMock = findCoupon as jest.Mock;
const getTaxRateMock = getTaxRate as jest.Mock;
const convertCurrencyMock = convertCurrency as jest.Mock;

function createRequest(
  body: any,
  cookie: string,
  url = "http://store.example/api/checkout-session",
  headers: Record<string, string> = {},
): Parameters<typeof POST>[0] {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(JSON.stringify(body)));
      controller.close();
    },
  });
  return {
    json: async () => body,
    body: stream,
    cookies: { get: () => ({ name: "", value: cookie }) },
    nextUrl: Object.assign(new URL(url), { clone: () => new URL(url) }),
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
  } as any;
}

export {
  encodeCartCookie,
  PRODUCTS,
  dateUtils,
  calculateRentalDays,
  POST,
  stripeCreate,
  findCouponMock,
  getTaxRateMock,
  convertCurrencyMock,
  createRequest,
};

export function setMockCart(cart: any) {
  mockCart = cart;
}

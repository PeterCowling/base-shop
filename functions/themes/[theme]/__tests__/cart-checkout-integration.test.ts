import { jest } from "@jest/globals";

import { asNextJson } from "@acme/test-utils";

const CART_COOKIE = "__Host-CART_ID";
jest.doMock(
  "@acme/zod-utils/initZod",
  () => ({ initZod: () => {} }),
  { virtual: true },
);

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

jest.mock("@acme/stripe", () => ({
  __esModule: true,
  stripe: { checkout: { sessions: { create: jest.fn() } } },
}));

jest.doMock(
  "@acme/platform-core/cartCookie",
  () => ({
    __esModule: true,
    CART_COOKIE,
    encodeCartCookie: (v: string) => v,
    decodeCartCookie: (v: string | null | undefined) => v,
    asSetCookieHeader: (v: string) => `${CART_COOKIE}=${v}`,
  }),
  { virtual: true },
);

let mockCart: any = {};

jest.doMock(
  "@acme/platform-core/cartStore",
  () => ({
    __esModule: true,
    getCart: jest.fn(async () => mockCart),
  }),
  { virtual: true },
);

jest.mock("@acme/platform-core/pricing", () => ({
  priceForDays: jest.fn(async () => 10),
}));

jest.doMock(
  "@acme/auth",
  () => ({ getCustomerSession: jest.fn(async () => null) }),
  { virtual: true },
);

jest.doMock(
  "@acme/platform-core/checkout/session",
  () => ({
    createCheckoutSession: async (...args: any[]) => {
      const { stripe } = require("@acme/stripe");
      await stripe.checkout.sessions.create(...(args as any));
      return { url: "" };
    },
  }),
  { virtual: true },
);

const sku = {
  id: "sku1",
  slug: "sku1",
  title: "Test",
  price: 10,
  deposit: 0,
  stock: 5,
  forSale: true,
  forRental: true,
  media: [],
  sizes: ["M"],
};
jest.doMock(
  "@acme/platform-core/products",
  () => ({ PRODUCTS: [sku], getProductById: () => sku }),
  { virtual: true },
);

process.env.CART_COOKIE_SECRET = "secret";

const checkoutReq = (body: any, cookie: string) =>
  asNextJson(body, {
    cookies: { [CART_COOKIE]: cookie },
    url: "http://test/api/checkout-session",
  });

afterEach(() => {
  jest.resetAllMocks();
  mockCart = {};
});

test("add to cart then create checkout session", async () => {
  // Seed inventory for the test SKU
  const { prisma } = await import("@acme/platform-core/db");
  const size = sku.sizes[0];
  const variantKey = `${sku.id}#size:${size}`;
  await prisma.inventoryItem.upsert({
    where: {
      shopId_sku_variantKey: {
        shopId: "cover-me-pretty",
        sku: sku.id,
        variantKey,
      },
    },
    update: { quantity: 10, productId: sku.id },
    create: {
      shopId: "cover-me-pretty",
      sku: sku.id,
      variantKey,
      quantity: 10,
      productId: sku.id,
    },
  });

  const { POST: CHECKOUT_POST } = await import(
    "../../../../apps/cover-me-pretty/src/api/checkout-session/route"
  );
  mockCart = {
    [`${sku.id}${size ? ":" + size : ""}`]: { sku, size, qty: 1 },
  };
  const cookie = "cart-1";
  const response = await CHECKOUT_POST(
    checkoutReq(
      { returnDate: "2030-01-02", currency: "EUR", taxRegion: "EU" },
      cookie,
    ),
  );

  if (response.status !== 200) {
    const body = await response.json();
    // eslint-disable-next-line no-console -- diagnostic for CI debugging
    console.log("Checkout failed:", response.status, body);
  }

  expect(response.status).toBe(200);
  const { stripe } = await import("@acme/stripe");
  expect(stripe.checkout.sessions.create).toHaveBeenCalled();
});

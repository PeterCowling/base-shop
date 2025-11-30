import { jest } from "@jest/globals";
import { asNextJson } from "@acme/test-utils";
import { CART_COOKIE } from "@platform-core/cartCookie";
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

jest.mock("@platform-core/pricing", () => ({
  priceForDays: jest.fn(async () => 10),
}));

jest.doMock(
  "@auth",
  () => ({ getCustomerSession: jest.fn(async () => null) }),
  { virtual: true },
);

jest.doMock(
  "@platform-core/checkout/session",
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
  forRental: false,
  media: [],
  sizes: ["M"],
};
jest.doMock(
  "@platform-core/products",
  () => ({ PRODUCTS: [sku], getProductById: () => sku }),
  { virtual: true },
);

process.env.CART_COOKIE_SECRET = "secret";

const checkoutReq = (body: any, cookie: string) =>
  asNextJson(body, {
    cookies: { [CART_COOKIE]: cookie },
    url: "http://test/api/checkout-session",
  });

afterEach(() => jest.resetAllMocks());

test("add to cart then create checkout session", async () => {
  const { encodeCartCookie, CART_COOKIE } = await import(
    "@platform-core/cartCookie"
  );
  const { POST: CHECKOUT_POST } = await import(
    "../../../../apps/cover-me-pretty/src/api/checkout-session/route"
  );
  const size = sku.sizes[0];
  const cookie = encodeCartCookie(
    JSON.stringify({ [`${sku.id}${size ? ":" + size : ""}`]: { sku, size, qty: 1 } })
  );
  await CHECKOUT_POST(checkoutReq({}, cookie));
  const { stripe } = await import("@acme/stripe");
  expect(stripe.checkout.sessions.create).toHaveBeenCalled();
});

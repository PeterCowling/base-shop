// apps/shop-abc/__tests__/cmsPages.test.tsx

jest.mock("@platform-core/repositories/pages/index.server", () => ({
  __esModule: true,
  getPages: jest.fn(),
}));
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));
jest.mock("@upstash/redis", () => ({ Redis: class {} }));
jest.mock("@prisma/client", () => ({ PrismaClient: class {} }));
jest.mock("@platform-core/analytics", () => ({ trackPageView: jest.fn() }));
const cartDb: Record<string, any> = {};
jest.mock("@platform-core/cartStore", () => ({
  __esModule: true,
  createCart: jest.fn(async () => "test-cart"),
  setCart: jest.fn(async (id, cart) => {
    cartDb[id] = cart;
  }),
  getCart: jest.fn(async (id) => cartDb[id] ?? {}),
}));
jest.mock("@platform-core/cartCookie", () => ({
  __esModule: true,
  CART_COOKIE: "cookie",
  decodeCartCookie: (v: string) => v,
}));
jest.mock(
  "@/components/checkout/CheckoutForm",
  () => ({ __esModule: true, default: () => null }),
  { virtual: true }
);
jest.mock(
  "@/components/organisms/OrderSummary",
  () => ({ __esModule: true, default: () => null }),
  { virtual: true }
);
jest.mock(
  "@/i18n/useTranslations",
  () => ({
    useTranslations: async () => (key: string) =>
      key === "checkout.empty" ? "Your cart is empty." : key,
  }),
  { virtual: true }
);

import type { PageComponent } from "@acme/types";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import { getPages } from "@platform-core/repositories/pages/index.server";
import { cookies } from "next/headers";
import { PRODUCTS } from "@platform-core/products";

import ShopPage from "../src/app/[lang]/shop/page";
import ProductPage from "../src/app/[lang]/product/[slug]/page";
import CheckoutPage from "../src/app/[lang]/checkout/page";
import enMessages from "@i18n/en.json";

afterEach(() => {
  jest.clearAllMocks();
});

test("Shop page renders CMS components when published", async () => {
  const components: PageComponent[] = [
    { id: "c1", type: "HeroBanner" } as any,
  ];
  (getPages as jest.Mock).mockResolvedValue([
    { slug: "shop", status: "published", components },
  ]);

  const element = await ShopPage({ params: { lang: "en" } });

  expect(getPages).toHaveBeenCalledWith("abc");
  expect(element.type).toBe(DynamicRenderer);
  expect(element.props.components).toEqual(components);
});

test("Product page renders CMS components with product data", async () => {
  const components: PageComponent[] = [
    { id: "c1", type: "HeroBanner" } as any,
  ];
  (getPages as jest.Mock).mockResolvedValue([
    { slug: "product/green-sneaker", status: "published", components },
  ]);

  const element = await ProductPage({
    params: { lang: "en", slug: "green-sneaker" },
  });

  expect(getPages).toHaveBeenCalledWith("abc");
  expect(element.type).toBe(DynamicRenderer);
  expect(
    element.props.runtimeData?.ProductDetailTemplate?.product?.slug
  ).toBe("green-sneaker");
});

test("Checkout page renders CMS components with cart data", async () => {
  const components: PageComponent[] = [
    { id: "c1", type: "HeroBanner" } as any,
  ];
  (getPages as jest.Mock).mockResolvedValue([
    { slug: "checkout", status: "published", components },
  ]);

  const cart = { [PRODUCTS[0].id]: { sku: PRODUCTS[0], qty: 1 } };
  const cartId = "test-cart";
  cartDb[cartId] = cart;
  (cookies as jest.Mock).mockResolvedValue({
    get: (name: string) => (name === "cookie" ? { value: cartId } : undefined),
  });

  const element = await CheckoutPage({
    params: Promise.resolve({ lang: "en" }),
  });

  expect(getPages).toHaveBeenCalledWith("abc");
  expect(element.type).toBe(DynamicRenderer);
  expect(element.props.runtimeData?.OrderSummary?.cart).toEqual(cart);
});

test("Checkout page shows empty cart message", async () => {
  (getPages as jest.Mock).mockResolvedValue([]);
  (cookies as jest.Mock).mockResolvedValue({ get: () => undefined });

  const element = await CheckoutPage({
    params: Promise.resolve({ lang: "en" }),
  });

  expect(element.type).toBe("p");
  expect(element.props.children).toBe(enMessages["checkout.empty"]);
});


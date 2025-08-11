// apps/shop-abc/__tests__/cmsPages.test.tsx

jest.mock("@platform-core/repositories/pages/index.server", () => ({
  __esModule: true,
  getPages: jest.fn(),
}));
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

import type { PageComponent } from "@types";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import { getPages } from "@platform-core/repositories/pages/index.server";
import { cookies } from "next/headers";
import { encodeCartCookie } from "@platform-core/src/cartCookie";
import { createCart, setCart } from "@platform-core/src/cartStore";
import { PRODUCTS } from "@platform-core/products";

import ShopPage from "../src/app/[lang]/shop/page";
import ProductPage from "../src/app/[lang]/product/[slug]/page";
import CheckoutPage from "../src/app/[lang]/checkout/page";

afterEach(() => {
  jest.resetAllMocks();
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
  const cartId = await createCart();
  await setCart(cartId, cart);
  (cookies as jest.Mock).mockResolvedValue({
    get: () => ({ value: encodeCartCookie(cartId) }),
  });

  const element = await CheckoutPage({
    params: Promise.resolve({ lang: "en" }),
  });

  expect(getPages).toHaveBeenCalledWith("abc");
  expect(element.type).toBe(DynamicRenderer);
  expect(element.props.runtimeData?.OrderSummary?.cart).toEqual(cart);
});


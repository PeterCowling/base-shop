jest.mock("@platform-core/repositories/pages/index.server", () => ({
  __esModule: true,
  getPages: jest.fn(),
}));
jest.mock("@ui/components/DynamicRenderer", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));
jest.mock("@/components/checkout/CheckoutForm", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));
jest.mock("@/components/organisms/OrderSummary", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

import type { PageComponent, SKU } from "@types";
import { PRODUCTS } from "@/lib/products";
import { CART_COOKIE, encodeCartCookie } from "@/lib/cartCookie";
import ShopPage from "../src/app/[lang]/shop/page";
import ProductPage from "../src/app/[lang]/product/[slug]/page";
import CheckoutPage from "../src/app/[lang]/checkout/page";
import { getPages } from "@platform-core/repositories/pages/index.server";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import { cookies } from "next/headers";

const mockedGetPages = getPages as jest.Mock;
const MockedRenderer = DynamicRenderer as jest.Mock;
const mockedCookies = cookies as jest.Mock;

describe("CMS-driven layouts", () => {
  beforeEach(() => {
    mockedGetPages.mockReset();
    MockedRenderer.mockClear();
    mockedCookies.mockReset();
  });

  test("shop page uses CMS components when available", async () => {
    const components: PageComponent[] = [
      { id: "c1", type: "HeroBanner" } as any,
    ];
    mockedGetPages.mockResolvedValue([
      { slug: "shop", status: "published", components },
    ]);

    const element = await ShopPage({ params: { lang: "en" } });

    expect(mockedGetPages).toHaveBeenCalledWith("abc");
    expect(element.type).toBe(DynamicRenderer);
    expect(element.props.components).toEqual(components);
    expect(element.props.data).toEqual({
      locale: "en",
      products: PRODUCTS as SKU[],
    });
  });

  test("product page injects product into CMS components", async () => {
    const components: PageComponent[] = [
      { id: "c1", type: "HeroBanner" } as any,
    ];
    mockedGetPages.mockResolvedValue([
      {
        slug: "product/green-sneaker",
        status: "published",
        components,
      },
    ]);

    const element = await ProductPage({
      params: { lang: "en", slug: "green-sneaker" },
    });

    expect(mockedGetPages).toHaveBeenCalledWith("abc");
    expect(element.type).toBe(DynamicRenderer);
    expect(element.props.components).toEqual(components);
    expect(element.props.data.locale).toBe("en");
    expect(element.props.data.product.slug).toBe("green-sneaker");
  });

  test("checkout page passes cart state", async () => {
    const components: PageComponent[] = [
      { id: "c1", type: "HeroBanner" } as any,
    ];
    mockedGetPages.mockResolvedValue([
      { slug: "checkout", status: "published", components },
    ]);

    const cart = { [PRODUCTS[0].id]: { sku: PRODUCTS[0], qty: 1 } } as Record<string, any>;
    const cookieValue = encodeCartCookie(cart);
    mockedCookies.mockResolvedValue({
      get: (name: string) =>
        name === CART_COOKIE ? { value: cookieValue } : undefined,
    });

    const element = await CheckoutPage({
      params: Promise.resolve({ lang: "en" }),
    });

    expect(mockedGetPages).toHaveBeenCalledWith("abc");
    expect(element.type).toBe(DynamicRenderer);
    expect(element.props.components).toEqual(components);
    expect(element.props.data.locale).toBe("en");
    expect(element.props.data.cart).toEqual(cart);
  });
});

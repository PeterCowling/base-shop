import type { PageComponent } from "@types";
import { PRODUCTS, getProductBySlug } from "@/lib/products";

jest.mock("@platform-core/repositories/pages/index.server", () => ({
  __esModule: true,
  getPages: jest.fn(),
}));

jest.mock("@ui/components/DynamicRenderer", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("@/components/checkout/CheckoutForm", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("@/components/organisms/OrderSummary", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

jest.mock("@/lib/cartCookie", () => ({
  CART_COOKIE: "cart",
  decodeCartCookie: jest.fn(() => ({ sku1: 1 })),
}));

jest.mock("../src/app/[lang]/shop/ShopClient.client", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("../src/app/[lang]/product/[slug]/PdpClient.client", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

import DynamicRenderer from "@ui/components/DynamicRenderer";
import { getPages } from "@platform-core/repositories/pages/index.server";
import ShopPage from "../src/app/[lang]/shop/page";
import ProductPage from "../src/app/[lang]/product/[slug]/page";
import CheckoutPage from "../src/app/[lang]/checkout/page";
import ShopClient from "../src/app/[lang]/shop/ShopClient.client";
import PdpClient from "../src/app/[lang]/product/[slug]/PdpClient.client";
import { cookies } from "next/headers";

describe("CMS integration", () => {
  beforeEach(() => {
    (getPages as jest.Mock).mockReset();
    (DynamicRenderer as jest.Mock).mockClear();
    (ShopClient as jest.Mock).mockClear();
    (PdpClient as jest.Mock).mockClear();
    (cookies as jest.Mock).mockResolvedValue({ get: () => ({ value: "cookie" }) });
  });

  test("shop page renders CMS components", async () => {
    const components: PageComponent[] = [
      { id: "c1", type: "Text", text: { en: "hi" } } as any,
    ];
    (getPages as jest.Mock).mockResolvedValue([{ slug: "shop", components }]);

    const element = await ShopPage({
      params: Promise.resolve({ lang: "en" }),
    } as any);

    expect(getPages).toHaveBeenCalledWith("abc");
    expect(element.type).toBe(DynamicRenderer);
    expect(element.props).toEqual({
      components,
      locale: "en",
      runtimeData: { skus: PRODUCTS },
    });
  });

  test("shop page falls back without CMS components", async () => {
    (getPages as jest.Mock).mockResolvedValue([]);
    const el = await ShopPage({ params: Promise.resolve({ lang: "en" }) } as any);

    expect(DynamicRenderer).not.toHaveBeenCalled();
    expect(el.type).toBe(ShopClient);
  });

  test("product page renders CMS components", async () => {
    const slug = "green-sneaker";
    const components: PageComponent[] = [
      { id: "c1", type: "Text", text: { en: "hi" } } as any,
    ];
    (getPages as jest.Mock).mockResolvedValue([
      { slug: `product/${slug}`, components },
    ]);

    const element = await ProductPage({
      params: Promise.resolve({ lang: "en", slug }),
    } as any);

    expect(element.type).toBe(DynamicRenderer);
    expect(element.props).toEqual({
      components,
      locale: "en",
      runtimeData: { product: getProductBySlug(slug)! },
    });
  });

  test("checkout page renders CMS components", async () => {
    const components: PageComponent[] = [
      { id: "c1", type: "Text", text: { en: "hi" } } as any,
    ];
    (getPages as jest.Mock).mockResolvedValue([
      { slug: "checkout", components },
    ]);

    const element = await CheckoutPage({
      params: Promise.resolve({ lang: "en" }),
    } as any);

    expect(element.type).toBe(DynamicRenderer);
    expect(element.props).toEqual({
      components,
      locale: "en",
      runtimeData: { cart: { sku1: 1 } },
    });
  });
});

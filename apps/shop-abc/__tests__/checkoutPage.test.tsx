// apps/shop-abc/__tests__/checkoutPage.test.tsx
jest.mock("@platform-core/repositories/pages/index.server", () => ({
  __esModule: true,
  getPages: jest.fn(),
}));
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));
jest.mock("@/lib/cartCookie", () => ({
  CART_COOKIE: "cart",
  decodeCartCookie: jest.fn(() => ({ item: {} })),
}));

import type { PageComponent } from "@types";
import Page from "../src/app/[lang]/checkout/page";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import { getPages } from "@platform-core/repositories/pages/index.server";
import { cookies } from "next/headers";

it("renders checkout with CMS layout when available", async () => {
  const components: PageComponent[] = [{ id: "c1", type: "Text" } as any];
  (getPages as jest.Mock).mockResolvedValue([
    { slug: "checkout", status: "published", components },
  ]);
  (cookies as jest.Mock).mockResolvedValue({
    get: () => ({ value: "cookie" }),
  });

  const element = await Page({ params: Promise.resolve({ lang: "en" }) });

  expect(getPages).toHaveBeenCalledWith("abc");
  expect(element.type).toBe(DynamicRenderer);
  expect(element.props.components).toEqual(components);
  expect(element.props.locale).toBe("en");
  expect(element.props.data.cart).toEqual({ item: {} });
});

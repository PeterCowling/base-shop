// apps/shop-abc/__tests__/homePage.test.tsx
jest.mock("@platform-core/repositories/pages/index.server", () => ({
  __esModule: true,
  getPages: jest.fn(),
}));
jest.mock("@platform-core/repositories/shops.server", () => ({
  __esModule: true,
  readShop: jest.fn(),
}));
jest.mock("@platform-core/analytics", () => ({
  trackPageView: jest.fn(),
}));
jest.mock("@acme/sanity", () => ({
  fetchPublishedPosts: jest.fn(),
}));
jest.mock("@acme/config", () => ({ env: { NEXT_PUBLIC_SHOP_ID: "abc" } }));
jest.mock("../src/app/[lang]/page.client", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

import type { PageComponent } from "@acme/types";
import Page from "../src/app/[lang]/page";
import Home from "../src/app/[lang]/page.client";
import { getPages } from "@platform-core/repositories/pages/index.server";
import { readShop } from "@platform-core/repositories/shops.server";
import { fetchPublishedPosts } from "@acme/sanity";

test("Home receives components from pages repo", async () => {
  const components: PageComponent[] = [
    { id: "c1", type: "HeroBanner" } as any,
  ];
  (getPages as jest.Mock).mockResolvedValue([
    { slug: "home", components } as any,
  ]);
  (readShop as jest.Mock).mockResolvedValue({
    id: "abc",
    editorialBlog: { enabled: true },
    luxuryFeatures: { contentMerchandising: true },
  });
  (fetchPublishedPosts as jest.Mock).mockResolvedValue([]);

  const element = await Page({ params: { lang: "en" } });

  expect(getPages).toHaveBeenCalledWith("abc");
  expect(fetchPublishedPosts).toHaveBeenCalledWith("abc");
  expect(element.type).toBe(Home);
  expect(element.props.components).toEqual(components);
  expect(element.props.locale).toBe("en");
});

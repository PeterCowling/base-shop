// apps/shop-abc/__tests__/homePage.test.tsx
jest.mock("@platform-core/repositories/pages/index.server", () => ({
  __esModule: true,
  getPages: jest.fn(),
}));
jest.mock("../src/app/[lang]/page.client", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

import type { PageComponent } from "@types";
import Page from "../src/app/[lang]/page";
import Home from "../src/app/[lang]/page.client";
import { getPages } from "@platform-core/repositories/pages/index.server";

test("Home receives components from pages repo", async () => {
  const components: PageComponent[] = [
    { id: "c1", type: "HeroBanner" } as any,
  ];
  (getPages as jest.Mock).mockResolvedValue([
    { slug: "home", components } as any,
  ]);

  const element = await Page();

  expect(getPages).toHaveBeenCalledWith("abc");
  expect(element.type).toBe(Home);
  expect(element.props.components).toEqual(components);
});

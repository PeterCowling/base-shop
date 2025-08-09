// apps/shop-abc/__tests__/shopPage.test.tsx
jest.mock("@platform-core/repositories/pages/index.server", () => ({
  __esModule: true,
  getPages: jest.fn(),
}));

import type { PageComponent } from "@types";
import Page from "../src/app/[lang]/shop/page";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import { getPages } from "@platform-core/repositories/pages/index.server";

it("renders CMS components when present", async () => {
  const components: PageComponent[] = [{ id: "c1", type: "Text" } as any];
  (getPages as jest.Mock).mockResolvedValue([
    { slug: "shop", status: "published", components },
  ]);

  const element = await Page({ params: { lang: "en" } });

  expect(getPages).toHaveBeenCalledWith("abc");
  expect(element.type).toBe(DynamicRenderer);
  expect(element.props.components).toEqual(components);
  expect(element.props.locale).toBe("en");
});

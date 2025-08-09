// apps/shop-abc/__tests__/productPage.test.tsx
jest.mock("@platform-core/repositories/pages/index.server", () => ({
  __esModule: true,
  getPages: jest.fn(),
}));

import type { PageComponent } from "@types";
import Page from "../src/app/[lang]/product/[slug]/page";
import DynamicRenderer from "@ui/components/DynamicRenderer";
import { getPages } from "@platform-core/repositories/pages/index.server";

it("renders product with CMS layout when available", async () => {
  const components: PageComponent[] = [{ id: "c1", type: "Text" } as any];
  (getPages as jest.Mock).mockResolvedValue([
    { slug: "product/green-sneaker", status: "published", components },
  ]);

  const element = await Page({ params: { lang: "en", slug: "green-sneaker" } });

  expect(getPages).toHaveBeenCalledWith("abc");
  expect(element.type).toBe(DynamicRenderer);
  expect(element.props.components).toEqual(components);
  expect(element.props.locale).toBe("en");
  expect(element.props.data.product.slug).toBe("green-sneaker");
});

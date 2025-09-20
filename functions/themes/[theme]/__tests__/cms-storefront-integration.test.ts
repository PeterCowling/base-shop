import { jest } from "@jest/globals";
import { createHmac } from "node:crypto";
import { nowIso } from "@date-utils";

import type { Page } from "@acme/types";


async function withRepo(
  cb: (
    repo: typeof import("@platform-core/repositories/pages")
  ) => Promise<void>
) {
  jest.resetModules();
  const pages: Page[] = [];
  const repo = {
    async getPages(_: string) {
      return pages;
    },
    async savePage(_: string, page: Page) {
      pages.push(page);
      return page;
    },
    async updatePage(
      _: string,
      patch: Partial<Page> & { id: string; updatedAt: string },
      previous: Page,
    ) {
      const idx = pages.findIndex((p) => p.id === patch.id);
      if (idx === -1) throw new Error(`Page ${patch.id} not found`);
      pages[idx] = {
        ...previous,
        ...patch,
        updatedAt: nowIso(),
      } as Page;
      return pages[idx];
    },
  };
  jest.doMock(
    "@platform-core/repositories/pages",
    () => ({ __esModule: true, ...repo }),
    { virtual: true },
  );
  jest.doMock(
    "@platform-core/repositories/pages/index.server",
    () => ({ __esModule: true, ...repo }),
    { virtual: true },
  );
  jest.doMock(
    "@acme/zod-utils/initZod",
    () => ({ initZod: () => {} }),
    { virtual: true },
  );
  await cb(repo as any);
}

function tokenFor(id: string): string {
  return createHmac("sha256", "secret").update(id).digest("hex");
}

describe("CMS → storefront flow", () => {
  beforeAll(() => {
    process.env.PREVIEW_TOKEN_SECRET = "secret";
    process.env.NEXT_PUBLIC_SHOP_ID = "demo";
  });

  test("published page is returned via preview route", async () => {
    await withRepo(async (repo) => {
      const now = nowIso();
      const page: Page = {
        id: "p1",
        slug: "home",
        status: "draft",
        components: [{ id: "c1", type: "HeroBanner" }],
        seo: { title: "Home" },
        createdAt: now,
        updatedAt: now,
        createdBy: "tester",
      };
      await repo.savePage("demo", page, undefined);
      await repo.updatePage(
        "demo",
        {
          id: page.id,
          updatedAt: page.updatedAt,
          status: "published",
        } as any,
        page as any
      );

      const { onRequest } = await import(
        "../../../../apps/shop-bcd/src/routes/preview/[pageId].ts"
      );
      const res = await onRequest({
        params: { pageId: "p1" },
        request: new Request(`http://test?token=${tokenFor("p1")}`),
      } as any);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("published");
      expect(body.id).toBe("p1");
    });
  });
});

import { jest } from "@jest/globals";
import type { Page } from "@acme/types";
import { nowIso } from "@date-utils";

process.env.PREVIEW_TOKEN_SECRET = "testsecret";
process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "testsecret";
process.env.NEXT_PUBLIC_SHOP_ID = "shop";

if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

afterEach(() => jest.resetModules());

test("valid token returns page JSON", async () => {
  const page: Page = {
    id: "1",
    slug: "home",
    status: "draft",
    components: [],
    seo: { title: { en: "Home" } },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    createdBy: "tester",
  };
  const getPages = jest.fn(async () => [page]);
  jest.doMock("@platform-core/repositories/pages/index.server", () => ({
    __esModule: true,
    getPages,
  }));
  jest.doMock("@auth", () => ({ __esModule: true, requirePermission: jest.fn() }));
  jest.doMock("@acme/config", () => ({
    __esModule: true,
    env: {
      PREVIEW_TOKEN_SECRET: "testsecret",
      UPGRADE_PREVIEW_TOKEN_SECRET: "testsecret",
      NEXT_PUBLIC_SHOP_ID: "shop",
    },
  }));

  const { GET: tokenGET } = await import("../../src/app/api/preview-token/route");
  const tokenRes = await tokenGET(new Request("http://test?pageId=1") as any);
  const { token } = (await tokenRes.json()) as { token: string };

  const { onRequest } = await import("../../src/routes/preview/[pageId]");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request(`http://test?token=${token}`),
  } as any);

  expect(res.status).toBe(200);
  expect(await res.json()).toEqual(page);
});


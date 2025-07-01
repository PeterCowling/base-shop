import { jest } from "@jest/globals";
import { createHmac } from "node:crypto";
import type { Page } from "../../types/src/Page";

process.env.PREVIEW_TOKEN_SECRET = "testsecret";
process.env.NEXT_PUBLIC_SHOP_ID = "shop";

if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

afterEach(() => jest.resetModules());

function tokenFor(id: string): string {
  return createHmac("sha256", "testsecret").update(id).digest("hex");
}

test("valid token returns page JSON", async () => {
  const page: Page = {
    id: "1",
    slug: "home",
    status: "draft",
    components: [],
    seo: { title: "Home" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "tester",
  };
  const getPages = jest.fn(async () => [page]);
  jest.doMock("@platform-core/repositories/pages/index.server", () => ({
    __esModule: true,
    getPages,
  }));

  const { onRequest } = await import("../src/routes/preview/[pageId].ts");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request(`http://test?token=${tokenFor("1")}`),
  } as any);

  expect(res.status).toBe(200);
  expect(await res.json()).toEqual(page);
});

test("invalid token yields 401", async () => {
  const getPages = jest.fn(async () => []);
  jest.doMock("@platform-core/repositories/pages/index.server", () => ({
    __esModule: true,
    getPages,
  }));

  const { onRequest } = await import("../src/routes/preview/[pageId].ts");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request("http://test?token=bad"),
  } as any);

  expect(res.status).toBe(401);
});

test("valid token with missing page yields 404", async () => {
  const getPages = jest.fn(async () => [] as Page[]);
  jest.doMock("@platform-core/repositories/pages", () => ({
    __esModule: true,
    getPages,
  }));

  const { onRequest } = await import("../src/routes/preview/[pageId].ts");
  const res = await onRequest({
    params: { pageId: "2" },
    request: new Request(`http://test?token=${tokenFor("2")}`),
  } as any);

  expect(res.status).toBe(404);
});

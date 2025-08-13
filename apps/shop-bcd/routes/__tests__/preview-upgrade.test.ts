import { jest } from "@jest/globals";
import { createHmac } from "node:crypto";
import type { Page } from "@acme/types";

process.env.PREVIEW_TOKEN_SECRET = "testsecret";
process.env.NEXT_PUBLIC_SHOP_ID = "shop";

if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

afterEach(() => jest.resetModules());

function upgradeToken(id: string): string {
  return createHmac("sha256", "testsecret").update(`upgrade:${id}`).digest("hex");
}

test("valid upgrade token returns page JSON", async () => {
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
  jest.doMock("@acme/config", () => ({
    __esModule: true,
    env: {
      PREVIEW_TOKEN_SECRET: "testsecret",
      NEXT_PUBLIC_SHOP_ID: "shop",
    },
  }));

  const { onRequest } = await import("../../src/routes/preview/(pageId].ts");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request(`http://test?upgrade=${upgradeToken("1")}`),
  } as any);

  expect(res.status).toBe(200);
  expect(await res.json()).toEqual(page);
});

test("invalid upgrade token yields 401", async () => {
  const getPages = jest.fn(async () => []);
  jest.doMock("@platform-core/repositories/pages/index.server", () => ({
    __esModule: true,
    getPages,
  }));
  jest.doMock("@acme/config", () => ({
    __esModule: true,
    env: {
      PREVIEW_TOKEN_SECRET: "testsecret",
      NEXT_PUBLIC_SHOP_ID: "shop",
    },
  }));

  const { onRequest } = await import("../../src/routes/preview/(pageId].ts");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request("http://test?upgrade=bad"),
  } as any);

  expect(res.status).toBe(401);
});

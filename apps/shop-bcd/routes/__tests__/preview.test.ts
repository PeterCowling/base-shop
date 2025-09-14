import { jest } from "@jest/globals";
import type { Page } from "@acme/types";
import { createHmac } from "node:crypto";
import { nowIso } from "@date-utils";

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
  jest.doMock("@acme/config/env/core", () => {
    const env = {
      PREVIEW_TOKEN_SECRET: "testsecret",
      NEXT_PUBLIC_SHOP_ID: "shop",
    };
    return { __esModule: true, coreEnv: env, loadCoreEnv: () => env };
  });

  const { onRequest } = await import("../../src/routes/preview/[pageId]");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request(`http://test?token=${tokenFor("1")}`),
  } as any);

  expect(res.status).toBe(200);
  expect(await res.json()).toEqual(page);
});

test("missing page yields 404", async () => {
  const getPages = jest.fn(async () => []);
  jest.doMock("@platform-core/repositories/pages/index.server", () => ({
    __esModule: true,
    getPages,
  }));
  jest.doMock("@acme/config/env/core", () => {
    const env = {
      PREVIEW_TOKEN_SECRET: "testsecret",
      NEXT_PUBLIC_SHOP_ID: "shop",
    };
    return { __esModule: true, coreEnv: env, loadCoreEnv: () => env };
  });

  const { onRequest } = await import("../../src/routes/preview/[pageId]");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request(`http://test?token=${tokenFor("1")}`),
  } as any);

  expect(res.status).toBe(404);
});

test("invalid token yields 401", async () => {
  const getPages = jest.fn(async () => []);
  jest.doMock("@platform-core/repositories/pages/index.server", () => ({
    __esModule: true,
    getPages,
  }));
  jest.doMock("@acme/config/env/core", () => {
    const env = {
      PREVIEW_TOKEN_SECRET: "testsecret",
      NEXT_PUBLIC_SHOP_ID: "shop",
    };
    return { __esModule: true, coreEnv: env, loadCoreEnv: () => env };
  });

  const { onRequest } = await import("../../src/routes/preview/[pageId]");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request(`http://test?token=bad`),
  } as any);

  expect(res.status).toBe(401);
});


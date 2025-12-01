import { jest } from "@jest/globals";
import type { Page } from "@acme/types";
import { nowIso } from "@date-utils";
import { createPreviewToken } from "@platform-core/previewTokens";

process.env.PREVIEW_TOKEN_SECRET = "testsecret";
process.env.NEXT_PUBLIC_SHOP_ID = "shop";


afterEach(() => jest.resetModules());

type PreviewOnRequest = (ctx: {
  params: { pageId: string };
  request: Request;
}) => Promise<Response>;

function tokenFor(id: string): string {
  return createPreviewToken(
    { shopId: "shop", pageId: id },
    "testsecret",
  );
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
  const handlePreview = onRequest as unknown as PreviewOnRequest;
  const res = await handlePreview({
    params: { pageId: "1" },
    request: new Request(`http://test?token=${tokenFor("1")}`),
  });

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
  const handlePreview = onRequest as unknown as PreviewOnRequest;
  const res = await handlePreview({
    params: { pageId: "1" },
    request: new Request(`http://test?token=${tokenFor("1")}`),
  });

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
  const handlePreview = onRequest as unknown as PreviewOnRequest;
  const res = await handlePreview({
    params: { pageId: "1" },
    request: new Request(`http://test?token=bad`),
  });

  expect(res.status).toBe(401);
});

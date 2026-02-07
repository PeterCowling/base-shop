import { jest } from "@jest/globals";
import type { Page } from "@acme/types";
import { nowIso } from "@acme/date-utils";
import { createUpgradePreviewToken } from "@acme/platform-core/previewTokens";

process.env.PREVIEW_TOKEN_SECRET = "testsecret";
process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "upgradesecret";
process.env.NEXT_PUBLIC_SHOP_ID = "shop";

jest.mock("@acme/config/env/core", () => {
  const env = {
    PREVIEW_TOKEN_SECRET: "testsecret",
    UPGRADE_PREVIEW_TOKEN_SECRET: "upgradesecret",
    NEXT_PUBLIC_SHOP_ID: "shop",
  };
  return { coreEnv: env, loadCoreEnv: () => env };
});

jest.mock("@acme/config/env/auth", () => {
  const env = { UPGRADE_PREVIEW_TOKEN_SECRET: "upgradesecret" };
  return { authEnv: env, loadAuthEnv: () => env };
});


afterEach(() => jest.resetModules());

type PreviewOnRequest = (ctx: {
  params: { pageId: string };
  request: Request;
}) => Promise<Response>;

test("valid upgrade token returns page JSON", async () => {
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
  jest.doMock("@acme/platform-core/repositories/pages/index.server", () => ({
    __esModule: true,
    getPages,
  }));
  jest.doMock("@acme/auth", () => ({
    __esModule: true,
    requirePermission: jest.fn(),
  }));

  const { GET: tokenGET } = await import(
    "../../src/app/api/preview-token/route"
  );
  const tokenRes = await tokenGET(
    new Request("http://test?pageId=1"),
  );
  const { token } = await tokenRes.json();

  const { onRequest } = await import("../../src/routes/preview/[pageId]");
  const handlePreview = onRequest as unknown as PreviewOnRequest;
  const res = await handlePreview({
    params: { pageId: "1" },
    request: new Request(`http://test?upgrade=${token}`),
  });

  expect(res.status).toBe(200);
  expect(await res.json()).toEqual(page);
});

test("invalid upgrade token yields 401", async () => {
  const getPages = jest.fn(async () => []);
  jest.doMock("@acme/platform-core/repositories/pages/index.server", () => ({
    __esModule: true,
    getPages,
  }));

  const { onRequest } = await import("../../src/routes/preview/[pageId]");
  const handlePreview = onRequest as unknown as PreviewOnRequest;
  const res = await handlePreview({
    params: { pageId: "1" },
    request: new Request(`http://test?upgrade=bad`),
  });

  expect(res.status).toBe(401);
});

test("standard token not accepted as upgrade token", async () => {
  const getPages = jest.fn(async () => []);
  jest.doMock("@acme/platform-core/repositories/pages/index.server", () => ({
    __esModule: true,
    getPages,
  }));

  const { onRequest } = await import("../../src/routes/preview/[pageId]");
  const handlePreview = onRequest as unknown as PreviewOnRequest;
  const res = await handlePreview({
    params: { pageId: "1" },
    request: new Request(
      `http://test?upgrade=${createUpgradePreviewToken(
        { shopId: "shop", pageId: "1" },
        "testsecret",
      )}`,
    ),
  });

  expect(res.status).toBe(401);
});

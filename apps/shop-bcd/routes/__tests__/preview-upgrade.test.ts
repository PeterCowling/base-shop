import { jest } from "@jest/globals";
import type { Page } from "@acme/types";
import { createHmac } from "node:crypto";

process.env.PREVIEW_TOKEN_SECRET = "testsecret";
process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "upgradesecret";
process.env.NEXT_PUBLIC_SHOP_ID = "shop";

if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

afterEach(() => jest.resetModules());

function tokenFor(id: string, secret: string): string {
  return createHmac("sha256", secret).update(id).digest("hex");
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
  jest.doMock("@auth", () => ({ __esModule: true, requirePermission: jest.fn() }));
  jest.doMock("@acme/config", () => ({
    __esModule: true,
    env: { UPGRADE_PREVIEW_TOKEN_SECRET: "upgradesecret" },
  }));
  const { GET } = await import("../../src/app/api/preview-token/route");
  const { NextRequest } = await import("next/server");
  const tokenRes = await GET(new NextRequest("http://test?pageId=1"));
  const { token } = await tokenRes.json();

  const { onRequest } = await import("../../src/routes/preview/[pageId].ts");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request(`http://test?upgrade=${token}`),
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
  jest.doMock("@auth", () => ({ __esModule: true, requirePermission: jest.fn() }));
  jest.doMock("@acme/config", () => ({
    __esModule: true,
    env: { UPGRADE_PREVIEW_TOKEN_SECRET: "upgradesecret" },
  }));
  const { GET } = await import("../../src/app/api/preview-token/route");
  const { NextRequest } = await import("next/server");
  const tokenRes = await GET(new NextRequest("http://test?pageId=1"));
  const { token } = await tokenRes.json();

  const { onRequest } = await import("../../src/routes/preview/[pageId].ts");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request(`http://test?upgrade=${token}x`),
  } as any);

  expect(res.status).toBe(401);
});

test("standard token not accepted as upgrade token", async () => {
  const getPages = jest.fn(async () => []);
  jest.doMock("@platform-core/repositories/pages/index.server", () => ({
    __esModule: true,
    getPages,
  }));

  const { onRequest } = await import("../../src/routes/preview/[pageId].ts");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request(
      `http://test?upgrade=${tokenFor("1", "testsecret")}`,
    ),
  } as any);

  expect(res.status).toBe(401);
});


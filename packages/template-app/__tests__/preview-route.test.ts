import { jest } from "@jest/globals";
import type { Page } from "@acme/types";
import { createHmac } from "node:crypto";
import { nowIso } from "@date-utils";

process.env.PREVIEW_TOKEN_SECRET = "testsecret";
process.env.UPGRADE_PREVIEW_TOKEN_SECRET = "upgradesecret";
process.env.NEXT_PUBLIC_SHOP_ID = "shop";


afterEach(() => jest.resetModules());

function tokenFor(id: string): string {
  return createHmac("sha256", "testsecret").update(id).digest("hex");
}

function mockEnv() {
  jest.doMock("@acme/config/env/core", () => ({
    __esModule: true,
    coreEnv: {
      PREVIEW_TOKEN_SECRET: process.env.PREVIEW_TOKEN_SECRET,
      UPGRADE_PREVIEW_TOKEN_SECRET: process.env.UPGRADE_PREVIEW_TOKEN_SECRET,
      NEXT_PUBLIC_SHOP_ID: process.env.NEXT_PUBLIC_SHOP_ID,
    },
  }));
}

test("valid token returns page JSON", async () => {
  mockEnv();
  const page: Page = {
    id: "1",
    slug: "home",
    status: "draft",
    components: [],
    seo: { title: "Home" },
    createdAt: nowIso(),
    updatedAt: nowIso(),
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
  mockEnv();
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

test("missing token yields 401", async () => {
  mockEnv();
  const getPages = jest.fn(async () => []);
  jest.doMock("@platform-core/repositories/pages/index.server", () => ({
    __esModule: true,
    getPages,
  }));

  const { onRequest } = await import("../src/routes/preview/[pageId].ts");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request("http://test"),
  } as any);

  expect(res.status).toBe(401);
});

test("missing secret yields 401", async () => {
  const original = process.env.PREVIEW_TOKEN_SECRET;
  delete process.env.PREVIEW_TOKEN_SECRET;
  mockEnv();
  const getPages = jest.fn(async () => []);
  jest.doMock("@platform-core/repositories/pages/index.server", () => ({
    __esModule: true,
    getPages,
  }));

  const { onRequest } = await import("../src/routes/preview/[pageId].ts");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request(`http://test?token=${tokenFor("1")}`),
  } as any);

  expect(res.status).toBe(401);
  process.env.PREVIEW_TOKEN_SECRET = original;
});

test("timingSafeEqual error yields 401", async () => {
  mockEnv();
  jest.doMock("crypto", () => {
    const actual = jest.requireActual("node:crypto");
    return { ...actual, timingSafeEqual: () => { throw new Error("boom"); } };
  });
  const getPages = jest.fn(async () => []);
  jest.doMock("@platform-core/repositories/pages/index.server", () => ({
    __esModule: true,
    getPages,
  }));

  const { onRequest } = await import("../src/routes/preview/[pageId].ts");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request(`http://test?token=${tokenFor("1")}`),
  } as any);

  expect(res.status).toBe(401);
  jest.dontMock("crypto");
});

test("valid token with missing page yields 404", async () => {
  mockEnv();
  const getPages = jest.fn(async () => [] as Page[]);
  jest.doMock("@platform-core/repositories/pages/index.server", () => ({
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

test("falls back to default shop when NEXT_PUBLIC_SHOP_ID is unset", async () => {
  const original = process.env.NEXT_PUBLIC_SHOP_ID;
  delete process.env.NEXT_PUBLIC_SHOP_ID;
  mockEnv();
  const getPages = jest.fn(async () => [] as Page[]);
  jest.doMock("@platform-core/repositories/pages/index.server", () => ({
    __esModule: true,
    getPages,
  }));

  const { onRequest } = await import("../src/routes/preview/[pageId].ts");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request(`http://test?token=${tokenFor("1")}`),
  } as any);

  expect(res.status).toBe(404);
  expect(getPages).toHaveBeenCalledWith("default");
  process.env.NEXT_PUBLIC_SHOP_ID = original;
});

test("valid upgrade token returns page JSON", async () => {
  mockEnv();
  const page: Page = {
    id: "1",
    slug: "home",
    status: "draft",
    components: [],
    seo: { title: "Home" },
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

  const { GET: tokenGET } = await import(
    "../src/app/api/preview-token/route"
  );
  const tokenRes = await tokenGET(new Request("http://test?pageId=1") as any);
  const { token } = (await tokenRes.json()) as { token: string };

  const { onRequest } = await import("../src/routes/preview/[pageId].ts");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request(`http://test?upgrade=${token}`),
  } as any);

  expect(res.status).toBe(200);
  expect(await res.json()).toEqual(page);
});

test("invalid upgrade token yields 401", async () => {
  mockEnv();
  const getPages = jest.fn(async () => []);
  jest.doMock("@platform-core/repositories/pages/index.server", () => ({
    __esModule: true,
    getPages,
  }));

  const { onRequest } = await import("../src/routes/preview/[pageId].ts");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request("http://test?upgrade=bad"),
  } as any);

  expect(res.status).toBe(401);
});

test("standard token not accepted as upgrade token", async () => {
  mockEnv();
  const getPages = jest.fn(async () => []);
  jest.doMock("@platform-core/repositories/pages/index.server", () => ({
    __esModule: true,
    getPages,
  }));

  const { onRequest } = await import("../src/routes/preview/[pageId].ts");
  const res = await onRequest({
    params: { pageId: "1" },
    request: new Request(`http://test?upgrade=${tokenFor("1")}`),
  } as any);

  expect(res.status).toBe(401);
});

test("upgrade token route generates token when authorized", async () => {
  jest.doMock("@auth", () => ({
    __esModule: true,
    requirePermission: jest.fn(),
  }));

  const { GET } = await import("../src/app/api/preview-token/route");
  const res = await GET(new Request("http://test?pageId=1") as any);

  expect(res.status).toBe(200);
  const { token } = (await res.json()) as { token: string };
  const expected = createHmac("sha256", process.env.UPGRADE_PREVIEW_TOKEN_SECRET!)
    .update("1")
    .digest("hex");
  expect(token).toBe(expected);
});

test("upgrade token route returns 401 when permission check fails", async () => {
  mockEnv();
  jest.doMock("@auth", () => ({
    __esModule: true,
    requirePermission: jest
      .fn()
      .mockRejectedValue(new Error("no permission")),
  }));

  const { GET } = await import("../src/app/api/preview-token/route");
  const res = await GET(new Request("http://test?pageId=1") as any);

  expect(res.status).toBe(401);
});

test("upgrade token route without pageId yields 400", async () => {
  mockEnv();
  jest.doMock("@auth", () => ({
    __esModule: true,
    requirePermission: jest.fn(),
  }));

  const { GET } = await import("../src/app/api/preview-token/route");
  const res = await GET(new Request("http://test") as any);

  expect(res.status).toBe(400);
});

test("missing upgrade token secret returns 500", async () => {
  const original = process.env.UPGRADE_PREVIEW_TOKEN_SECRET;
  delete process.env.UPGRADE_PREVIEW_TOKEN_SECRET;
  mockEnv();
  jest.doMock("@auth", () => ({
    __esModule: true,
    requirePermission: jest.fn(),
  }));

  const { GET } = await import("../src/app/api/preview-token/route");
  const res = await GET(new Request("http://test?pageId=1") as any);

  expect(res.status).toBe(500);
  expect(await res.json()).toEqual({ error: "Token secret not configured" });

  process.env.UPGRADE_PREVIEW_TOKEN_SECRET = original;
});

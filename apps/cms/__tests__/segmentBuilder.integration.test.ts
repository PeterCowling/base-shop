import { promises as fs } from "node:fs";
import path from "node:path";

import type { NextRequest } from "next/server";
import { jest } from "@jest/globals";

import { DATA_ROOT } from "@acme/platform-core/dataRoot";

jest.doMock("@acme/platform-core/analytics", () => ({
  __esModule: true,
  trackEvent: jest.fn(),
}));
jest.doMock("@acme/platform-core/repositories/analytics.server", () => ({
  __esModule: true,
  listEvents: jest.fn(),
}));
jest.doMock("@acme/lib", () => ({
  __esModule: true,
  validateShopName: (s: string) => s,
}));

process.env.CMS_SPACE_URL = "https://example.com";
process.env.CMS_ACCESS_TOKEN = "token";
process.env.SANITY_API_VERSION = "2023-01-01";

const ResponseWithJson = Response as unknown as typeof Response & {
  json?: (data: unknown, init?: ResponseInit) => Response;
};
if (typeof ResponseWithJson.json !== "function") {
  ResponseWithJson.json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

describe("segments API", () => {
  const shop = "segint";
  const shopDir = path.join(DATA_ROOT, shop);

  beforeEach(async () => {
    await fs.rm(shopDir, { recursive: true, force: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test setup creates a directory inside known DATA_ROOT test path
    await fs.mkdir(shopDir, { recursive: true });
  });

  test("creates, lists, and deletes segments", async () => {
    const { GET, POST, DELETE } = await import("../src/app/api/segments/route");

    const createRes = await POST({
      json: async () => ({
        shop,
        id: "vip",
        name: "VIP",
        filters: [{ field: "type", value: "purchase" }],
      }),
    } as unknown as NextRequest);
    expect(createRes.status).toBe(200);

    const listRes = await GET({
      nextUrl: new URL(`http://example.com?shop=${shop}`),
    } as unknown as NextRequest);
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.segments).toEqual([
      { id: "vip", name: "VIP", filters: [{ field: "type", value: "purchase" }] },
    ]);

    const delRes = await DELETE({
      nextUrl: new URL(`http://example.com?shop=${shop}&id=vip`),
    } as unknown as NextRequest);
    expect(delRes.status).toBe(200);

    const afterDelete = await GET({
      nextUrl: new URL(`http://example.com?shop=${shop}`),
    } as unknown as NextRequest);
    const afterData = await afterDelete.json();
    expect(afterData.segments).toEqual([]);
  });

  test("validates missing shop on GET", async () => {
    const { GET } = await import("../src/app/api/segments/route");
    const res = await GET({
      nextUrl: new URL("http://example.com"),
    } as unknown as NextRequest);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing shop" });
  });

  test("validates segment payload on POST", async () => {
    const { POST } = await import("../src/app/api/segments/route");
    const res = await POST({ json: async () => ({}) } as unknown as NextRequest);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      shop: ["Required"],
      id: ["Required"],
      filters: ["Required"],
    });
  });

  test("validates missing id on DELETE", async () => {
    const { DELETE } = await import("../src/app/api/segments/route");
    const res = await DELETE({
      nextUrl: new URL(`http://example.com?shop=${shop}`),
    } as unknown as NextRequest);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing id" });
  });
});

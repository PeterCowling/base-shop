// packages/template-app/__tests__/ai-catalog.test.ts

import { trackEvent } from "@acme/platform-core/analytics";
import { PRODUCTS } from "@acme/platform-core/products";
import { readRepo } from "@acme/platform-core/repositories/products.server";
import { getShopSettings } from "@acme/platform-core/repositories/settings.server";

import { GET } from "../src/app/api/ai/catalog/route";

jest.mock("@acme/platform-core/repositories/settings.server", () => ({
  getShopSettings: jest.fn(),
}));
jest.mock("@acme/platform-core/repositories/products.server", () => ({
  readRepo: jest.fn(),
}));
jest.mock("@acme/platform-core/analytics", () => ({
  trackEvent: jest.fn(),
}));

const getShopSettingsMock = jest.mocked(getShopSettings);
const readRepoMock = jest.mocked(readRepo);
const trackEventMock = jest.mocked(trackEvent);

describe("AI catalogue API", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SHOP_ID = "abc";
  });

  beforeEach(() => {
    jest.clearAllMocks();
    getShopSettingsMock.mockResolvedValue({
      seo: { aiCatalog: { enabled: true, fields: ["id", "title"], pageSize: 2 } },
    } as any);
    readRepoMock.mockResolvedValue([
      {
        id: "p1",
        sku: "p1",
        title: "Product 1",
        description: "desc",
        price: 123,
        media: ["img"],
        updated_at: "2024-01-01T00:00:00Z",
      },
    ] as any);
    trackEventMock.mockResolvedValue(undefined as any);
  });

  function createRequest(url: string, headers: Record<string, string> = {}) {
    return {
      nextUrl: new URL(url),
      headers: new Headers(headers),
    } as any;
  }

  test("returns filtered product metadata and tracks 200 response", async () => {
    const res = await GET(
      createRequest("http://localhost/api/ai/catalog?page=foo&limit=-1")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(1);
    expect(body.items).toEqual([{ id: "p1", title: "Product 1" }]);
    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith("abc", {
      type: "ai_crawl",
      page: "1",
      status: 200,
      items: 1,
    });
  });

  test("uses default shop when env ID missing", async () => {
    const original = process.env.NEXT_PUBLIC_SHOP_ID;
    delete process.env.NEXT_PUBLIC_SHOP_ID;
    const res = await GET(createRequest("http://localhost/api/ai/catalog"));
    expect(res.status).toBe(200);
    expect(getShopSettingsMock).toHaveBeenCalledWith("default");
    expect(trackEventMock).toHaveBeenCalledWith("default", {
      type: "ai_crawl",
      page: "1",
      status: 200,
      items: 1,
    });
    process.env.NEXT_PUBLIC_SHOP_ID = original;
  });

  test("falls back to static products when repo empty", async () => {
    getShopSettingsMock.mockResolvedValueOnce({
      seo: { aiCatalog: { enabled: true, fields: ["id", "title"], pageSize: 50 } },
    } as any);
    readRepoMock.mockResolvedValueOnce([]);
    const res = await GET(createRequest("http://localhost/api/ai/catalog"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(PRODUCTS.length);
    expect(body.items[0]).toEqual({ id: PRODUCTS[0].id, title: PRODUCTS[0].title });
  });

  test("returns all requested fields", async () => {
    getShopSettingsMock.mockResolvedValueOnce({
      seo: {
        aiCatalog: {
          enabled: true,
          fields: ["id", "title", "description", "price", "media"],
          pageSize: 2,
        },
      },
    } as any);
    const res = await GET(createRequest("http://localhost/api/ai/catalog"));
    const body = await res.json();
    expect(body.items[0]).toEqual({
      id: "p1",
      title: "Product 1",
      description: "desc",
      price: 123,
      media: ["img"],
    });
  });

  test("defaults fields and page size when unset", async () => {
    getShopSettingsMock.mockResolvedValueOnce({
      seo: { aiCatalog: { enabled: true } },
    } as any);
    readRepoMock.mockResolvedValueOnce(
      Array.from({ length: 60 }, (_, i) => ({
        id: `p${i}`,
        sku: `p${i}`,
        title: `Product ${i}`,
        description: `desc${i}`,
        price: i,
        media: [`img${i}`],
        updated_at: "2024-01-01T00:00:00Z",
      })) as any
    );
    const res = await GET(createRequest("http://localhost/api/ai/catalog"));
    const body = await res.json();
    expect(body.items).toHaveLength(50);
    expect(body.items[0]).toEqual({
      id: "p0",
      title: "Product 0",
      description: "desc0",
      price: 0,
      media: ["img0"],
    });
  });

  test("falls back to SKU data when repo metadata missing", async () => {
    getShopSettingsMock.mockResolvedValueOnce({
      seo: { aiCatalog: { enabled: true, fields: ["id", "price", "media"], pageSize: 50 } },
    } as any);
    readRepoMock.mockResolvedValueOnce([
      { id: "green-sneaker", sku: "green-sneaker", title: "Green" },
      { id: "p2", sku: "p2", title: "Other" },
    ] as any);
    const res = await GET(createRequest("http://localhost/api/ai/catalog"));
    const body = await res.json();
    expect(body.items).toEqual([
      { id: "green-sneaker", price: PRODUCTS[0].price, media: PRODUCTS[0].media },
      { id: "p2", price: null, media: [] },
    ]);
    expect(res.headers.get("Last-Modified")).toBe(new Date(0).toUTCString());
  });

  test("uses If-Modified-Since older than last modified and returns 200", async () => {
    const ims = new Date("2023-12-31T23:59:59Z").toUTCString();
    const res = await GET(
      createRequest("http://localhost/api/ai/catalog", {
        "If-Modified-Since": ims,
      })
    );
    expect(res.status).toBe(200);
    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith("abc", {
      type: "ai_crawl",
      page: "1",
      status: 200,
      items: 1,
    });
  });

  test("returns 304 when If-Modified-Since newer than last modified", async () => {
    const ims = new Date("2024-01-02T00:00:00Z").toUTCString();
    const res = await GET(
      createRequest("http://localhost/api/ai/catalog", {
        "If-Modified-Since": ims,
      })
    );
    expect(res.status).toBe(304);
    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith("abc", {
      type: "ai_crawl",
      page: "1",
      status: 304,
    });
  });

  test("ignores invalid If-Modified-Since header", async () => {
    const res = await GET(
      createRequest("http://localhost/api/ai/catalog", {
        "If-Modified-Since": "not-a-date",
      })
    );
    expect(res.status).toBe(200);
    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith("abc", {
      type: "ai_crawl",
      page: "1",
      status: 200,
      items: 1,
    });
  });

  test("paginates results with valid page and limit", async () => {
    readRepoMock.mockResolvedValueOnce([
      {
        id: "p1",
        sku: "p1",
        title: "Product 1",
        description: "desc",
        price: 100,
        media: ["img1"],
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "p2",
        sku: "p2",
        title: "Product 2",
        description: "desc2",
        price: 200,
        media: ["img2"],
        updated_at: "2024-01-02T00:00:00Z",
      },
    ] as any);
    const res = await GET(
      createRequest("http://localhost/api/ai/catalog?page=2&limit=1")
    );
    const body = await res.json();
    expect(body.page).toBe(2);
    expect(body.items).toEqual([{ id: "p2", title: "Product 2" }]);
  });

  test("returns empty array when page beyond range", async () => {
    readRepoMock.mockResolvedValueOnce([
      { id: "p1", sku: "p1", title: "Product 1", updated_at: "2024-01-01" },
    ] as any);
    const res = await GET(
      createRequest("http://localhost/api/ai/catalog?page=10&limit=5")
    );
    const body = await res.json();
    expect(body.items).toEqual([]);
    expect(body.page).toBe(10);
  });

  test("returns 404 when AI catalog disabled", async () => {
    getShopSettingsMock.mockResolvedValueOnce({
      seo: { aiCatalog: { enabled: false } },
    } as any);
    const res = await GET(createRequest("http://localhost/api/ai/catalog"));
    expect(res.status).toBe(404);
  });
});


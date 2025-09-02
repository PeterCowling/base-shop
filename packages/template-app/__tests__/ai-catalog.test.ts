// packages/template-app/__tests__/ai-catalog.test.ts

jest.mock("@platform-core/repositories/settings.server", () => ({
  getShopSettings: jest.fn(),
}));
jest.mock("@platform-core/repositories/products.server", () => ({
  readRepo: jest.fn(),
}));
jest.mock("@platform-core/analytics", () => ({
  trackEvent: jest.fn(),
}));

import { GET } from "../src/app/api/ai/catalog/route";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import { readRepo } from "@platform-core/repositories/products.server";
import { trackEvent } from "@platform-core/analytics";

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

  test("returns 404 when AI catalog disabled", async () => {
    getShopSettingsMock.mockResolvedValueOnce({
      seo: { aiCatalog: { enabled: false } },
    } as any);
    const res = await GET(createRequest("http://localhost/api/ai/catalog"));
    expect(res.status).toBe(404);
  });
});


// packages/template-app/__tests__/ai-catalog.test.ts
jest.mock("@acme/config", () => ({
  env: { NEXT_PUBLIC_SHOP_ID: "abc" },
}));
const trackEventMock = jest.fn();
jest.mock("@platform-core/analytics", () => ({
  trackEvent: (...a: unknown[]) => trackEventMock(...a),
}));
import { GET } from "../src/app/api/ai/catalog/route";

describe("AI catalogue API", () => {

  function createRequest(url: string, headers: Record<string, string> = {}) {
    return {
      nextUrl: new URL(url),
      headers: new Headers(headers),
    } as any;
  }

  test("returns product metadata", async () => {
    trackEventMock.mockClear();
    const res = await GET(
      createRequest("http://localhost/api/ai/catalog?limit=1&page=1")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeLessThanOrEqual(1);
    const item = body.items[0];
    expect(item).toHaveProperty("id");
    expect(item).toHaveProperty("title");
    expect(item).toHaveProperty("description");
    expect(item).toHaveProperty("price");
    expect(item).toHaveProperty("images");
    expect(trackEventMock).toHaveBeenCalledWith("abc", {
      type: "ai_crawl",
      page: 1,
      items: expect.any(Number),
    });
  });

  test("responds 304 when not modified", async () => {
    const first = await GET(createRequest("http://localhost/api/ai/catalog"));
    const lm = first.headers.get("Last-Modified")!;
    const second = await GET(
      createRequest("http://localhost/api/ai/catalog", {
        "If-Modified-Since": lm,
      })
    );
    expect(second.status).toBe(304);
  });
});

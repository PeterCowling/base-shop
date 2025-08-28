// packages/template-app/__tests__/ai-catalog.test.ts
import { GET } from "../src/app/api/ai/catalog/route";
import * as settings from "@platform-core/repositories/settings.server";

describe("AI catalogue API", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SHOP_ID = "abc";
  });

  function createRequest(url: string, headers: Record<string, string> = {}) {
    return {
      nextUrl: new URL(url),
      headers: new Headers(headers),
    } as any;
  }

  test("returns product metadata", async () => {
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
    expect(item).toHaveProperty("media");
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

  test("returns 404 when AI catalog disabled", async () => {
    const spy = jest
      .spyOn(settings, "getShopSettings")
      .mockResolvedValue({ seo: { aiCatalog: { enabled: false } } } as any);
    const res = await GET(createRequest("http://localhost/api/ai/catalog"));
    expect(res.status).toBe(404);
    spy.mockRestore();
  });
});

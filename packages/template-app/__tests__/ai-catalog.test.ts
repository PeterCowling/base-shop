// packages/template-app/__tests__/ai-catalog.test.ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { GET } from "../src/app/api/ai/catalog/route";
jest.mock("@platform-core/src/analytics", () => ({
  trackEvent: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@acme/config", () => ({ env: { NEXT_PUBLIC_SHOP_ID: "abc" } }));

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
    expect(item).toHaveProperty("images");
  });

  test("respects field list", async () => {
    const settingsPath = path.join(
      process.cwd(),
      "data",
      "shops",
      "abc",
      "settings.json"
    );
    const orig = await fs.readFile(settingsPath, "utf8");
    const cfg = JSON.parse(orig);
    cfg.aiCatalog.fields = ["id", "title"];
    await fs.writeFile(settingsPath, JSON.stringify(cfg, null, 2), "utf8");
    try {
      const res = await GET(createRequest("http://localhost/api/ai/catalog"));
      expect(res.status).toBe(200);
      const body = await res.json();
      const item = body.items[0];
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("title");
      expect(item).not.toHaveProperty("description");
      expect(item).not.toHaveProperty("price");
      expect(item).not.toHaveProperty("images");
    } finally {
      await fs.writeFile(settingsPath, orig, "utf8");
    }
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

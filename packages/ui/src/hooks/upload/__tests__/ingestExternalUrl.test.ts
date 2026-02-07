// packages/ui/src/hooks/upload/__tests__/ingestExternalUrl.test.ts
import { ingestExternalUrl, ingestFromText } from "../ingestExternalUrl";

// i18n-exempt: test suite name
describe("ingestExternalUrl", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // i18n-exempt: test description
  test("blocks unsafe urls and policy disallow", async () => {
    globalThis.fetch = jest.fn() as unknown as typeof fetch;
    const res1 = await ingestExternalUrl("javascript:alert(1)", { allowedMimePrefixes: ["image/"] });
    expect(res1.error).toMatch(/Blocked URL/);
    const res2 = await ingestExternalUrl("https://example.com/x.png", { allowedMimePrefixes: [], allowExternalUrl: () => false });
    expect(res2.error).toMatch(/not allowed/);
  });

  // i18n-exempt: test description
  test("fetch ok image within size limit returns File", async () => {
    const blob = new Blob([new Uint8Array(10)], { type: "image/png" });
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, headers: new Headers({ "content-type": "image/png" }), blob: async () => blob }) as unknown as typeof fetch;
    const res = await ingestExternalUrl("https://example.com/pic.png", { allowedMimePrefixes: ["image/"], maxBytes: 1024 * 1024 });
    expect(res.file).toBeInstanceOf(File);
    expect(res.error).toBeUndefined();
  });

  // i18n-exempt: test description
  test("rejects non-image content-type", async () => {
    const blob = new Blob(["hi"], { type: "text/plain" });
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, headers: new Headers({ "content-type": "text/plain" }), blob: async () => blob }) as unknown as typeof fetch;
    const res = await ingestExternalUrl("https://example.com/file.txt", { allowedMimePrefixes: ["image/"] });
    expect(res.file).toBeNull();
    expect(res.error).toMatch(/Unsupported/);
  });

  // i18n-exempt: test description
  test("ingestFromText returns text handled when no url, or delegates to url ingestion", async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, headers: new Headers({ "content-type": "image/png" }), blob: async () => new Blob([""], { type: "image/png" }) }) as unknown as typeof fetch;
    const t = await ingestFromText("hello", { allowedMimePrefixes: ["image/"] });
    expect(t.handled).toBe("text");
    const u = await ingestFromText("see https://a.com/x.png", { allowedMimePrefixes: ["image/"] });
    expect(u.handled).toBe("url");
  });
});

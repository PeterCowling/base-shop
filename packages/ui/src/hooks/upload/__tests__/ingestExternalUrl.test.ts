// packages/ui/src/hooks/upload/__tests__/ingestExternalUrl.test.ts
import { ingestExternalUrl, ingestFromText } from "../ingestExternalUrl";

describe("ingestExternalUrl", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    // @ts-ignore
    global.fetch = originalFetch;
  });

  test("blocks unsafe urls and policy disallow", async () => {
    // @ts-ignore
    global.fetch = jest.fn();
    const res1 = await ingestExternalUrl("javascript:alert(1)", { allowedMimePrefixes: ["image/"] });
    expect(res1.error).toMatch(/Blocked URL/);
    const res2 = await ingestExternalUrl("https://example.com/x.png", { allowedMimePrefixes: [], allowExternalUrl: () => false });
    expect(res2.error).toMatch(/not allowed/);
  });

  test("fetch ok image within size limit returns File", async () => {
    const blob = new Blob([new Uint8Array(10)], { type: "image/png" });
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({ ok: true, headers: new Headers({ "content-type": "image/png" }), blob: async () => blob });
    const res = await ingestExternalUrl("https://example.com/pic.png", { allowedMimePrefixes: ["image/"], maxBytes: 1024 * 1024 });
    expect(res.file).toBeInstanceOf(File);
    expect(res.error).toBeUndefined();
  });

  test("rejects non-image content-type", async () => {
    const blob = new Blob(["hi"], { type: "text/plain" });
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({ ok: true, headers: new Headers({ "content-type": "text/plain" }), blob: async () => blob });
    const res = await ingestExternalUrl("https://example.com/file.txt", { allowedMimePrefixes: ["image/"] });
    expect(res.file).toBeNull();
    expect(res.error).toMatch(/Unsupported/);
  });

  test("ingestFromText returns text handled when no url, or delegates to url ingestion", async () => {
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({ ok: true, headers: new Headers({ "content-type": "image/png" }), blob: async () => new Blob([1], { type: "image/png" }) });
    const t = await ingestFromText("hello", { allowedMimePrefixes: ["image/"] });
    expect(t.handled).toBe("text");
    const u = await ingestFromText("see https://a.com/x.png", { allowedMimePrefixes: ["image/"] });
    expect(u.handled).toBe("url");
  });
});


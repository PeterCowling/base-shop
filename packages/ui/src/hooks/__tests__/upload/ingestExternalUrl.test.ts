/* i18n-exempt file -- test titles and UI copy are asserted literally */
import { ingestExternalUrl, ingestFromText } from "../../upload/ingestExternalUrl";

const originalFetch: typeof fetch = globalThis.fetch;
const mockFetch = jest.fn(
  async (_url: string | URL | Request, _init?: RequestInit) =>
    ({
      ok: true,
      headers: new Map([["content-type", "image/png"]]) as unknown as Headers,
      async blob() {
        return new Blob([new Uint8Array(5)], { type: "image/png" });
      },
    } as unknown as Response),
);

beforeEach(() => {
  mockFetch.mockClear();
  (globalThis as unknown as { fetch: typeof fetch }).fetch =
    mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  (globalThis as unknown as { fetch: typeof fetch }).fetch = originalFetch;
  jest.clearAllMocks();
});

describe("ingestExternalUrl", () => {
  it("wraps remote resource in a File when allowed", async () => {
    const res = await ingestExternalUrl("https://example.com/a.png", {
      allowedMimePrefixes: ["image/"],
    });
    expect(res.error).toBeUndefined();
    expect(res.file).toBeInstanceOf(File);
    expect(res.file?.name).toBe("a.png");
    expect(res.handled).toBe("url");
  });

  it("blocks disallowed schemes and policies", async () => {
    const blocked = await ingestExternalUrl("javascript:alert(1)", {
      allowedMimePrefixes: ["image/"],
    });
    expect(blocked.error).toMatch(/Blocked URL/);

    const denied = await ingestExternalUrl("https://example.com/a.png", {
      allowedMimePrefixes: ["image/"],
      allowExternalUrl: () => false,
    });
    expect(denied.error).toMatch(/not allowed/);
  });

  it("errors on unsupported content-type", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([["content-type", "text/plain"]]) as unknown as Headers,
      async blob() {
        return new Blob([new Uint8Array(3)], { type: "text/plain" });
      },
    } as unknown as Response);
    const res = await ingestExternalUrl("https://example.com/a.txt", {
      allowedMimePrefixes: ["image/"],
    });
    expect(res.error).toMatch(/Unsupported content-type/);
  });

  it("errors when size exceeds maxBytes", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([["content-type", "image/png"]]) as unknown as Headers,
      async blob() {
        return new Blob([new Uint8Array(10)], { type: "image/png" });
      },
    } as unknown as Response);
    const res = await ingestExternalUrl("https://example.com/a.png", {
      allowedMimePrefixes: ["image/"],
      maxBytes: 5,
    });
    expect(res.error).toMatch(/File too large/);
  });
});

describe("ingestFromText", () => {
  it("returns handled=text when no URL present", async () => {
    const res = await ingestFromText("hello", { allowedMimePrefixes: ["image/"] });
    expect(res.handled).toBe("text");
    expect(res.file).toBeNull();
  });

  it("ingests when URL is in text", async () => {
    const res = await ingestFromText("see https://example.com/pic.png", { allowedMimePrefixes: ["image/"] });
    expect(res.handled).toBe("url");
    expect(res.file).toBeInstanceOf(File);
  });
});

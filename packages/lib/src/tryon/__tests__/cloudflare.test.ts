jest.mock(
  "@acme/i18n/en.json",
  () => ({
    __esModule: true,
    default: {
      "tryon.circuitBreaker.timeout": "Timeout.",
      "tryon.circuitBreaker.open": "Circuit open.",
      "tryon.circuitBreaker.halfOpen": "Circuit half-open.",
      "tryon.providers.cloudflare.originNotAllowed": "Origin not allowed.",
      "tryon.providers.cloudflare.fetchFailed": "Failed to fetch image ({status}).",
      "tryon.providers.cloudflare.accountIdMissing": "CLOUDFLARE_ACCOUNT_ID missing.",
      "tryon.providers.cloudflare.apiTokenMissing": "CLOUDFLARE_API_TOKEN missing.",
      "tryon.providers.cloudflare.upstreamError": "Upstream {status}.",
      "tryon.providers.cloudflare.noImageInJson": "No image in JSON.",
      "tryon.providers.garment.heavyApiUrlMissing": "TRYON_HEAVY_API_URL not set.",
      "tryon.providers.garment.upstreamError": "Upstream {status}.",
      "tryon.providers.garment.unexpectedResponse": "Unexpected upstream response.",
    },
  }),
  { virtual: true }
);

import { createCloudflareProvider } from "../providers/cloudflare";

class MockFormData {
  private entries: Array<[string, unknown, string | undefined]> = [];
  append(name: string, value: unknown, filename?: string): void {
    this.entries.push([name, value, filename]);
  }
}

describe("createCloudflareProvider", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  const originalFormDataCtor = global.FormData;

  beforeAll(() => {
    global.FormData = MockFormData as unknown as typeof FormData;
  });

  afterAll(() => {
    global.FormData = originalFormDataCtor;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("returns an empty result when the account id is missing", async () => {
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    const provider = createCloudflareProvider();
    await expect(provider.segmenter!.run("https://example.com/image.png")).resolves.toEqual({});
  });

  it("fetches images from allowed origins and converts JSON payloads", async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
    process.env.CLOUDFLARE_AI_GATEWAY_ID = "gateway";
    const base64 = Buffer.from("mock-image").toString("base64");

    const responses: Response[] = [
      {
        ok: true,
        blob: async () => new Blob(["image"], { type: "image/png" }),
      } as Response,
      {
        ok: true,
        headers: { get: (name: string) => (name === "content-type" ? "application/json" : null) } as unknown as Headers,
        json: async () => ({ result: { image: base64 } }),
        arrayBuffer: async () => new ArrayBuffer(0),
      } as unknown as Response,
    ];

    global.fetch = jest.fn(() => Promise.resolve(responses.shift()!)) as unknown as typeof fetch;

    const provider = createCloudflareProvider();
    const result = await provider.segmenter!.run("https://acct.r2.cloudflarestorage.com/photo.png");

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.result?.url).toBe(`data:image/png;base64,${base64}`);
    expect(result.metrics?.preprocessMs).toBeGreaterThanOrEqual(0);
  });

  it("rejects when the image origin is not allowed", async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
    process.env.CLOUDFLARE_AI_GATEWAY_ID = "gateway";
    const provider = createCloudflareProvider();

    await expect(provider.segmenter!.run("https://malicious.example.com/photo.png")).rejects.toThrow(
      "Origin not allowed."
    );
  });

  it("returns provider errors when Workers AI responses are invalid", async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
    process.env.CLOUDFLARE_AI_GATEWAY_ID = "gateway";

    const responses: Response[] = [
      {
        ok: true,
        blob: async () => new Blob(["image"], { type: "image/png" }),
      } as Response,
      {
        ok: true,
        headers: { get: (name: string) => (name === "content-type" ? "application/json" : null) } as unknown as Headers,
        json: async () => ({}),
        arrayBuffer: async () => new ArrayBuffer(0),
      } as unknown as Response,
    ];

    global.fetch = jest.fn(() => Promise.resolve(responses.shift()!)) as unknown as typeof fetch;

    const provider = createCloudflareProvider();
    const result = await provider.segmenter!.run("https://acct.r2.cloudflarestorage.com/photo.png");

    expect(result.error).toEqual({ code: "PROVIDER_UNAVAILABLE", details: "No image in JSON." });
  });
});

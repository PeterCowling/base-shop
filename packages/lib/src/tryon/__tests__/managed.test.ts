jest.mock(
  "@acme/i18n/en.json",
  () => ({
    __esModule: true,
    default: {
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

import { createManagedTryOnProvider } from "../providers/garment/managed";

describe("createManagedTryOnProvider", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  const originalCryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  const randomUUID = jest.fn(() => "uuid-1234");

  beforeEach(() => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: { randomUUID } as Crypto,
    });
    randomUUID.mockClear();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  afterAll(() => {
    if (originalCryptoDescriptor) {
      Object.defineProperty(globalThis, "crypto", originalCryptoDescriptor);
    } else {
      delete (globalThis as any).crypto;
    }
  });

  it("returns an error when the heavy API URL is missing", async () => {
    delete process.env.TRYON_HEAVY_API_URL;
    const provider = createManagedTryOnProvider();

    const response = await provider.generator!.run({
      mode: "garment",
      sourceUrl: "https://example.com/source.png",
      garmentAssets: {},
    });

    expect(response).toEqual({
      error: { code: "PROVIDER_UNAVAILABLE", details: "TRYON_HEAVY_API_URL not set." },
    });
  });

  it("propagates upstream failures", async () => {
    process.env.TRYON_HEAVY_API_URL = "https://heavy.example.com";
    global.fetch = jest.fn(() => Promise.resolve(new Response(null, { status: 503 })));

    const provider = createManagedTryOnProvider();
    const response = await provider.generator!.run({
      mode: "garment",
      sourceUrl: "https://example.com/source.png",
      garmentAssets: {},
    });

    expect(response).toEqual({
      error: { code: "PROVIDER_UNAVAILABLE", details: "Upstream 503." },
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://heavy.example.com",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": expect.any(String),
        }),
      })
    );
  });

  it("returns parsed JSON responses", async () => {
    process.env.TRYON_HEAVY_API_URL = "https://heavy.example.com";
    global.fetch = jest.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ url: "https://cdn.example.com/out.png", width: 100, height: 200, expiresAt: "soon" }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
    );

    const provider = createManagedTryOnProvider();
    const response = await provider.generator!.run({
      mode: "garment",
      sourceUrl: "https://example.com/source.png",
      garmentAssets: { flatUrl: "https://example.com/flat.png" },
    });

    expect(response).toEqual({
      result: { url: "https://cdn.example.com/out.png", width: 100, height: 200, expiresAt: "soon" },
    });
  });

  it("handles unexpected payloads", async () => {
    process.env.TRYON_HEAVY_API_URL = "https://heavy.example.com";
    global.fetch = jest.fn(() =>
      Promise.resolve(new Response("{}", { status: 200, headers: { "content-type": "application/json" } }))
    );

    const provider = createManagedTryOnProvider();
    const response = await provider.generator!.run({
      mode: "garment",
      sourceUrl: "https://example.com/source.png",
      garmentAssets: { exemplarUrl: "https://example.com/exemplar.png" },
    });

    expect(response).toEqual({
      error: { code: "UNKNOWN", details: "Unexpected upstream response." },
    });
  });
});

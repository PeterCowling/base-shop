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

import * as cloudflare from "../providers/cloudflare";
import { BUDGET } from "../index";

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
    const provider = cloudflare.createCloudflareProvider();
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

    const provider = cloudflare.createCloudflareProvider();
    const result = await provider.segmenter!.run("https://acct.r2.cloudflarestorage.com/photo.png");

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.result?.url).toBe(`data:image/png;base64,${base64}`);
    expect(result.metrics?.preprocessMs).toBeGreaterThanOrEqual(0);
  });

  it("rejects when the image origin is not allowed", async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
    process.env.CLOUDFLARE_AI_GATEWAY_ID = "gateway";
    const provider = cloudflare.createCloudflareProvider();

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

    const provider = cloudflare.createCloudflareProvider();
    const result = await provider.segmenter!.run("https://acct.r2.cloudflarestorage.com/photo.png");

    expect(result.error).toEqual({ code: "PROVIDER_UNAVAILABLE", details: "No image in JSON." });
  });

  it("propagates fetch failures when downloading images", async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
    process.env.R2_PUBLIC_BASE_URL = "https://r2.example.com/assets";

    const responses: Response[] = [
      new Response(null, { status: 403 }),
    ];

    global.fetch = jest.fn(() => Promise.resolve(responses.shift()!)) as unknown as typeof fetch;

    const provider = cloudflare.createCloudflareProvider();

    await expect(provider.segmenter!.run("https://r2.example.com/assets/photo.png")).rejects.toThrow(
      "Failed to fetch image (403).",
    );
  });

  it("requires an API token when Workers AI gateway is not configured", async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
    delete process.env.CLOUDFLARE_AI_GATEWAY_ID;
    delete process.env.CLOUDFLARE_API_TOKEN;

    const responses: Response[] = [
      { ok: true, blob: async () => new Blob(["image"], { type: "image/png" }) } as Response,
    ];

    global.fetch = jest.fn(() => Promise.resolve(responses.shift()!)) as unknown as typeof fetch;

    const provider = cloudflare.createCloudflareProvider();
    const result = await provider.segmenter!.run("https://acct.r2.cloudflarestorage.com/photo.png");

    expect(result).toEqual({
      error: { code: "PROVIDER_UNAVAILABLE", details: "CLOUDFLARE_API_TOKEN missing." },
    });
  });

  it("returns binary image payloads from Workers AI", async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
    process.env.CLOUDFLARE_API_TOKEN = "token";
    delete process.env.CLOUDFLARE_AI_GATEWAY_ID;

    const pngBytes = new Uint8Array([0, 1, 2, 3]);

    const responses: Response[] = [
      { ok: true, blob: async () => new Blob(["image"], { type: "image/png" }) } as Response,
      {
        ok: true,
        headers: { get: (name: string) => (name === "content-type" ? "image/png" : null) } as unknown as Headers,
        arrayBuffer: async () => pngBytes.buffer,
      } as unknown as Response,
    ];

    global.fetch = jest.fn(() => Promise.resolve(responses.shift()!)) as unknown as typeof fetch;

    const provider = cloudflare.createCloudflareProvider();
    const result = await provider.depth!.run("https://acct.r2.cloudflarestorage.com/photo.png");

    expect(result.result?.url).toBe(`data:image/png;base64,${Buffer.from(pngBytes).toString("base64")}`);
    expect(result.metrics?.preprocessMs).toBeGreaterThanOrEqual(0);
  });

  it("reports missing account ids discovered during processing", async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
    process.env.CLOUDFLARE_AI_GATEWAY_ID = "gateway";
    process.env.R2_PUBLIC_BASE_URL = "https://acct.r2.cloudflarestorage.com/assets";

    const firstResponse = new Response(null, { status: 200 });
    Object.defineProperty(firstResponse, "ok", { value: true });
    jest.spyOn(firstResponse, "blob").mockImplementation(async () => {
      delete process.env.CLOUDFLARE_ACCOUNT_ID;
      return new Blob(["image"], { type: "image/png" });
    });

    const responses: Response[] = [
      firstResponse,
    ];

    global.fetch = jest.fn(() => Promise.resolve(responses.shift()!)) as unknown as typeof fetch;

    const provider = cloudflare.createCloudflareProvider();
    const result = await provider.segmenter!.run("https://acct.r2.cloudflarestorage.com/photo.png");

    expect(result).toEqual({
      error: { code: "PROVIDER_UNAVAILABLE", details: "CLOUDFLARE_ACCOUNT_ID missing." },
    });
  });

  it("returns upstream errors from Workers AI", async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
    process.env.CLOUDFLARE_API_TOKEN = "token";
    delete process.env.CLOUDFLARE_AI_GATEWAY_ID;

    const responses: Response[] = [
      { ok: true, blob: async () => new Blob(["image"], { type: "image/png" }) } as Response,
      {
        ok: false,
        status: 502,
        headers: { get: () => null } as unknown as Headers,
      } as unknown as Response,
    ];

    global.fetch = jest.fn(() => Promise.resolve(responses.shift()!)) as unknown as typeof fetch;

    const provider = cloudflare.createCloudflareProvider();
    const result = await provider.depth!.run("https://acct.r2.cloudflarestorage.com/photo.png");

    expect(result).toEqual({
      error: { code: "PROVIDER_UNAVAILABLE", details: "Upstream 502." },
    });
  });

  it("propagates depth provider errors returned from Workers AI", async () => {
    process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
    process.env.CLOUDFLARE_API_TOKEN = "token";
    delete process.env.CLOUDFLARE_AI_GATEWAY_ID;

    const responses: Response[] = [
      { ok: true, blob: async () => new Blob(["image"], { type: "image/png" }) } as Response,
      {
        ok: true,
        headers: { get: () => "application/json" } as unknown as Headers,
        json: async () => ({}),
        arrayBuffer: async () => new ArrayBuffer(0),
      } as unknown as Response,
    ];

    global.fetch = jest.fn(() => Promise.resolve(responses.shift()!)) as unknown as typeof fetch;

    const provider = cloudflare.createCloudflareProvider();
    const result = await provider.depth!.run("https://acct.r2.cloudflarestorage.com/photo.png");

    expect(result).toEqual({
      error: { code: "PROVIDER_UNAVAILABLE", details: "No image in JSON." },
    });
  });

  it("returns an empty depth result when the account id is missing", async () => {
    delete process.env.CLOUDFLARE_ACCOUNT_ID;

    const provider = cloudflare.createCloudflareProvider();
    const result = await provider.depth!.run("https://example.com/photo.png");

    expect(result).toEqual({});
  });

  describe("runWorkersAi", () => {
    it("defaults the content type when the response header is missing", async () => {
      process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
      process.env.CLOUDFLARE_API_TOKEN = "token";
      delete process.env.CLOUDFLARE_AI_GATEWAY_ID;

      const bytes = new Uint8Array([7, 8, 9]);
      global.fetch = jest.fn(async () => new Response(bytes, { status: 200 })) as unknown as typeof fetch;

      const blob = new Blob(["image"], { type: "image/png" });
      const result = await cloudflare.runWorkersAi("model", blob);

      expect(result.contentType).toBe("application/octet-stream");
      expect(Buffer.from(new Uint8Array(result.body))).toEqual(Buffer.from(bytes));
    });

    it("returns an error when the account id is missing", async () => {
      delete process.env.CLOUDFLARE_ACCOUNT_ID;
      const blob = new Blob(["image"], { type: "image/png" });

      const result = await cloudflare.runWorkersAi("model", blob);

      expect(result).toEqual({ error: "CLOUDFLARE_ACCOUNT_ID missing." });
    });

    it("requires an API token when the gateway is not configured", async () => {
      process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
      delete process.env.CLOUDFLARE_API_TOKEN;
      delete process.env.CLOUDFLARE_AI_GATEWAY_ID;

      const blob = new Blob(["image"], { type: "image/png" });
      const result = await cloudflare.runWorkersAi("model", blob);

      expect(result).toEqual({ error: "CLOUDFLARE_API_TOKEN missing." });
    });

    it("returns upstream errors when Workers AI fails", async () => {
      process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
      process.env.CLOUDFLARE_API_TOKEN = "token";
      delete process.env.CLOUDFLARE_AI_GATEWAY_ID;

      global.fetch = jest.fn(async () =>
        new Response(null, { status: 503, headers: { "content-type": "application/json" } })
      ) as unknown as typeof fetch;

      const blob = new Blob(["image"], { type: "image/png" });
      const result = await cloudflare.runWorkersAi("model", blob);

      expect(result).toEqual({ error: "Upstream 503." });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.cloudflare.com/client/v4/accounts/acct/ai/run/model",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("returns binary payloads when the response is not JSON", async () => {
      process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
      process.env.CLOUDFLARE_API_TOKEN = "token";
      delete process.env.CLOUDFLARE_AI_GATEWAY_ID;

      const buffer = new Uint8Array([0, 1, 2]).buffer;
      global.fetch = jest.fn(async () =>
        new Response(buffer, { status: 200, headers: { "content-type": "image/png" } })
      ) as unknown as typeof fetch;

      const blob = new Blob(["image"], { type: "image/png" });
      const result = await cloudflare.runWorkersAi("model", blob);

      expect(Buffer.from(new Uint8Array(result.body))).toEqual(Buffer.from([0, 1, 2]));
      expect(result.contentType).toBe("image/png");
    });

    it("uses the Workers AI gateway when configured", async () => {
      process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
      process.env.CLOUDFLARE_AI_GATEWAY_ID = "gateway";
      delete process.env.CLOUDFLARE_API_TOKEN;

      const base64 = Buffer.from("gateway").toString("base64");
      global.fetch = jest.fn(async () =>
        new Response(JSON.stringify({ result: { image: base64 } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      ) as unknown as typeof fetch;

      const blob = new Blob(["image"], { type: "image/png" });
      const result = await cloudflare.runWorkersAi("model", blob);

      expect(Buffer.from(new Uint8Array(result.body)).toString()).toBe("gateway");
      expect(result.contentType).toBe("image/png");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://gateway.ai.cloudflare.com/v1/acct/gateway/workers-ai/run/model",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("accepts base64 payloads in top-level image fields", async () => {
      process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
      process.env.CLOUDFLARE_AI_GATEWAY_ID = "gateway";

      const base64 = Buffer.from("top-level").toString("base64");
      global.fetch = jest.fn(async () =>
        new Response(JSON.stringify({ image: base64 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      ) as unknown as typeof fetch;

      const blob = new Blob(["image"], { type: "image/png" });
      const result = await cloudflare.runWorkersAi("model", blob);

      expect(Buffer.from(new Uint8Array(result.body)).toString()).toBe("top-level");
      expect(result.contentType).toBe("image/png");
    });

    it("accepts base64 payloads from nested output arrays", async () => {
      process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
      process.env.CLOUDFLARE_AI_GATEWAY_ID = "gateway";

      const base64 = Buffer.from("nested").toString("base64");
      global.fetch = jest.fn(async () =>
        new Response(JSON.stringify({ result: { output: [base64] } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      ) as unknown as typeof fetch;

      const blob = new Blob(["image"], { type: "image/png" });
      const result = await cloudflare.runWorkersAi("model", blob);

      expect(Buffer.from(new Uint8Array(result.body)).toString()).toBe("nested");
    });

    it("returns an error when JSON payloads lack an image field", async () => {
      process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
      process.env.CLOUDFLARE_AI_GATEWAY_ID = "gateway";

      global.fetch = jest.fn(async () =>
        new Response(JSON.stringify({ result: {} }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      ) as unknown as typeof fetch;

      const blob = new Blob(["image"], { type: "image/png" });
      const result = await cloudflare.runWorkersAi("model", blob);

      expect(result).toEqual({ error: "No image in JSON." });
    });

    it("handles JSON parse failures by returning an error", async () => {
      process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
      process.env.CLOUDFLARE_AI_GATEWAY_ID = "gateway";

      global.fetch = jest.fn(async () => {
        const response = new Response("{}", {
          status: 200,
          headers: { "content-type": "application/json" },
        });
        jest.spyOn(response, "json").mockRejectedValue(new Error("boom"));
        return response;
      }) as unknown as typeof fetch;

      const blob = new Blob(["image"], { type: "image/png" });
      const result = await cloudflare.runWorkersAi("model", blob);

      expect(result).toEqual({ error: "No image in JSON." });
    });

    it("aborts the request when the preprocess budget elapses", async () => {
      jest.useFakeTimers();
      process.env.CLOUDFLARE_ACCOUNT_ID = "acct";
      process.env.CLOUDFLARE_API_TOKEN = "token";
      delete process.env.CLOUDFLARE_AI_GATEWAY_ID;

      global.fetch = jest.fn((_, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        })
      ) as unknown as typeof fetch;

      try {
        const blob = new Blob(["image"], { type: "image/png" });
        const promise = cloudflare.runWorkersAi("model", blob);

        jest.advanceTimersByTime(BUDGET.preprocessMs + 1);

        await expect(promise).rejects.toThrow("aborted");
        expect(global.fetch).toHaveBeenCalledTimes(1);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe("formatWorkersAiOutput", () => {
    it("uses the provided content type", () => {
      const started = 1000;
      const now = 1100;
      const body = new Uint8Array([1, 2]).buffer;
      const result = cloudflare.formatWorkersAiOutput({ contentType: "image/jpeg", body }, started, now);

      expect(result).toEqual({
        result: { url: expect.stringMatching(/^data:image\/jpeg;base64,/), width: 0, height: 0 },
        metrics: { preprocessMs: now - started },
      });
    });

    it("defaults to PNG when the content type is missing", () => {
      const started = 2000;
      const now = 2100;
      const body = new Uint8Array([3, 4]).buffer;
      const result = cloudflare.formatWorkersAiOutput({ body }, started, now);

      expect(result).toEqual({
        result: { url: expect.stringMatching(/^data:image\/png;base64,/), width: 0, height: 0 },
        metrics: { preprocessMs: now - started },
      });
    });
  });
});

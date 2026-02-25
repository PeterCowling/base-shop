import crypto from "node:crypto";

import handler from "../src/index";

beforeAll(() => {
  // Ensure WebCrypto is available for the worker token verifier.
  // Jest runs in JSDOM; `window.crypto` may exist without `subtle`.
  const { webcrypto } = crypto;
  Object.defineProperty(globalThis, "crypto", { value: webcrypto });
  if (typeof window !== "undefined") {
    Object.defineProperty(window, "crypto", { value: webcrypto });
  }
});

function makeToken(secret: string, options?: { iat?: number; exp?: number; nonce?: string }): string {
  const iat = options?.iat ?? Math.floor(Date.now() / 1000);
  const exp = options?.exp ?? iat + 15 * 60;
  const nonce = options?.nonce ?? crypto.randomBytes(12).toString("base64url");
  const payload = `v1.${iat}.${exp}.${nonce}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

describe("xa-drop-worker", () => {
  const secret = "test-xa-drop-upload-secret-32-chars!!";

  it("responds to health checks", async () => {
    const res = await handler.fetch(new Request("https://drop.example/health"), {
      SUBMISSIONS_BUCKET: {} as unknown as R2Bucket,
      UPLOAD_TOKEN_SECRET: secret,
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("handles CORS preflight for uploads", async () => {
    const token = makeToken(secret);
    const res = await handler.fetch(
      new Request(`https://drop.example/upload/${token}`, {
        method: "OPTIONS",
        headers: { Origin: "https://uploader.example" },
      }),
      {
        SUBMISSIONS_BUCKET: {} as unknown as R2Bucket,
        UPLOAD_TOKEN_SECRET: secret,
        UPLOAD_ALLOWED_ORIGINS: "https://uploader.example",
      },
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("https://uploader.example");
  });

  it("rejects CORS preflight when origin is not allowlisted", async () => {
    const token = makeToken(secret);
    const res = await handler.fetch(
      new Request(`https://drop.example/upload/${token}`, {
        method: "OPTIONS",
        headers: { Origin: "https://evil.example" },
      }),
      {
        SUBMISSIONS_BUCKET: {} as unknown as R2Bucket,
        UPLOAD_TOKEN_SECRET: secret,
        UPLOAD_ALLOWED_ORIGINS: "https://uploader.example",
      },
    );
    expect(res.status).toBe(403);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("rejects invalid tokens", async () => {
    const bucket = { head: jest.fn(), put: jest.fn() } as unknown as R2Bucket;
    const res = await handler.fetch(
      new Request("https://drop.example/upload/invalid", { method: "PUT", body: new Uint8Array([1, 2, 3]) }),
      { SUBMISSIONS_BUCKET: bucket, UPLOAD_TOKEN_SECRET: secret },
    );
    expect(res.status).toBe(401);
    expect((bucket as any).put).not.toHaveBeenCalled();
  });

  it("stores uploads into R2 once per token/key", async () => {
    const token = makeToken(secret, { nonce: "nonce123" });
    const bucket = {
      put: jest.fn().mockResolvedValue({ key: "ok" }),
    } as unknown as R2Bucket;
    const body = new Blob([new Uint8Array([1, 2, 3])], { type: "application/zip" });

    const res = await handler.fetch(
      new Request(`https://drop.example/upload/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/zip", "Content-Length": "3" },
        body,
      }),
      { SUBMISSIONS_BUCKET: bucket, UPLOAD_TOKEN_SECRET: secret, R2_PREFIX: "submissions/" },
    );

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect((bucket as any).put).toHaveBeenCalledTimes(1);
    const key = (bucket as any).put.mock.calls[0][0] as string;
    expect(key).toContain("/incoming.nonce123.zip");
  });

  it("supports header token uploads without putting bearer credentials in URL paths", async () => {
    const token = makeToken(secret, { nonce: "nonce123" });
    const bucket = {
      put: jest.fn().mockResolvedValue({ key: "ok" }),
    } as unknown as R2Bucket;

    const res = await handler.fetch(
      new Request("https://drop.example/upload", {
        method: "PUT",
        headers: {
          "Content-Type": "application/zip",
          "Content-Length": "3",
          "X-XA-Upload-Token": token,
        },
        body: new Uint8Array([1, 2, 3]),
      }),
      { SUBMISSIONS_BUCKET: bucket, UPLOAD_TOKEN_SECRET: secret, R2_PREFIX: "submissions/" },
    );

    expect(res.status).toBe(201);
    expect((bucket as any).put).toHaveBeenCalledTimes(1);
  });

  it("rejects overwriting an existing key", async () => {
    const token = makeToken(secret, { nonce: "nonce123" });
    const bucket = {
      put: jest.fn().mockResolvedValue(null),
    } as unknown as R2Bucket;

    const res = await handler.fetch(
      new Request(`https://drop.example/upload/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/zip", "Content-Length": "3" },
        body: new Uint8Array([1, 2, 3]),
      }),
      { SUBMISSIONS_BUCKET: bucket, UPLOAD_TOKEN_SECRET: secret, R2_PREFIX: "submissions/" },
    );

    expect(res.status).toBe(409);
    expect((bucket as any).put).toHaveBeenCalledTimes(1);
  });

  it("publishes catalog snapshots with write-token auth", async () => {
    const bucket = {
      put: jest.fn().mockResolvedValue({ key: "ok" }),
    } as unknown as R2Bucket;

    const res = await handler.fetch(
      new Request("https://drop.example/catalog/xa-b", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-XA-Catalog-Token": "catalog-write-token-1234567890",
        },
        body: JSON.stringify({
          storefront: "xa-b",
          catalog: { products: [] },
          mediaIndex: { totals: { products: 0, media: 0, warnings: 0 }, items: [] },
        }),
      }),
      {
        SUBMISSIONS_BUCKET: bucket,
        CATALOG_WRITE_TOKEN: "catalog-write-token-1234567890",
      },
    );

    expect(res.status).toBe(201);
    const payload = await res.json();
    expect(payload).toEqual(
      expect.objectContaining({
        ok: true,
        storefront: "xa-b",
        key: "catalog/xa-b/latest.json",
      }),
    );
    expect((bucket as any).put).toHaveBeenCalledTimes(2);
    const firstKey = (bucket as any).put.mock.calls[0][0] as string;
    const secondKey = (bucket as any).put.mock.calls[1][0] as string;
    expect(firstKey).toContain("catalog/xa-b/versions/");
    expect(secondKey).toBe("catalog/xa-b/latest.json");
  });

  it("serves latest catalog with ETag support", async () => {
    const catalogBody =
      "{\"ok\":true,\"storefront\":\"xa-b\",\"version\":\"v1\",\"catalog\":{\"products\":[]},\"mediaIndex\":{\"items\":[]}}\n";
    const bucket = {
      get: jest.fn().mockResolvedValue({
        httpEtag: "etag123",
        text: jest.fn().mockResolvedValue(catalogBody),
      }),
    } as unknown as R2Bucket;

    const first = await handler.fetch(
      new Request("https://drop.example/catalog/xa-b", { method: "GET" }),
      { SUBMISSIONS_BUCKET: bucket },
    );

    expect(first.status).toBe(200);
    expect(first.headers.get("etag")).toBe("\"etag123\"");
    await expect(first.json()).resolves.toEqual(
      expect.objectContaining({
        ok: true,
        storefront: "xa-b",
      }),
    );

    const second = await handler.fetch(
      new Request("https://drop.example/catalog/xa-b", {
        method: "GET",
        headers: { "If-None-Match": "\"etag123\"" },
      }),
      { SUBMISSIONS_BUCKET: bucket },
    );

    expect(second.status).toBe(304);
  });

  it("enforces read-token auth when CATALOG_READ_TOKEN is configured", async () => {
    const bucket = {
      get: jest.fn().mockResolvedValue({
        httpEtag: "etag123",
        text: jest.fn().mockResolvedValue("{\"ok\":true,\"storefront\":\"xa-b\"}\n"),
      }),
    } as unknown as R2Bucket;

    const unauthorized = await handler.fetch(
      new Request("https://drop.example/catalog/xa-b", { method: "GET" }),
      {
        SUBMISSIONS_BUCKET: bucket,
        CATALOG_READ_TOKEN: "catalog-read-token-123456",
      },
    );
    expect(unauthorized.status).toBe(401);

    const authorized = await handler.fetch(
      new Request("https://drop.example/catalog/xa-b", {
        method: "GET",
        headers: { "X-XA-Catalog-Token": "catalog-read-token-123456" },
      }),
      {
        SUBMISSIONS_BUCKET: bucket,
        CATALOG_READ_TOKEN: "catalog-read-token-123456",
      },
    );
    expect(authorized.status).toBe(200);
  });
});

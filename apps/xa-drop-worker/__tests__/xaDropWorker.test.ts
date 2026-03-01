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

  it("rejects requests from non-allowlisted IPs when ALLOWED_IPS is configured", async () => {
    const res = await handler.fetch(
      new Request("https://drop.example/health", {
        headers: { "CF-Connecting-IP": "203.0.113.9" },
      }),
      {
        SUBMISSIONS_BUCKET: {} as unknown as R2Bucket,
        UPLOAD_TOKEN_SECRET: secret,
        ALLOWED_IPS: "198.51.100.10",
      },
    );
    expect(res.status).toBe(404);
  });

  it("allows requests from allowlisted IPs when ALLOWED_IPS is configured", async () => {
    const res = await handler.fetch(
      new Request("https://drop.example/health", {
        headers: { "CF-Connecting-IP": "198.51.100.10" },
      }),
      {
        SUBMISSIONS_BUCKET: {} as unknown as R2Bucket,
        UPLOAD_TOKEN_SECRET: secret,
        ALLOWED_IPS: "198.51.100.10",
      },
    );
    expect(res.status).toBe(200);
  });

  it("rejects invalid tokens", async () => {
    const bucket = { head: jest.fn(), put: jest.fn() } as unknown as R2Bucket;
    const res = await handler.fetch(
      new Request("https://drop.example/upload", {
        method: "PUT",
        headers: { "X-XA-Upload-Token": "invalid" },
        body: new Uint8Array([1, 2, 3]),
      }),
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
      new Request("https://drop.example/upload", {
        method: "PUT",
        headers: {
          "Content-Type": "application/zip",
          "Content-Length": "3",
          "X-XA-Upload-Token": token,
        },
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

  it("rejects url path tokens by default when legacy mode is disabled", async () => {
    const token = makeToken(secret, { nonce: "nonce-path-default-deny" });
    const bucket = {
      put: jest.fn().mockResolvedValue({ key: "ok" }),
    } as unknown as R2Bucket;

    const res = await handler.fetch(
      new Request(`https://drop.example/upload/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/zip", "Content-Length": "3" },
        body: new Uint8Array([1, 2, 3]),
      }),
      { SUBMISSIONS_BUCKET: bucket, UPLOAD_TOKEN_SECRET: secret, R2_PREFIX: "submissions/" },
    );

    expect(res.status).toBe(401);
    expect((bucket as any).put).not.toHaveBeenCalled();
  });

  it("rejects overwriting an existing key", async () => {
    const token = makeToken(secret, { nonce: "nonce123" });
    const bucket = {
      put: jest.fn().mockResolvedValue(null),
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

  it("rejects tokens whose ttl exceeds configured max", async () => {
    const iat = Math.floor(Date.now() / 1000);
    const token = makeToken(secret, { iat, exp: iat + 3600, nonce: "nonce-ttl" });
    const bucket = { put: jest.fn().mockResolvedValue({ key: "ok" }) } as unknown as R2Bucket;

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
      {
        SUBMISSIONS_BUCKET: bucket,
        UPLOAD_TOKEN_SECRET: secret,
        UPLOAD_TOKEN_MAX_TTL_SECONDS: "900",
      },
    );

    expect(res.status).toBe(401);
    expect((bucket as any).put).not.toHaveBeenCalled();
  });

  it("supports legacy url token uploads only when explicitly enabled", async () => {
    const token = makeToken(secret, { nonce: "nonce-legacy-url-token" });
    const bucket = {
      put: jest.fn().mockResolvedValue({ key: "ok" }),
    } as unknown as R2Bucket;

    const res = await handler.fetch(
      new Request(`https://drop.example/upload/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/zip", "Content-Length": "3" },
        body: new Uint8Array([1, 2, 3]),
      }),
      {
        SUBMISSIONS_BUCKET: bucket,
        UPLOAD_TOKEN_SECRET: secret,
        R2_PREFIX: "submissions/",
        UPLOAD_ALLOW_URL_TOKENS: "1",
      },
    );

    expect(res.status).toBe(201);
    expect((bucket as any).put).toHaveBeenCalledTimes(1);
  });

  it("enforces free-tier ttl cap even if env attempts a larger token ttl", async () => {
    const iat = Math.floor(Date.now() / 1000);
    const token = makeToken(secret, { iat, exp: iat + 1800, nonce: "nonce-env-ttl-cap" });
    const bucket = { put: jest.fn().mockResolvedValue({ key: "ok" }) } as unknown as R2Bucket;

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
      {
        SUBMISSIONS_BUCKET: bucket,
        UPLOAD_TOKEN_SECRET: secret,
        UPLOAD_TOKEN_MAX_TTL_SECONDS: "7200",
      },
    );

    expect(res.status).toBe(401);
    expect((bucket as any).put).not.toHaveBeenCalled();
  });

  it("stores and retrieves draft snapshots with write-token auth", async () => {
    const bucketState = new Map<string, string>();
    const bucket = {
      get: jest.fn(async (key: string) => {
        const body = bucketState.get(key);
        if (!body) return null;
        return { text: jest.fn().mockResolvedValue(body) };
      }),
      put: jest.fn(async (key: string, body: string) => {
        bucketState.set(key, body);
        return { key };
      }),
      delete: jest.fn(async (key: string) => {
        bucketState.delete(key);
      }),
    } as unknown as R2Bucket;

    const write = await handler.fetch(
      new Request("https://drop.example/drafts/xa-b", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-XA-Catalog-Token": "catalog-write-token-1234567890",
        },
        body: JSON.stringify({
          storefront: "xa-b",
          products: [{ id: "p1", slug: "studio-jacket" }],
          revisionsById: { p1: "rev-1" },
        }),
      }),
      {
        SUBMISSIONS_BUCKET: bucket,
        CATALOG_WRITE_TOKEN: "catalog-write-token-1234567890",
      },
    );
    expect(write.status).toBe(201);
    const writePayload = await write.json() as { docRevision?: string };
    expect(writePayload.docRevision).toBeTruthy();

    const read = await handler.fetch(
      new Request("https://drop.example/drafts/xa-b", {
        headers: { "X-XA-Catalog-Token": "catalog-write-token-1234567890" },
      }),
      {
        SUBMISSIONS_BUCKET: bucket,
        CATALOG_WRITE_TOKEN: "catalog-write-token-1234567890",
      },
    );
    expect(read.status).toBe(200);
    await expect(read.json()).resolves.toEqual(
      expect.objectContaining({
        ok: true,
        storefront: "xa-b",
        products: [{ id: "p1", slug: "studio-jacket" }],
      }),
    );

    const remove = await handler.fetch(
      new Request("https://drop.example/drafts/xa-b", {
        method: "DELETE",
        headers: { "X-XA-Catalog-Token": "catalog-write-token-1234567890" },
      }),
      {
        SUBMISSIONS_BUCKET: bucket,
        CATALOG_WRITE_TOKEN: "catalog-write-token-1234567890",
      },
    );
    expect(remove.status).toBe(200);
    expect((bucket as any).delete).toHaveBeenCalled();
  });

  it("enforces read-token auth for draft GET when configured", async () => {
    const bucketState = new Map<string, string>();
    bucketState.set(
      "catalog/drafts/xa-b/latest.json",
      JSON.stringify({
        ok: true,
        storefront: "xa-b",
        docRevision: "doc-rev-1",
        products: [{ id: "p1", slug: "studio-jacket", title: "Studio Jacket" }],
        revisionsById: { p1: "rev-1" },
      }),
    );
    const bucket = {
      get: jest.fn(async (key: string) => {
        const body = bucketState.get(key);
        if (!body) return null;
        return { text: jest.fn().mockResolvedValue(body) };
      }),
    } as unknown as R2Bucket;

    const unauthorized = await handler.fetch(
      new Request("https://drop.example/drafts/xa-b"),
      {
        SUBMISSIONS_BUCKET: bucket,
        CATALOG_WRITE_TOKEN: "catalog-write-token-1234567890",
        CATALOG_READ_TOKEN: "catalog-read-token-1234567890",
      },
    );
    expect(unauthorized.status).toBe(401);

    const authorized = await handler.fetch(
      new Request("https://drop.example/drafts/xa-b", {
        headers: { "X-XA-Catalog-Token": "catalog-read-token-1234567890" },
      }),
      {
        SUBMISSIONS_BUCKET: bucket,
        CATALOG_WRITE_TOKEN: "catalog-write-token-1234567890",
        CATALOG_READ_TOKEN: "catalog-read-token-1234567890",
      },
    );
    expect(authorized.status).toBe(200);
  });

  it("returns draft conflict when ifMatchDocRevision does not match latest", async () => {
    const bucket = {
      get: jest.fn().mockResolvedValue({
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            ok: true,
            storefront: "xa-b",
            docRevision: "doc-rev-1",
            products: [],
            revisionsById: {},
          }),
        ),
      }),
      put: jest.fn(),
    } as unknown as R2Bucket;

    const res = await handler.fetch(
      new Request("https://drop.example/drafts/xa-b", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-XA-Catalog-Token": "catalog-write-token-1234567890",
        },
        body: JSON.stringify({
          storefront: "xa-b",
          products: [],
          revisionsById: {},
          ifMatchDocRevision: "doc-rev-old",
        }),
      }),
      {
        SUBMISSIONS_BUCKET: bucket,
        CATALOG_WRITE_TOKEN: "catalog-write-token-1234567890",
      },
    );

    expect(res.status).toBe(409);
    expect((bucket as any).put).not.toHaveBeenCalled();
  });
});

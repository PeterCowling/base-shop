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
    const res = await handler.fetch(new Request(`https://drop.example/upload/${token}`, { method: "OPTIONS" }), {
      SUBMISSIONS_BUCKET: {} as unknown as R2Bucket,
      UPLOAD_TOKEN_SECRET: secret,
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
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
      head: jest.fn().mockResolvedValue(null),
      put: jest.fn().mockResolvedValue(undefined),
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

  it("rejects overwriting an existing key", async () => {
    const token = makeToken(secret, { nonce: "nonce123" });
    const bucket = {
      head: jest.fn().mockResolvedValue({ key: "already-there" }),
      put: jest.fn().mockResolvedValue(undefined),
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
    expect((bucket as any).put).not.toHaveBeenCalled();
  });
});

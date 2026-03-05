import crypto from "node:crypto";

import { describe, expect, it } from "@jest/globals";

import handler from "../src/index";

beforeAll(() => {
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

describe("xa-drop-worker edge branches", () => {
  const secret = "test-xa-drop-upload-secret-32-chars!!";

  it("returns 503 when upload token secret is too short", async () => {
    const token = makeToken("short-secret", { nonce: "n1" });
    const res = await handler.fetch(
      new Request("https://drop.example/upload", {
        method: "PUT",
        headers: {
          "X-XA-Upload-Token": token,
          "Content-Type": "application/zip",
          "Content-Length": "3",
        },
        body: new Uint8Array([1, 2, 3]),
      }),
      {
        SUBMISSIONS_BUCKET: { put: async () => ({ key: "x" }) } as unknown as R2Bucket,
        UPLOAD_TOKEN_SECRET: "short-secret",
      },
    );

    expect(res.status).toBe(503);
  });

  it("returns 503 when catalog write token is missing", async () => {
    const res = await handler.fetch(
      new Request("https://drop.example/catalog/xa-b", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront: "xa-b", catalog: {}, mediaIndex: {} }),
      }),
      {
        SUBMISSIONS_BUCKET: { put: async () => ({ key: "x" }) } as unknown as R2Bucket,
      },
    );

    expect(res.status).toBe(503);
  });

  it("returns 410 for expired upload token", async () => {
    const iat = Math.floor(Date.now() / 1000) - 3600;
    const token = makeToken(secret, { iat, exp: iat + 1, nonce: "n-expired" });

    const res = await handler.fetch(
      new Request("https://drop.example/upload", {
        method: "PUT",
        headers: {
          "X-XA-Upload-Token": token,
          "Content-Type": "application/zip",
          "Content-Length": "3",
        },
        body: new Uint8Array([1, 2, 3]),
      }),
      {
        SUBMISSIONS_BUCKET: { put: async () => ({ key: "x" }) } as unknown as R2Bucket,
        UPLOAD_TOKEN_SECRET: secret,
      },
    );

    expect(res.status).toBe(410);
  });

  it("returns 413 when upload content-length exceeds configured max", async () => {
    const token = makeToken(secret, { nonce: "n-large" });

    const res = await handler.fetch(
      new Request("https://drop.example/upload", {
        method: "PUT",
        headers: {
          "X-XA-Upload-Token": token,
          "Content-Type": "application/zip",
          "Content-Length": "5000",
        },
        body: new Uint8Array([1, 2, 3]),
      }),
      {
        SUBMISSIONS_BUCKET: { put: async () => ({ key: "x" }) } as unknown as R2Bucket,
        UPLOAD_TOKEN_SECRET: secret,
        MAX_BYTES: "100",
      },
    );

    expect(res.status).toBe(413);
  });

  it("returns 413 when streamed upload body exceeds max bytes", async () => {
    const token = makeToken(secret, { nonce: "n-stream-large" });

    const res = await handler.fetch(
      new Request("https://drop.example/upload", {
        method: "PUT",
        headers: {
          "X-XA-Upload-Token": token,
          "Content-Type": "application/zip",
        },
        body: new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new Uint8Array([1, 2, 3]));
            controller.enqueue(new Uint8Array([4, 5, 6]));
            controller.close();
          },
        }),
        duplex: "half",
      } as RequestInit),
      {
        SUBMISSIONS_BUCKET: {
          put: async (_key: string, body: unknown) => {
            if (
              body &&
              typeof body === "object" &&
              "getReader" in (body as { getReader?: unknown })
            ) {
              const reader = (body as ReadableStream<Uint8Array>).getReader();
              let total = 0;
              while (true) {
                const next = await reader.read();
                if (next.done) break;
                total += next.value.byteLength;
              }
              return total > 5 ? Promise.reject(new Error("too_large")) : { key: "x" };
            }
            return { key: "x" };
          },
        } as unknown as R2Bucket,
        UPLOAD_TOKEN_SECRET: secret,
        MAX_BYTES: "5",
      },
    );

    expect(res.status).toBe(413);
  });

  it("returns 400 for malformed draft payload", async () => {
    const res = await handler.fetch(
      new Request("https://drop.example/drafts/xa-b", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-XA-Catalog-Token": "catalog-write-token-1234567890",
        },
        body: JSON.stringify({ storefront: "xa-b", products: [{ bad: true }], revisionsById: {} }),
      }),
      {
        SUBMISSIONS_BUCKET: { put: async () => ({ key: "x" }), get: async () => null } as unknown as R2Bucket,
        CATALOG_WRITE_TOKEN: "catalog-write-token-1234567890",
      },
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for malformed catalog publish payload", async () => {
    const res = await handler.fetch(
      new Request("https://drop.example/catalog/xa-b", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-XA-Catalog-Token": "catalog-write-token-1234567890",
        },
        body: JSON.stringify({ storefront: "xa-b", catalog: "bad", mediaIndex: null }),
      }),
      {
        SUBMISSIONS_BUCKET: { put: async () => ({ key: "x" }) } as unknown as R2Bucket,
        CATALOG_WRITE_TOKEN: "catalog-write-token-1234567890",
      },
    );

    expect(res.status).toBe(400);
  });

  it("returns 304 when If-None-Match matches normalized unquoted etag", async () => {
    const res = await handler.fetch(
      new Request("https://drop.example/catalog/xa-b", {
        method: "GET",
        headers: { "If-None-Match": "\"etag123\"" },
      }),
      {
        SUBMISSIONS_BUCKET: {
          get: async () =>
            ({
              httpEtag: "etag123",
              text: async () => "{\"ok\":true}\n",
            }) as unknown,
        } as unknown as R2Bucket,
      },
    );

    expect(res.status).toBe(304);
  });

  it("returns 502 when stored draft JSON is corrupted", async () => {
    const res = await handler.fetch(
      new Request("https://drop.example/drafts/xa-b", {
        method: "GET",
        headers: { "X-XA-Catalog-Token": "catalog-write-token-1234567890" },
      }),
      {
        SUBMISSIONS_BUCKET: {
          get: async () =>
            ({
              text: async () => "{bad-json",
            }) as unknown,
        } as unknown as R2Bucket,
        CATALOG_WRITE_TOKEN: "catalog-write-token-1234567890",
      },
    );

    expect(res.status).toBe(502);
  });

  it("returns 404 for unsupported method on catalog route", async () => {
    const res = await handler.fetch(
      new Request("https://drop.example/catalog/xa-b", { method: "POST" }),
      {
        SUBMISSIONS_BUCKET: { get: async () => null } as unknown as R2Bucket,
      },
    );

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid storefront ids", async () => {
    const res = await handler.fetch(
      new Request("https://drop.example/catalog/INVALID_STORE", { method: "GET" }),
      {
        SUBMISSIONS_BUCKET: { get: async () => null } as unknown as R2Bucket,
      },
    );

    expect(res.status).toBe(400);
  });

  it("returns 401 for deploy trigger without valid token", async () => {
    const res = await handler.fetch(
      new Request("https://drop.example/deploy/xa-b", { method: "POST" }),
      {
        SUBMISSIONS_BUCKET: { get: async () => null } as unknown as R2Bucket,
        XA_DEPLOY_TRIGGER_TOKEN: "deploy-trigger-token-1234567890",
        XA_GITHUB_ACTIONS_TOKEN: "gh-actions-token",
      },
    );

    expect(res.status).toBe(401);
  });

  it("dispatches xa-b redeploy workflow on deploy trigger", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(null, { status: 204 }),
      );

    const res = await handler.fetch(
      new Request("https://drop.example/deploy/xa-b", {
        method: "POST",
        headers: { "X-XA-Deploy-Token": "deploy-trigger-token-1234567890" },
      }),
      {
        SUBMISSIONS_BUCKET: { get: async () => null } as unknown as R2Bucket,
        XA_DEPLOY_TRIGGER_TOKEN: "deploy-trigger-token-1234567890",
        XA_GITHUB_ACTIONS_TOKEN: "gh-actions-token",
        XA_GITHUB_REPO_OWNER: "petercowling",
        XA_GITHUB_REPO_NAME: "base-shop",
        XA_GITHUB_WORKFLOW_FILE: "xa-b-redeploy.yml",
        XA_GITHUB_WORKFLOW_REF: "dev",
      },
    );

    expect(res.status).toBe(202);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({
        ok: true,
        provider: "github_actions",
        workflow: "xa-b-redeploy.yml",
        ref: "dev",
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const dispatchCall = fetchMock.mock.calls[0];
    expect(dispatchCall?.[0]).toBe(
      "https://api.github.com/repos/petercowling/base-shop/actions/workflows/xa-b-redeploy.yml/dispatches",
    );
    const dispatchInit = dispatchCall?.[1] as RequestInit;
    expect(dispatchInit.method).toBe("POST");
    expect(dispatchInit.body).toBe(
      JSON.stringify({
        ref: "dev",
        inputs: {
          storefront: "xa-b",
          reason: "xa-uploader-sync",
        },
      }),
    );

    fetchMock.mockRestore();
  });
});

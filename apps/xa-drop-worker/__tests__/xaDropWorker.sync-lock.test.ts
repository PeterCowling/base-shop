import crypto from "node:crypto";

import { beforeAll, describe, expect, it } from "@jest/globals";

import handler from "../src/index";

beforeAll(() => {
  const { webcrypto } = crypto;
  Object.defineProperty(globalThis, "crypto", { value: webcrypto });
  if (typeof window !== "undefined") {
    Object.defineProperty(window, "crypto", { value: webcrypto });
  }
});

function createLockBucket(
  initialBody?: string,
  initialEtag = "etag-initial",
): R2Bucket & { putHeaders: Headers[] } {
  let body = initialBody ?? null;
  let etag = initialBody ? initialEtag : null;
  const putHeaders: Headers[] = [];
  let putCount = 0;

  return {
    putHeaders,
    async get() {
      if (!body || !etag) return null;
      return {
        httpEtag: etag,
        text: async () => body,
      } as unknown;
    },
    async put(_key: string, nextBody: string, options?: { onlyIf?: Headers }) {
      const onlyIf = options?.onlyIf;
      if (onlyIf?.get("If-None-Match") === "*" && body !== null) {
        throw new Error("precondition failed");
      }
      const ifMatch = onlyIf?.get("If-Match");
      if (ifMatch) {
        const normalizedCurrent = etag?.startsWith("\"") ? etag : `"${etag}"`;
        if (!etag || ifMatch !== normalizedCurrent) {
          throw new Error("precondition failed");
        }
      }

      body = nextBody;
      putCount += 1;
      etag = `etag-${putCount}`;
      if (onlyIf) putHeaders.push(onlyIf);
      return { key: "catalog/drafts/xa-b/sync-lock.json" } as unknown;
    },
    async delete() {
      body = null;
      etag = null;
    },
  } as unknown as R2Bucket & { putHeaders: Headers[] };
}

describe("xa-drop-worker sync lock route", () => {
  it("creates a draft sync lock with If-None-Match when no lock exists", async () => {
    const bucket = createLockBucket();
    const res = await handler.fetch(
      new Request("https://drop.example/drafts/xa-b/sync-lock", {
        method: "POST",
        headers: {
          "X-XA-Catalog-Token": "catalog-write-token-1234567890",
        },
      }),
      {
        SUBMISSIONS_BUCKET: bucket,
        CATALOG_WRITE_TOKEN: "catalog-write-token-1234567890",
      },
    );

    expect(res.status).toBe(201);
    const payload = await res.json();
    expect(payload.ok).toBe(true);
    expect(typeof payload.ownerToken).toBe("string");
    expect(bucket.putHeaders[0]?.get("If-None-Match")).toBe("*");
  });

  it("returns 409 when an active draft sync lock already exists", async () => {
    const bucket = createLockBucket(
      JSON.stringify({
        storefront: "xa-b",
        ownerToken: "existing-owner",
        acquiredAt: "2026-03-05T21:00:00.000Z",
        expiresAt: "2999-01-01T00:00:00.000Z",
      }),
    );
    const res = await handler.fetch(
      new Request("https://drop.example/drafts/xa-b/sync-lock", {
        method: "POST",
        headers: {
          "X-XA-Catalog-Token": "catalog-write-token-1234567890",
        },
      }),
      {
        SUBMISSIONS_BUCKET: bucket,
        CATALOG_WRITE_TOKEN: "catalog-write-token-1234567890",
      },
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(
      expect.objectContaining({ ok: false, error: "conflict", reason: "sync_lock_held" }),
    );
  });

  it("takes over an expired draft sync lock with If-Match", async () => {
    const bucket = createLockBucket(
      JSON.stringify({
        storefront: "xa-b",
        ownerToken: "expired-owner",
        acquiredAt: "2020-01-01T00:00:00.000Z",
        expiresAt: "2020-01-01T00:05:00.000Z",
      }),
      "etag-expired",
    );
    const res = await handler.fetch(
      new Request("https://drop.example/drafts/xa-b/sync-lock", {
        method: "POST",
        headers: {
          "X-XA-Catalog-Token": "catalog-write-token-1234567890",
        },
      }),
      {
        SUBMISSIONS_BUCKET: bucket,
        CATALOG_WRITE_TOKEN: "catalog-write-token-1234567890",
      },
    );

    expect(res.status).toBe(201);
    expect(bucket.putHeaders[0]?.get("If-Match")).toBe("\"etag-expired\"");
  });

  it("returns 409 when sync lock release uses a stale owner token", async () => {
    const bucket = createLockBucket(
      JSON.stringify({
        storefront: "xa-b",
        ownerToken: "current-owner",
        acquiredAt: "2026-03-05T21:00:00.000Z",
        expiresAt: "2999-01-01T00:00:00.000Z",
      }),
    );
    const res = await handler.fetch(
      new Request("https://drop.example/drafts/xa-b/sync-lock", {
        method: "DELETE",
        headers: {
          "X-XA-Catalog-Token": "catalog-write-token-1234567890",
          "X-XA-Sync-Lock-Owner": "stale-owner",
        },
      }),
      {
        SUBMISSIONS_BUCKET: bucket,
        CATALOG_WRITE_TOKEN: "catalog-write-token-1234567890",
      },
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual(
      expect.objectContaining({ ok: false, error: "conflict", reason: "sync_lock_stale_owner" }),
    );
  });
});

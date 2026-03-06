import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { EventEmitter } from "node:events";

import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { __clearRateLimitStoreForTests } from "../../../../../lib/rateLimit";

const spawnMock = jest.fn();
const accessMock = jest.fn();
const mkdirMock = jest.fn();
const readFileMock = jest.fn();
const writeFileMock = jest.fn();
const renameMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const getCatalogSyncInputStatusMock = jest.fn();
const publishCatalogArtifactsToContractMock = jest.fn();
const publishCatalogPayloadToContractMock = jest.fn();
const getCatalogContractReadinessMock = jest.fn();
const readCloudDraftSnapshotMock = jest.fn();
const writeCloudDraftSnapshotMock = jest.fn();
const acquireCloudSyncLockMock = jest.fn();
const releaseCloudSyncLockMock = jest.fn();
const buildCatalogArtifactsFromDraftsMock = jest.fn();
const getMediaBucketMock = jest.fn();
const DEFAULT_CURRENCY_RATES_JSON = '{"EUR":0.92,"GBP":0.78,"AUD":1.5}';
const DEFAULT_GENERATED_CATALOG_JSON = '{"products":[{"slug":"studio-jacket"}]}';

jest.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));

jest.mock("node:fs/promises", () => ({
  __esModule: true,
  default: {
    access: (...args: unknown[]) => accessMock(...args),
    mkdir: (...args: unknown[]) => mkdirMock(...args),
    readFile: (...args: unknown[]) => readFileMock(...args),
    writeFile: (...args: unknown[]) => writeFileMock(...args),
    rename: (...args: unknown[]) => renameMock(...args),
  },
}));

jest.mock("../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../lib/repoRoot", () => ({
  resolveRepoRoot: () => "/repo",
}));

jest.mock("../../../../../lib/catalogCsv", () => ({
  resolveXaUploaderProductsCsvPath: () => "/repo/apps/xa-uploader/data/products.xa-b.csv",
}));

jest.mock("../../../../../lib/catalogSyncInput", () => ({
  getCatalogSyncInputStatus: (...args: unknown[]) => getCatalogSyncInputStatusMock(...args),
}));

jest.mock("../../../../../lib/catalogContractClient", () => ({
  publishCatalogArtifactsToContract: (...args: unknown[]) => publishCatalogArtifactsToContractMock(...args),
  publishCatalogPayloadToContract: (...args: unknown[]) => publishCatalogPayloadToContractMock(...args),
  getCatalogContractReadiness: () => getCatalogContractReadinessMock(),
}));

jest.mock("../../../../../lib/catalogDraftContractClient", () => ({
  readCloudDraftSnapshot: (...args: unknown[]) => readCloudDraftSnapshotMock(...args),
  writeCloudDraftSnapshot: (...args: unknown[]) => writeCloudDraftSnapshotMock(...args),
  acquireCloudSyncLock: (...args: unknown[]) => acquireCloudSyncLockMock(...args),
  releaseCloudSyncLock: (...args: unknown[]) => releaseCloudSyncLockMock(...args),
}));

jest.mock("../../../../../lib/catalogDraftToContract", () => ({
  buildCatalogArtifactsFromDrafts: (...args: unknown[]) => buildCatalogArtifactsFromDraftsMock(...args),
}));

jest.mock("../../../../../lib/r2Media", () => ({
  getMediaBucket: (...args: unknown[]) => getMediaBucketMock(...args),
}));

const getUploaderKvMock = jest.fn();
const acquireSyncMutexMock = jest.fn();
const releaseSyncMutexMock = jest.fn();

jest.mock("../../../../../lib/syncMutex", () => ({
  getUploaderKv: (...args: unknown[]) => getUploaderKvMock(...args),
  acquireSyncMutex: (...args: unknown[]) => acquireSyncMutexMock(...args),
  releaseSyncMutex: (...args: unknown[]) => releaseSyncMutexMock(...args),
}));

function createChild(code: number): ChildProcessWithoutNullStreams {
  const child = new EventEmitter() as ChildProcessWithoutNullStreams;
  const childStdout = new EventEmitter();
  const childStderr = new EventEmitter();
  Object.assign(child, { stdout: childStdout, stderr: childStderr });
  process.nextTick(() => child.emit("close", code));
  return child;
}

describe("catalog sync route branch coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __clearRateLimitStoreForTests();
    hasUploaderSessionMock.mockResolvedValue(true);
    mkdirMock.mockResolvedValue(undefined);
    accessMock.mockResolvedValue(undefined);
    readFileMock.mockImplementation(async (targetPath: string) => {
      if (targetPath.endsWith("currency-rates.json")) {
        return DEFAULT_CURRENCY_RATES_JSON;
      }
      if (targetPath.endsWith("catalog.json")) {
        return DEFAULT_GENERATED_CATALOG_JSON;
      }
      throw Object.assign(new Error("not found"), { code: "ENOENT" });
    });
    writeFileMock.mockResolvedValue(undefined);
    renameMock.mockResolvedValue(undefined);
    getCatalogSyncInputStatusMock.mockResolvedValue({ exists: true, rowCount: 1 });
    publishCatalogArtifactsToContractMock.mockResolvedValue({
      version: "v-test",
      publishedAt: "2026-02-24T00:00:00.000Z",
    });
    publishCatalogPayloadToContractMock.mockResolvedValue({
      version: "v-cloud",
      publishedAt: "2026-02-24T00:00:00.000Z",
    });
    getCatalogContractReadinessMock.mockReturnValue({ configured: true, errors: [] });
    readCloudDraftSnapshotMock.mockResolvedValue({
      products: [{ slug: "studio-jacket", title: "Studio Jacket", publishState: "live" }],
      revisionsById: {},
      docRevision: "doc-1",
    });
    writeCloudDraftSnapshotMock.mockResolvedValue({ docRevision: "doc-2" });
    acquireCloudSyncLockMock.mockResolvedValue({
      status: "acquired",
      lock: { storefront: "xa-b", ownerToken: "lock-owner-1", expiresAt: "2999-01-01T00:00:00.000Z" },
    });
    releaseCloudSyncLockMock.mockResolvedValue(undefined);
    buildCatalogArtifactsFromDraftsMock.mockReturnValue({
      catalog: { collections: [], brands: [], products: [{ slug: "studio-jacket" }] },
      mediaIndex: { totals: { products: 1, media: 0, warnings: 0 }, items: [] },
      warnings: [],
    });
    getMediaBucketMock.mockResolvedValue(null);
    getUploaderKvMock.mockResolvedValue(null);
    acquireSyncMutexMock.mockResolvedValue(true);
    releaseSyncMutexMock.mockResolvedValue(undefined);
    delete process.env.XA_UPLOADER_MODE;
    delete process.env.XA_UPLOADER_LOCAL_FS_DISABLED;
    delete process.env.XA_B_DEPLOY_HOOK_URL;
    delete process.env.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS;
    delete process.env.XA_B_DEPLOY_HOOK_TIMEOUT_MS;
    delete process.env.XA_B_DEPLOY_HOOK_MAX_RETRIES;
    delete process.env.XA_B_DEPLOY_HOOK_REQUIRED;
  });

  it("GET returns 404 in vendor mode", async () => {
    process.env.XA_UPLOADER_MODE = "vendor";
    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/sync?storefront=xa-b"));
    expect(response.status).toBe(404);
    expect(response.headers.get("X-RateLimit-Limit")).toBeNull();
  });

  it("GET returns 404 when unauthenticated", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(false);
    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/sync?storefront=xa-b"));
    expect(response.status).toBe(404);
    expect(response.headers.get("X-RateLimit-Limit")).toBeNull();
  });

  it("POST returns 404 in vendor mode", async () => {
    process.env.XA_UPLOADER_MODE = "vendor";
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront: "xa-b", options: {} }),
      }),
    );
    expect(response.status).toBe(404);
    expect(response.headers.get("X-RateLimit-Limit")).toBeNull();
  });

  it("POST returns 404 when unauthenticated", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(false);
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront: "xa-b", options: {} }),
      }),
    );
    expect(response.status).toBe(404);
    expect(response.headers.get("X-RateLimit-Limit")).toBeNull();
  });

  it("POST returns invalid_json for malformed payload", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{bad-json",
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "invalid", reason: "invalid_json" }),
    );
  });

  it("POST returns payload_too_large for oversized payload", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: "x".repeat(40_000) }),
      }),
    );
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "payload_too_large", reason: "payload_too_large" }),
    );
  });

  it("skips publish when dryRun=true", async () => {
    spawnMock.mockImplementation(() => createChild(0));
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storefront: "xa-b",
          options: { strict: true, recursive: true, dryRun: true },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ ok: true, dryRun: true }));
    expect(publishCatalogArtifactsToContractMock).not.toHaveBeenCalled();
  });

  it("reports catalog_publish_failed for non-unconfigured publish errors", async () => {
    spawnMock.mockImplementation(() => createChild(0));
    publishCatalogArtifactsToContractMock.mockRejectedValue({
      code: "request_failed",
      status: 500,
      details: "upstream unavailable",
    });
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      const { POST } = await import("../route");
      const response = await POST(
        new Request("http://localhost/api/catalog/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storefront: "xa-b",
            options: { strict: true, recursive: true },
          }),
        }),
      );

      expect(response.status).toBe(502);
      expect(await response.json()).toEqual(
        expect.objectContaining({
          ok: false,
          error: "catalog_publish_failed",
          recovery: "review_catalog_contract",
        }),
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it("POST rate limits after the configured number of sync calls", async () => {
    spawnMock.mockImplementation(() => createChild(0));
    const { POST } = await import("../route");
    const req = () =>
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", "cf-connecting-ip": "203.0.113.99" },
        body: JSON.stringify({ storefront: "xa-b", options: { strict: true, recursive: true } }),
      });

    expect((await POST(req())).status).toBe(200);
    expect((await POST(req())).status).toBe(200);
    expect((await POST(req())).status).toBe(200);
    const fourth = await POST(req());
    expect(fourth.status).toBe(429);
    expect(fourth.headers.get("X-RateLimit-Limit")).toBe("3");
    expect(await fourth.json()).toEqual(
      expect.objectContaining({ ok: false, error: "rate_limited", reason: "sync_rate_limited" }),
    );
  });

  it("GET cloud mode reports contract-based readiness when local fs is disabled", async () => {
    process.env.XA_UPLOADER_LOCAL_FS_DISABLED = "1";
    getCatalogContractReadinessMock.mockReturnValue({ configured: false, errors: ["missing contract"] });

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/sync?storefront=xa-b"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        ready: false,
        mode: "cloud",
        contractConfigured: false,
        contractConfigErrors: ["missing contract"],
      }),
    );
  });

  it("triggers xa-b deploy hook after successful publish when configured", async () => {
    spawnMock.mockImplementation(() => createChild(0));
    process.env.XA_B_DEPLOY_HOOK_URL = "https://deploy.example/hook";

    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response("", { status: 200 }),
    );

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storefront: "xa-b",
          options: { strict: true, recursive: true },
        }),
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.deploy).toEqual(expect.objectContaining({ status: "triggered" }));
    expect(payload.display).toEqual(
      expect.objectContaining({
        requiresXaBBuild: false,
        nextAction: "await_xa_b_deploy_and_verify_live",
        deployVerificationPending: true,
      }),
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://deploy.example/hook",
      expect.objectContaining({ method: "POST" }),
    );
    fetchSpy.mockRestore();
  });

  it("blocks publish when deploy hook is required but unconfigured", async () => {
    spawnMock.mockImplementation(() => createChild(0));
    process.env.XA_B_DEPLOY_HOOK_REQUIRED = "1";

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storefront: "xa-b",
          options: { strict: true, recursive: true },
        }),
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "deploy_hook_unconfigured",
        recovery: "configure_deploy_hook",
      }),
    );
    expect(publishCatalogArtifactsToContractMock).not.toHaveBeenCalled();
  });

  it("skips deploy hook when cooldown is active", async () => {
    process.env.XA_UPLOADER_LOCAL_FS_DISABLED = "1";
    process.env.XA_B_DEPLOY_HOOK_URL = "https://deploy.example/hook";
    process.env.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS = "900";

    const kvStore = new Map<string, string>();
    const kv = {
      get: jest.fn(async (key: string) => kvStore.get(key) ?? null),
      put: jest.fn(async (key: string, value: string) => {
        kvStore.set(key, value);
      }),
      delete: jest.fn(async () => undefined),
    };
    getUploaderKvMock.mockResolvedValue(kv as unknown as import("../../../../../lib/syncMutex").UploaderKvNamespace);
    acquireSyncMutexMock.mockResolvedValue(true);
    releaseSyncMutexMock.mockResolvedValue(undefined);

    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response("", { status: 200 }),
    );

    const { POST } = await import("../route");
    const request = () =>
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront: "xa-b", options: { strict: true, dryRun: false } }),
      });

    const first = await POST(request());
    expect(first.status).toBe(200);
    expect((await first.json()).deploy).toEqual(expect.objectContaining({ status: "triggered" }));

    const second = await POST(request());
    expect(second.status).toBe(200);
    const secondPayload = await second.json();
    expect(secondPayload.deploy).toEqual(expect.objectContaining({ status: "skipped_cooldown" }));
    expect(secondPayload.deployPending).toEqual(
      expect.objectContaining({ pending: true, reasonCode: "cooldown" }),
    );
    expect(secondPayload.display).toEqual(
      expect.objectContaining({
        requiresXaBBuild: true,
        nextAction: "wait_or_manual_deploy_xa_b",
      }),
    );
    expect(kv.put).toHaveBeenCalledWith(
      "xa-deploy-pending:xa-b",
      expect.any(String),
      undefined,
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore();
  });

  it("records pending deploy when hook trigger fails", async () => {
    process.env.XA_UPLOADER_LOCAL_FS_DISABLED = "1";
    process.env.XA_B_DEPLOY_HOOK_URL = "https://deploy.example/hook";
    process.env.XA_B_DEPLOY_HOOK_MAX_RETRIES = "0";

    const kvStore = new Map<string, string>();
    const kv = {
      get: jest.fn(async (key: string) => kvStore.get(key) ?? null),
      put: jest.fn(async (key: string, value: string) => {
        kvStore.set(key, value);
      }),
      delete: jest.fn(async () => undefined),
    };
    getUploaderKvMock.mockResolvedValue(kv as unknown as import("../../../../../lib/syncMutex").UploaderKvNamespace);
    acquireSyncMutexMock.mockResolvedValue(true);
    releaseSyncMutexMock.mockResolvedValue(undefined);

    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response("unavailable", { status: 503 }),
    );

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront: "xa-b", options: { strict: true, dryRun: false } }),
      }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.deploy).toEqual(expect.objectContaining({ status: "failed" }));
    expect(payload.deployPending).toEqual(
      expect.objectContaining({ pending: true, reasonCode: "failed" }),
    );
    expect(kv.put).toHaveBeenCalledWith(
      "xa-deploy-pending:xa-b",
      expect.any(String),
      undefined,
    );
    fetchSpy.mockRestore();
  });

  it("cloud warn mode prunes missing R2 keys before publish", async () => {
    process.env.XA_UPLOADER_LOCAL_FS_DISABLED = "1";

    buildCatalogArtifactsFromDraftsMock.mockReturnValue({
      catalog: {
        collections: [],
        brands: [],
        products: [
          {
            slug: "studio-jacket",
            media: [
              { type: "image", path: "xa-b/studio-jacket/ok.jpg", altText: "ok" },
              { type: "image", path: "xa-b/studio-jacket/missing.jpg", altText: "missing" },
            ],
          },
        ],
      },
      mediaIndex: {
        totals: { products: 1, media: 2, warnings: 0 },
        items: [
          {
            productSlug: "studio-jacket",
            sourcePath: "xa-b/studio-jacket/ok.jpg",
            catalogPath: "xa-b/studio-jacket/ok.jpg",
            altText: "ok",
          },
          {
            productSlug: "studio-jacket",
            sourcePath: "xa-b/studio-jacket/missing.jpg",
            catalogPath: "xa-b/studio-jacket/missing.jpg",
            altText: "missing",
          },
        ],
      },
      warnings: [],
    });

    getMediaBucketMock.mockResolvedValue({
      head: jest.fn(async (key: string) => {
        if (key.includes("missing")) return null;
        return { key };
      }),
    });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storefront: "xa-b",
          options: { mediaValidationPolicy: "warn" },
        }),
      }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.warnings).toContain("cloud_media_missing_pruned:1");
    expect(payload.counts).toEqual(expect.objectContaining({ media: 1 }));

    expect(publishCatalogPayloadToContractMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          catalog: expect.objectContaining({
            products: [
              expect.objectContaining({
                media: [expect.objectContaining({ path: "xa-b/studio-jacket/ok.jpg" })],
              }),
            ],
          }),
          mediaIndex: expect.objectContaining({
            items: [expect.objectContaining({ catalogPath: "xa-b/studio-jacket/ok.jpg" })],
          }),
        }),
      }),
    );
  });

  it("cloud strict mode blocks sync when R2 keys are missing", async () => {
    process.env.XA_UPLOADER_LOCAL_FS_DISABLED = "1";

    buildCatalogArtifactsFromDraftsMock.mockReturnValue({
      catalog: {
        collections: [],
        brands: [],
        products: [
          {
            slug: "studio-jacket",
            media: [{ type: "image", path: "xa-b/studio-jacket/missing.jpg", altText: "missing" }],
          },
        ],
      },
      mediaIndex: {
        totals: { products: 1, media: 1, warnings: 0 },
        items: [
          {
            productSlug: "studio-jacket",
            sourcePath: "xa-b/studio-jacket/missing.jpg",
            catalogPath: "xa-b/studio-jacket/missing.jpg",
            altText: "missing",
          },
        ],
      },
      warnings: [],
    });

    getMediaBucketMock.mockResolvedValue({
      head: jest.fn(async () => null),
    });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storefront: "xa-b",
          options: { mediaValidationPolicy: "strict" },
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "validation_failed",
        recovery: "review_validation_logs",
      }),
    );
    expect(publishCatalogPayloadToContractMock).not.toHaveBeenCalled();
  });
});

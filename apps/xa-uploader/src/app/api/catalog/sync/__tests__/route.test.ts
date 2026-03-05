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

function createChild(
  code: number,
  stdout = "",
  stderr = "",
): ChildProcessWithoutNullStreams {
  const child = new EventEmitter() as ChildProcessWithoutNullStreams;
  const childStdout = new EventEmitter();
  const childStderr = new EventEmitter();

  Object.assign(child, {
    stdout: childStdout,
    stderr: childStderr,
  });

  process.nextTick(() => {
    if (stdout) childStdout.emit("data", Buffer.from(stdout, "utf8"));
    if (stderr) childStderr.emit("data", Buffer.from(stderr, "utf8"));
    child.emit("close", code);
  });

  return child;
}

describe("catalog sync route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __clearRateLimitStoreForTests();
    hasUploaderSessionMock.mockResolvedValue(true);
    mkdirMock.mockResolvedValue(undefined);
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
      products: [{ slug: "studio-jacket", title: "Studio Jacket", publishState: "ready" }],
      revisionsById: {},
      docRevision: "doc-1",
    });
    buildCatalogArtifactsFromDraftsMock.mockReturnValue({
      catalog: { collections: [], brands: [], products: [{ slug: "studio-jacket" }] },
      mediaIndex: { totals: { products: 1, media: 0, warnings: 0 }, items: [] },
      warnings: [],
    });
    getMediaBucketMock.mockResolvedValue(null);
    delete process.env.XA_UPLOADER_MODE;
    delete process.env.XA_UPLOADER_EXPOSE_SYNC_LOGS;
    delete process.env.XA_UPLOADER_LOCAL_FS_DISABLED;
    delete process.env.XA_B_DEPLOY_HOOK_URL;
    delete process.env.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS;
    delete process.env.XA_B_DEPLOY_HOOK_TIMEOUT_MS;

    // Default: KV unavailable (null) → mutex skipped, existing tests unaffected
    getUploaderKvMock.mockResolvedValue(null);
    acquireSyncMutexMock.mockResolvedValue(true);
    releaseSyncMutexMock.mockResolvedValue(undefined);
  });

  it("TC-00: reports ready=true from GET when scripts exist", async () => {
    accessMock.mockResolvedValue(undefined);

    const { GET } = await import("../route");
    const response = await GET(
      new Request("http://localhost/api/catalog/sync?storefront=xa-b", {
        method: "GET",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        storefront: "xa-b",
        ready: true,
        missingScripts: [],
      }),
    );
  });

  it("TC-00b: reports ready=false from GET when scripts are missing", async () => {
    accessMock
      .mockRejectedValueOnce(new Error("missing validate script"))
      .mockRejectedValueOnce(new Error("missing sync script"));

    const { GET } = await import("../route");
    const response = await GET(
      new Request("http://localhost/api/catalog/sync?storefront=xa-b", {
        method: "GET",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        storefront: "xa-b",
        ready: false,
        missingScripts: ["validate", "sync"],
        recovery: "restore_sync_scripts",
      }),
    );
  });

  it("TC-00e: GET reports ready=true with contractConfigured=true when scripts and contract are both configured", async () => {
    accessMock.mockResolvedValue(undefined);
    getCatalogContractReadinessMock.mockReturnValue({ configured: true, errors: [] });

    const { GET } = await import("../route");
    const response = await GET(
      new Request("http://localhost/api/catalog/sync?storefront=xa-b", {
        method: "GET",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        ready: true,
        contractConfigured: true,
        contractConfigErrors: [],
      }),
    );
  });

  it("TC-00f: GET reports contractConfigured=false while local sync readiness remains true", async () => {
    accessMock.mockResolvedValue(undefined);
    getCatalogContractReadinessMock.mockReturnValue({
      configured: false,
      errors: ["XA_CATALOG_CONTRACT_BASE_URL not set"],
    });

    const { GET } = await import("../route");
    const response = await GET(
      new Request("http://localhost/api/catalog/sync?storefront=xa-b", {
        method: "GET",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        ready: true,
        contractConfigured: false,
        contractConfigErrors: ["XA_CATALOG_CONTRACT_BASE_URL not set"],
        recovery: "configure_catalog_contract",
      }),
    );
  });


  it("TC-00c: blocks missing catalog input without confirmation override", async () => {
    getCatalogSyncInputStatusMock.mockResolvedValue({ exists: false, rowCount: 0 });

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

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "catalog_input_missing",
        recovery: "create_catalog_input",
      }),
    );
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("TC-00c2: blocks empty existing CSV unless explicitly confirmed", async () => {
    getCatalogSyncInputStatusMock.mockResolvedValue({ exists: true, rowCount: 0 });

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

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "catalog_input_empty",
        recovery: "confirm_empty_catalog_sync",
        requiresConfirmation: true,
      }),
    );
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("TC-00d: allows empty catalog input when confirmEmptyInput=true", async () => {
    getCatalogSyncInputStatusMock.mockResolvedValue({ exists: true, rowCount: 0 });
    accessMock.mockResolvedValue(undefined);
    spawnMock
      .mockImplementationOnce(() => createChild(0, "validate ok", ""))
      .mockImplementationOnce(() => createChild(0, "sync ok", ""));

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storefront: "xa-b",
          options: { strict: true, recursive: true, confirmEmptyInput: true },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(spawnMock).toHaveBeenCalledTimes(2);
    expect(publishCatalogArtifactsToContractMock).toHaveBeenCalledTimes(1);
  });


  it("TC-01: returns deterministic dependency error when required scripts are missing", async () => {
    accessMock
      .mockRejectedValueOnce(new Error("missing validate script"))
      .mockRejectedValueOnce(new Error("missing sync script"));

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

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "sync_dependencies_missing",
        recovery: "restore_sync_scripts",
        missingScripts: ["validate", "sync"],
      }),
    );
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("TC-02: returns validation_failed without exposing logs by default", async () => {
    accessMock.mockResolvedValue(undefined);
    spawnMock.mockImplementationOnce(() => createChild(2, "validate stdout", "validate stderr"));

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
    expect(response.status).toBe(400);
    expect(payload).toEqual(
      expect.objectContaining({
        ok: false,
        error: "validation_failed",
        recovery: "review_validation_logs",
      }),
    );
    expect(payload.logs).toBeUndefined();
    expect(spawnMock).toHaveBeenCalledTimes(1);
    expect(publishCatalogArtifactsToContractMock).not.toHaveBeenCalled();
  });

  it("TC-03: returns sync_failed without exposing logs by default", async () => {
    accessMock.mockResolvedValue(undefined);
    spawnMock
      .mockImplementationOnce(() => createChild(0, "validate ok", ""))
      .mockImplementationOnce(() => createChild(3, "sync stdout", "sync stderr"));

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
    expect(response.status).toBe(400);
    expect(payload).toEqual(
      expect.objectContaining({
        ok: false,
        error: "sync_failed",
        recovery: "review_sync_logs",
      }),
    );
    expect(payload.logs).toBeUndefined();
    expect(spawnMock).toHaveBeenCalledTimes(2);
    expect(publishCatalogArtifactsToContractMock).not.toHaveBeenCalled();
  });

  it("TC-04: returns logs only when explicit debug exposure is enabled", async () => {
    accessMock.mockResolvedValue(undefined);
    process.env.XA_UPLOADER_EXPOSE_SYNC_LOGS = "1";
    spawnMock.mockImplementationOnce(() => createChild(2, "validate stdout", "validate stderr"));

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
    expect(response.status).toBe(400);
    expect(payload.logs?.validate).toEqual(
      expect.objectContaining({
        code: 2,
        stdout: "validate stdout",
        stderr: "validate stderr",
      }),
    );
  });

  it("TC-05: publishes generated artifacts to catalog contract after a successful sync", async () => {
    accessMock.mockResolvedValue(undefined);
    spawnMock
      .mockImplementationOnce(() => createChild(0, "validate ok", ""))
      .mockImplementationOnce(() => createChild(0, "sync ok", ""));

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
    expect(payload).toEqual(
      expect.objectContaining({
        ok: true,
        dryRun: false,
        publishedVersion: "v-test",
        display: expect.objectContaining({
          requiresXaBBuild: true,
          nextAction: "rebuild_and_deploy_xa_b",
        }),
      }),
    );
    expect(publishCatalogArtifactsToContractMock).toHaveBeenCalledWith(
      expect.objectContaining({
        storefrontId: "xa-b",
        catalogOutPath: "/repo/apps/xa-uploader/data/sync-artifacts/xa-b/catalog.json",
        mediaOutPath: "/repo/apps/xa-uploader/data/sync-artifacts/xa-b/catalog.media.json",
      }),
    );
  });


  it("TC-06: reports catalog_publish_unconfigured when contract settings are missing", async () => {
    accessMock.mockResolvedValue(undefined);
    spawnMock
      .mockImplementationOnce(() => createChild(0, "validate ok", ""))
      .mockImplementationOnce(() => createChild(0, "sync ok", ""));
    publishCatalogArtifactsToContractMock.mockRejectedValue({
      code: "unconfigured",
      message: "missing config",
    });

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
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
    consoleErrorSpy.mockRestore();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "catalog_publish_unconfigured",
        recovery: "configure_catalog_contract",
      }),
    );
  });


  it("TC-07: blocks sync when currency rates file is missing", async () => {
    const missingRates = Object.assign(new Error("missing"), { code: "ENOENT" });
    readFileMock.mockRejectedValueOnce(missingRates);

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

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "currency_rates_missing",
        recovery: "save_currency_rates",
      }),
    );
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("TC-08: blocks sync when currency rates file is invalid", async () => {
    readFileMock.mockResolvedValueOnce('{"EUR":"n/a","GBP":0.78,"AUD":1.5}');

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

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "currency_rates_invalid",
        recovery: "save_currency_rates",
      }),
    );
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("TC-09: executes cloud sync publish path when local fs is disabled", async () => {
    process.env.XA_UPLOADER_LOCAL_FS_DISABLED = "1";

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storefront: "xa-b",
          options: { strict: true, dryRun: false },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        mode: "cloud",
        display: expect.objectContaining({
          requiresXaBBuild: true,
          nextAction: "rebuild_and_deploy_xa_b",
        }),
      }),
    );
    expect(spawnMock).not.toHaveBeenCalled();
    expect(publishCatalogPayloadToContractMock).toHaveBeenCalledTimes(1);
  });

});

describe("TASK-04: catalog sync route — KV mutex (F4+F8)", () => {
  const kvGetMock = jest.fn();
  const kvPutMock = jest.fn();
  const kvDeleteMock = jest.fn();

  const mockKv = {
    get: (...args: unknown[]) => kvGetMock(...args),
    put: (...args: unknown[]) => kvPutMock(...args),
    delete: (...args: unknown[]) => kvDeleteMock(...args),
  } as import("../../../../../lib/syncMutex").UploaderKvNamespace;

  beforeEach(() => {
    jest.clearAllMocks();
    __clearRateLimitStoreForTests();
    hasUploaderSessionMock.mockResolvedValue(true);
    readCloudDraftSnapshotMock.mockResolvedValue({
      products: [{ slug: "studio-jacket", title: "Studio Jacket", publishState: "ready" }],
      revisionsById: {},
      docRevision: "doc-1",
    });
    buildCatalogArtifactsFromDraftsMock.mockReturnValue({
      catalog: { collections: [], brands: [], products: [{ slug: "studio-jacket" }] },
      mediaIndex: { totals: { products: 1, media: 0, warnings: 0 }, items: [] },
      warnings: [],
    });
    publishCatalogPayloadToContractMock.mockResolvedValue({
      version: "v-cloud",
      publishedAt: "2026-02-24T00:00:00.000Z",
    });
    getCatalogContractReadinessMock.mockReturnValue({ configured: true, errors: [] });
    process.env.XA_UPLOADER_LOCAL_FS_DISABLED = "1";
    delete process.env.XA_UPLOADER_MODE;

    kvGetMock.mockResolvedValue(null);
    kvPutMock.mockResolvedValue(undefined);
    kvDeleteMock.mockResolvedValue(undefined);

    getUploaderKvMock.mockResolvedValue(mockKv);
    acquireSyncMutexMock.mockImplementation(
      async (
        kv: import("../../../../../lib/syncMutex").UploaderKvNamespace,
        storefrontId: string,
      ) => {
        const key = `xa-sync-lock:${storefrontId}`;
        const existing = await kv.get(key);
        if (existing !== null) return false;
        await kv.put(key, "1", { expirationTtl: 300 });
        return true;
      },
    );
    releaseSyncMutexMock.mockImplementation(
      async (
        kv: import("../../../../../lib/syncMutex").UploaderKvNamespace,
        storefrontId: string,
      ) => {
        await kv.delete(`xa-sync-lock:${storefrontId}`);
      },
    );
  });

  it("TC-04a: returns 409 when KV lock key is already held (lock present)", async () => {
    kvGetMock.mockResolvedValueOnce("1");

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options: {}, storefront: "xa-b" }),
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      ok: false,
      error: "conflict",
      reason: "sync_already_running",
    });
    expect(kvPutMock).not.toHaveBeenCalled();
    expect(kvDeleteMock).not.toHaveBeenCalled();
    expect(publishCatalogPayloadToContractMock).not.toHaveBeenCalled();
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("TC-04b: fail-open when KV acquire throws — sync proceeds normally", async () => {
    acquireSyncMutexMock.mockRejectedValue(new Error("KV unavailable"));

    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options: {}, storefront: "xa-b" }),
      }),
    );
    consoleWarnSpy.mockRestore();

    // Sync should proceed (fail-open)
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ ok: true }));
  });

  it("TC-04c: writes KV mutex lock with xa-sync-lock key and 300-second TTL", async () => {
    kvGetMock.mockResolvedValueOnce(null);

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options: {}, storefront: "xa-b" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(kvPutMock).toHaveBeenCalledWith("xa-sync-lock:xa-b", "1", { expirationTtl: 300 });
  });

  it("TC-04d: deletes KV mutex key after successful sync", async () => {
    kvGetMock.mockResolvedValueOnce(null);

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options: {}, storefront: "xa-b" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(kvDeleteMock).toHaveBeenCalledWith("xa-sync-lock:xa-b");
  });

  it("TC-04e: mutex skipped when KV unavailable (getUploaderKv returns null)", async () => {
    getUploaderKvMock.mockResolvedValue(null); // KV not available

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options: {}, storefront: "xa-b" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(acquireSyncMutexMock).not.toHaveBeenCalled();
    expect(releaseSyncMutexMock).not.toHaveBeenCalled();
    expect(kvPutMock).not.toHaveBeenCalled();
    expect(kvDeleteMock).not.toHaveBeenCalled();
  });
});

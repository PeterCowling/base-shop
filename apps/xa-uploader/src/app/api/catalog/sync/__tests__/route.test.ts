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
const VALID_CLOUD_PRODUCT = {
  id: "p1",
  slug: "studio-jacket",
  title: "Studio Jacket",
  brandHandle: "atelier-x",
  collectionHandle: "outerwear",
  collectionTitle: "Outerwear",
  price: "189",
  description: "A structured layer.",
  createdAt: "2025-12-01T12:00:00.000Z",
  popularity: "0",
  sizes: "S|M|L",
  imageFiles: "images/studio-jacket/front.jpg",
  imageAltTexts: "front view",
  publishState: "live" as const,
  taxonomy: {
    department: "women" as const,
    category: "clothing" as const,
    subcategory: "outerwear",
    color: "black",
    material: "wool",
  },
};

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
      products: [VALID_CLOUD_PRODUCT],
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
        mode: "local",
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
        mode: "local",
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
        mode: "local",
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
        mode: "local",
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

describe("TASK-04: catalog sync route — cloud sync lock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __clearRateLimitStoreForTests();
    hasUploaderSessionMock.mockResolvedValue(true);
    readCloudDraftSnapshotMock.mockResolvedValue({
      products: [VALID_CLOUD_PRODUCT],
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
    acquireCloudSyncLockMock.mockResolvedValue({
      status: "acquired",
      lock: { storefront: "xa-b", ownerToken: "lock-owner-1", expiresAt: "2999-01-01T00:00:00.000Z" },
    });
    releaseCloudSyncLockMock.mockResolvedValue(undefined);
    process.env.XA_UPLOADER_LOCAL_FS_DISABLED = "1";
    delete process.env.XA_UPLOADER_MODE;
    getUploaderKvMock.mockResolvedValue(null);
  });

  it("TC-04a: returns 409 when the cloud sync lock is already held", async () => {
    acquireCloudSyncLockMock.mockResolvedValueOnce({
      status: "busy",
      expiresAt: "2999-01-01T00:00:00.000Z",
    });

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
    expect(releaseCloudSyncLockMock).not.toHaveBeenCalled();
    expect(publishCatalogPayloadToContractMock).not.toHaveBeenCalled();
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("TC-04b: contract-lock failures fail closed with contract recovery guidance", async () => {
    acquireCloudSyncLockMock.mockRejectedValue({ code: "request_failed", status: 502 });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options: {}, storefront: "xa-b" }),
      }),
    );
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "catalog_publish_failed",
        recovery: "review_catalog_contract",
        publishStatus: 502,
      }),
    );
  });

  it("TC-04c: releases the acquired cloud sync lock after a successful sync", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options: {}, storefront: "xa-b" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(releaseCloudSyncLockMock).toHaveBeenCalledWith({
      storefront: "xa-b",
      ownerToken: "lock-owner-1",
      expiresAt: "2999-01-01T00:00:00.000Z",
    });
  });

  it("TC-04d: cloud readiness GET reports mode=cloud when local FS is disabled", async () => {
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
        mode: "cloud",
        contractConfigured: true,
      }),
    );
  });
});

import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { EventEmitter } from "node:events";

import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { __clearRateLimitStoreForTests } from "../../../../../lib/rateLimit";

const spawnMock = jest.fn();
const accessMock = jest.fn();
const mkdirMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const getCatalogSyncInputStatusMock = jest.fn();
const publishCatalogArtifactsToContractMock = jest.fn();
const getCatalogContractReadinessMock = jest.fn();

jest.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));

jest.mock("node:fs/promises", () => ({
  __esModule: true,
  default: {
    access: (...args: unknown[]) => accessMock(...args),
    mkdir: (...args: unknown[]) => mkdirMock(...args),
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
  getCatalogContractReadiness: () => getCatalogContractReadinessMock(),
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
    getCatalogSyncInputStatusMock.mockResolvedValue({ exists: true, rowCount: 1 });
    publishCatalogArtifactsToContractMock.mockResolvedValue({
      version: "v-test",
      publishedAt: "2026-02-24T00:00:00.000Z",
    });
    getCatalogContractReadinessMock.mockReturnValue({ configured: true, errors: [] });
    delete process.env.XA_UPLOADER_MODE;
    delete process.env.XA_UPLOADER_EXPOSE_SYNC_LOGS;
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

  it("TC-00f: GET reports ready=false with contractConfigured=false when contract env vars are missing", async () => {
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
        ready: false,
        contractConfigured: false,
        contractConfigErrors: ["XA_CATALOG_CONTRACT_BASE_URL not set"],
        recovery: "configure_catalog_contract",
      }),
    );
  });

  it("TC-00c: blocks empty catalog input unless explicitly confirmed", async () => {
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
        error: "catalog_publish_unconfigured",
        recovery: "configure_catalog_contract",
      }),
    );
  });
});

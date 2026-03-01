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
    readFileMock.mockResolvedValue('{"EUR":0.92,"GBP":0.78,"AUD":1.5}');
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
      products: [{ slug: "studio-jacket", title: "Studio Jacket" }],
      revisionsById: {},
      docRevision: "doc-1",
    });
    buildCatalogArtifactsFromDraftsMock.mockReturnValue({
      catalog: { collections: [], brands: [], products: [{ slug: "studio-jacket" }] },
      mediaIndex: { totals: { products: 1, media: 0, warnings: 0 }, items: [] },
      warnings: [],
    });
    delete process.env.XA_UPLOADER_MODE;
    delete process.env.XA_UPLOADER_LOCAL_FS_DISABLED;
  });

  it("GET returns 404 in vendor mode", async () => {
    process.env.XA_UPLOADER_MODE = "vendor";
    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/sync?storefront=xa-b"));
    expect(response.status).toBe(404);
  });

  it("GET returns 404 when unauthenticated", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(false);
    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/sync?storefront=xa-b"));
    expect(response.status).toBe(404);
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
});

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { __clearRateLimitStoreForTests } from "../../../../../lib/rateLimit";

const hasUploaderSessionMock = jest.fn();
const getCatalogContractReadinessMock = jest.fn();
const publishCatalogPayloadToContractMock = jest.fn();
const readCloudDraftSnapshotMock = jest.fn();
const writeCloudDraftSnapshotMock = jest.fn();
const buildCatalogArtifactsFromDraftsMock = jest.fn();
const getMediaBucketMock = jest.fn();

const getUploaderKvMock = jest.fn();
const acquireSyncMutexMock = jest.fn();
const releaseSyncMutexMock = jest.fn();

const ORIGINAL_ENV = {
  XA_UPLOADER_LOCAL_FS_DISABLED: process.env.XA_UPLOADER_LOCAL_FS_DISABLED,
  XA_B_DEPLOY_HOOK_URL: process.env.XA_B_DEPLOY_HOOK_URL,
  XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS: process.env.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS,
  XA_B_DEPLOY_HOOK_MAX_RETRIES: process.env.XA_B_DEPLOY_HOOK_MAX_RETRIES,
};

jest.mock("../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../lib/repoRoot", () => ({
  resolveRepoRoot: () => "/repo",
}));

jest.mock("../../../../../lib/catalogContractClient", () => ({
  getCatalogContractReadiness: () => getCatalogContractReadinessMock(),
  publishCatalogPayloadToContract: (...args: unknown[]) => publishCatalogPayloadToContractMock(...args),
  publishCatalogArtifactsToContract: jest.fn(),
}));

jest.mock("../../../../../lib/catalogDraftContractClient", () => ({
  readCloudDraftSnapshot: (...args: unknown[]) => readCloudDraftSnapshotMock(...args),
  writeCloudDraftSnapshot: (...args: unknown[]) => writeCloudDraftSnapshotMock(...args),
}));

jest.mock("../../../../../lib/catalogDraftToContract", () => ({
  buildCatalogArtifactsFromDrafts: (...args: unknown[]) => buildCatalogArtifactsFromDraftsMock(...args),
}));

jest.mock("../../../../../lib/r2Media", () => ({
  getMediaBucket: (...args: unknown[]) => getMediaBucketMock(...args),
}));

jest.mock("../../../../../lib/syncMutex", () => ({
  getUploaderKv: (...args: unknown[]) => getUploaderKvMock(...args),
  acquireSyncMutex: (...args: unknown[]) => acquireSyncMutexMock(...args),
  releaseSyncMutex: (...args: unknown[]) => releaseSyncMutexMock(...args),
}));

describe("catalog sync cloud publish/finalize behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __clearRateLimitStoreForTests();

    hasUploaderSessionMock.mockResolvedValue(true);
    getCatalogContractReadinessMock.mockReturnValue({ configured: true, errors: [] });
    publishCatalogPayloadToContractMock.mockResolvedValue({
      version: "v-cloud",
      publishedAt: "2026-03-05T00:00:00.000Z",
    });

    readCloudDraftSnapshotMock.mockResolvedValue({
      products: [{ id: "p1", slug: "studio-jacket", title: "Studio Jacket", publishState: "ready" }],
      revisionsById: { p1: "rev-1" },
      docRevision: "doc-1",
    });
    writeCloudDraftSnapshotMock.mockResolvedValue({ docRevision: "doc-2" });

    buildCatalogArtifactsFromDraftsMock.mockReturnValue({
      catalog: { collections: [], brands: [], products: [{ slug: "studio-jacket", media: [] }] },
      mediaIndex: { totals: { products: 1, media: 0, warnings: 0 }, items: [] },
      warnings: [],
    });

    getMediaBucketMock.mockResolvedValue(null);

    getUploaderKvMock.mockResolvedValue(null);
    acquireSyncMutexMock.mockResolvedValue(true);
    releaseSyncMutexMock.mockResolvedValue(undefined);

    process.env.XA_UPLOADER_LOCAL_FS_DISABLED = "1";
    process.env.XA_B_DEPLOY_HOOK_URL = "https://deploy.example/hook";
    process.env.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS = "1";
    process.env.XA_B_DEPLOY_HOOK_MAX_RETRIES = "0";
  });

  afterEach(() => {
    if (ORIGINAL_ENV.XA_UPLOADER_LOCAL_FS_DISABLED === undefined) {
      delete process.env.XA_UPLOADER_LOCAL_FS_DISABLED;
    } else {
      process.env.XA_UPLOADER_LOCAL_FS_DISABLED = ORIGINAL_ENV.XA_UPLOADER_LOCAL_FS_DISABLED;
    }

    if (ORIGINAL_ENV.XA_B_DEPLOY_HOOK_URL === undefined) delete process.env.XA_B_DEPLOY_HOOK_URL;
    else process.env.XA_B_DEPLOY_HOOK_URL = ORIGINAL_ENV.XA_B_DEPLOY_HOOK_URL;

    if (ORIGINAL_ENV.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS === undefined) {
      delete process.env.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS;
    } else {
      process.env.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS = ORIGINAL_ENV.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS;
    }

    if (ORIGINAL_ENV.XA_B_DEPLOY_HOOK_MAX_RETRIES === undefined) {
      delete process.env.XA_B_DEPLOY_HOOK_MAX_RETRIES;
    } else {
      process.env.XA_B_DEPLOY_HOOK_MAX_RETRIES = ORIGINAL_ENV.XA_B_DEPLOY_HOOK_MAX_RETRIES;
    }
  });

  it("maps cloud publish failures to 502 catalog_publish_failed with publishStatus and skips finalize/deploy", async () => {
    publishCatalogPayloadToContractMock.mockRejectedValueOnce({
      code: "request_failed",
      status: 404,
      details: "upstream not found",
    });
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(new Response("", { status: 202 }));

    try {
      const { POST } = await import("../route");
      const response = await POST(
        new Request("http://localhost/api/catalog/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storefront: "xa-b", options: { strict: true, dryRun: false } }),
        }),
      );

      expect(response.status).toBe(502);
      expect(await response.json()).toEqual(
        expect.objectContaining({
          ok: false,
          error: "catalog_publish_failed",
          recovery: "review_catalog_contract",
          publishStatus: 404,
        }),
      );
      expect(writeCloudDraftSnapshotMock).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("continues with deploy when finalize draft-write fails and records warning", async () => {
    writeCloudDraftSnapshotMock.mockRejectedValueOnce(new Error("doc revision conflict"));
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(new Response("", { status: 202 }));

    try {
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
      expect(payload.ok).toBe(true);
      expect(payload.warnings).toContain("publish_state_promotion_failed");
      expect(payload.deploy).toEqual(expect.objectContaining({ status: "triggered" }));
      expect(writeCloudDraftSnapshotMock).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    } finally {
      fetchSpy.mockRestore();
    }
  });
});

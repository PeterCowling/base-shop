import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { __clearRateLimitStoreForTests } from "../../../../../lib/rateLimit";

const hasUploaderSessionMock = jest.fn();
const publishCatalogPayloadToContractMock = jest.fn();
const readCloudDraftSnapshotMock = jest.fn();
const writeCloudDraftSnapshotMock = jest.fn();
const acquireCloudSyncLockMock = jest.fn();
const releaseCloudSyncLockMock = jest.fn();
const buildCatalogArtifactsFromDraftsMock = jest.fn();
const getMediaBucketMock = jest.fn();
const maybeTriggerXaBDeployMock = jest.fn();
const reconcileDeployPendingStateMock = jest.fn();
const getUploaderKvMock = jest.fn();
const isLocalFsRuntimeEnabledMock = jest.fn();
const resolveRepoRootMock = jest.fn();

const kvNamespaceMock = {
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

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
  publishState: "draft" as const,
  taxonomy: {
    department: "women" as const,
    category: "clothing" as const,
    subcategory: "outerwear",
    color: "black",
    material: "wool",
  },
};

jest.mock("../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../lib/catalogContractClient", () => ({
  getCatalogContractReadiness: jest.fn(),
  publishCatalogPayloadToContract: (...args: unknown[]) => publishCatalogPayloadToContractMock(...args),
  publishCatalogArtifactsToContract: jest.fn(),
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

jest.mock("../../../../../lib/syncMutex", () => ({
  getUploaderKv: (...args: unknown[]) => getUploaderKvMock(...args),
}));

jest.mock("../../../../../lib/localFsGuard", () => ({
  isLocalFsRuntimeEnabled: (...args: unknown[]) => isLocalFsRuntimeEnabledMock(...args),
}));

jest.mock("../../../../../lib/repoRoot", () => ({
  resolveRepoRoot: (...args: unknown[]) => resolveRepoRootMock(...args),
}));

jest.mock("../../../../../lib/deployHook", () => ({
  maybeTriggerXaBDeploy: (...args: unknown[]) => maybeTriggerXaBDeployMock(...args),
  reconcileDeployPendingState: (...args: unknown[]) => reconcileDeployPendingStateMock(...args),
  resolveDeployStatePaths: jest.requireActual("../../../../../lib/deployHook").resolveDeployStatePaths,
}));

describe("catalog publish route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __clearRateLimitStoreForTests();

    hasUploaderSessionMock.mockResolvedValue(true);
    publishCatalogPayloadToContractMock.mockResolvedValue({
      version: "v-cloud",
      publishedAt: "2026-03-05T00:00:00.000Z",
    });
    readCloudDraftSnapshotMock.mockResolvedValue({
      products: [{ ...VALID_CLOUD_PRODUCT }],
      revisionsById: { p1: "rev-1" },
      docRevision: "doc-1",
    });
    writeCloudDraftSnapshotMock.mockResolvedValue({ docRevision: "doc-2" });
    acquireCloudSyncLockMock.mockResolvedValue({
      status: "acquired",
      lock: { storefront: "xa-b", ownerToken: "lock-owner-1", expiresAt: "2999-01-01T00:00:00.000Z" },
    });
    releaseCloudSyncLockMock.mockResolvedValue(undefined);
    buildCatalogArtifactsFromDraftsMock.mockReturnValue({
      catalog: { collections: [], brands: [], products: [{ slug: "studio-jacket", media: [] }] },
      mediaIndex: { totals: { products: 1, media: 0, warnings: 0 }, items: [] },
      warnings: [],
    });
    getMediaBucketMock.mockResolvedValue(null);
    maybeTriggerXaBDeployMock.mockResolvedValue({ status: "triggered" });
    reconcileDeployPendingStateMock.mockResolvedValue(null);
    getUploaderKvMock.mockResolvedValue(kvNamespaceMock);
    isLocalFsRuntimeEnabledMock.mockReturnValue(true);
    resolveRepoRootMock.mockReturnValue("/repo");
  });

  afterEach(() => {
    jest.resetModules();
  });

  it("returns ok true with deployStatus triggered for a valid draft", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront: "xa-b", draft: VALID_CLOUD_PRODUCT }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        deployStatus: "triggered",
        warnings: [],
      }),
    );
    expect(buildCatalogArtifactsFromDraftsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        storefront: "xa-b",
        strict: false,
        mediaValidationPolicy: "warn",
        products: [expect.objectContaining({ id: "p1", publishState: "live" })],
      }),
    );
    expect(writeCloudDraftSnapshotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        storefront: "xa-b",
        products: [expect.objectContaining({ id: "p1", publishState: "live" })],
      }),
    );
    expect(maybeTriggerXaBDeployMock).toHaveBeenCalledWith({
      storefrontId: "xa-b",
      kv: kvNamespaceMock,
      statePaths: {
        cooldownStatePath: "/repo/apps/xa-uploader/data/deploy-cooldown/xa-b.json",
        pendingStatePath: "/repo/apps/xa-uploader/data/deploy-pending/xa-b.json",
      },
    });
    expect(reconcileDeployPendingStateMock).toHaveBeenCalledWith({
      storefrontId: "xa-b",
      kv: kvNamespaceMock,
      statePaths: {
        cooldownStatePath: "/repo/apps/xa-uploader/data/deploy-cooldown/xa-b.json",
        pendingStatePath: "/repo/apps/xa-uploader/data/deploy-pending/xa-b.json",
      },
      result: { status: "triggered" },
    });
    expect(releaseCloudSyncLockMock).toHaveBeenCalledTimes(1);
  });

  it("returns ok true with deployStatus skipped_cooldown when deploy is cooling down", async () => {
    maybeTriggerXaBDeployMock.mockResolvedValueOnce({ status: "skipped_cooldown" });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront: "xa-b", draft: VALID_CLOUD_PRODUCT }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        deployStatus: "skipped_cooldown",
      }),
    );
    expect(publishCatalogPayloadToContractMock).toHaveBeenCalledTimes(1);
  });

  it("returns deployReason when publish succeeds but deploy trigger fails", async () => {
    maybeTriggerXaBDeployMock.mockResolvedValueOnce({
      status: "failed",
      reason: "http_401:deploy_ack_rejected",
    });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront: "xa-b", draft: VALID_CLOUD_PRODUCT }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        deployStatus: "failed",
        deployReason: "http_401:deploy_ack_rejected",
      }),
    );
  });

  it("maps catalog publish failures to 502 catalog_publish_failed", async () => {
    publishCatalogPayloadToContractMock.mockRejectedValueOnce(new Error("publish failed"));

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront: "xa-b", draft: VALID_CLOUD_PRODUCT }),
      }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "catalog_publish_failed",
      }),
    );
    expect(writeCloudDraftSnapshotMock).not.toHaveBeenCalled();
    expect(maybeTriggerXaBDeployMock).not.toHaveBeenCalled();
    expect(releaseCloudSyncLockMock).toHaveBeenCalledTimes(1);
  });

  it("returns sync_locked when the cloud sync lock is already held", async () => {
    acquireCloudSyncLockMock.mockResolvedValueOnce({
      status: "busy",
      expiresAt: "2999-01-01T00:00:00.000Z",
    });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront: "xa-b", draft: VALID_CLOUD_PRODUCT }),
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "sync_locked",
      }),
    );
    expect(releaseCloudSyncLockMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the request is not authenticated", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(false);

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront: "xa-b", draft: VALID_CLOUD_PRODUCT }),
      }),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false });
    expect(acquireCloudSyncLockMock).not.toHaveBeenCalled();
  });

  it("publishes with warnings when cloud images are missing in warn mode", async () => {
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
      new Request("http://localhost/api/catalog/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront: "xa-b", draft: VALID_CLOUD_PRODUCT }),
      }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.deployStatus).toBe("triggered");
    expect(payload.warnings).toContain("cloud_media_missing_pruned:1");
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
});

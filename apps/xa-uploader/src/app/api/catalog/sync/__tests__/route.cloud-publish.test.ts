import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { __clearRateLimitStoreForTests } from "../../../../../lib/rateLimit";

const hasUploaderSessionMock = jest.fn();
const getCatalogContractReadinessMock = jest.fn();
const publishCatalogPayloadToContractMock = jest.fn();
const readCloudDraftSnapshotMock = jest.fn();
const readCloudCurrencyRatesMock = jest.fn();
const writeCloudDraftSnapshotMock = jest.fn();
const acquireCloudSyncLockMock = jest.fn();
const releaseCloudSyncLockMock = jest.fn();
const buildCatalogArtifactsFromDraftsMock = jest.fn();
const getMediaBucketMock = jest.fn();

const getUploaderKvMock = jest.fn();

const ORIGINAL_ENV = {
  XA_B_DEPLOY_HOOK_URL: process.env.XA_B_DEPLOY_HOOK_URL,
  XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS: process.env.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS,
  XA_B_DEPLOY_HOOK_MAX_RETRIES: process.env.XA_B_DEPLOY_HOOK_MAX_RETRIES,
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
  publishState: "live" as const,
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
  getCatalogContractReadiness: () => getCatalogContractReadinessMock(),
  publishCatalogPayloadToContract: (...args: unknown[]) => publishCatalogPayloadToContractMock(...args),
  publishCatalogArtifactsToContract: jest.fn(),
}));

jest.mock("../../../../../lib/catalogDraftContractClient", () => ({
  readCloudCurrencyRates: (...args: unknown[]) => readCloudCurrencyRatesMock(...args),
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
      products: [VALID_CLOUD_PRODUCT],
      revisionsById: { p1: "rev-1" },
      docRevision: "doc-1",
    });
    readCloudCurrencyRatesMock.mockResolvedValue({ EUR: 0.92, GBP: 0.78, AUD: 1.5 });
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

    getUploaderKvMock.mockResolvedValue(null);
    process.env.XA_B_DEPLOY_HOOK_URL = "https://deploy.example/hook";
    process.env.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS = "1";
    process.env.XA_B_DEPLOY_HOOK_MAX_RETRIES = "0";
  });

  afterEach(() => {
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

  it("builds and finalizes live plus out_of_stock products, excluding drafts", async () => {
    readCloudDraftSnapshotMock.mockResolvedValueOnce({
      products: [
        { ...VALID_CLOUD_PRODUCT, id: "p1", slug: "live-product", title: "Live Product", imageFiles: "images/live-product/front.jpg", publishState: "live" },
        { ...VALID_CLOUD_PRODUCT, id: "p2", slug: "oos-product", title: "OOS Product", imageFiles: "images/oos-product/front.jpg", publishState: "out_of_stock" },
        { ...VALID_CLOUD_PRODUCT, id: "p3", slug: "draft-product", title: "Draft Product", imageFiles: "images/draft-product/front.jpg", publishState: "draft" },
      ],
      revisionsById: { p1: "rev-1", p2: "rev-2", p3: "rev-3" },
      docRevision: "doc-1",
    });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront: "xa-b", options: { strict: true, dryRun: false } }),
      }),
    );

    expect(response.status).toBe(200);
    expect(buildCatalogArtifactsFromDraftsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        products: [
          expect.objectContaining({ id: "p1", publishState: "live" }),
          expect.objectContaining({ id: "p2", publishState: "out_of_stock" }),
        ],
      }),
    );
    expect(writeCloudDraftSnapshotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        products: expect.arrayContaining([
          expect.objectContaining({ id: "p1", publishState: "live" }),
          expect.objectContaining({ id: "p2", publishState: "out_of_stock" }),
          expect.objectContaining({ id: "p3", publishState: "draft" }),
        ]),
      }),
    );
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

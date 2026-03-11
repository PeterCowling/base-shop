import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const hasUploaderSessionMock = jest.fn();
const getCatalogContractReadinessMock = jest.fn();
const readCloudDraftSnapshotMock = jest.fn();
const readCloudCurrencyRatesMock = jest.fn();
const buildCatalogArtifactsFromDraftsMock = jest.fn();
const applyCloudMediaExistenceValidationMock = jest.fn();
const publishCatalogPayloadToContractMock = jest.fn();
const writeCloudDraftSnapshotMock = jest.fn();
const acquireCloudSyncLockMock = jest.fn();
const releaseCloudSyncLockMock = jest.fn();
const getUploaderKvMock = jest.fn();

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
  imageFiles: "xa-b/studio-jacket/front.jpg",
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

class CatalogDraftContractErrorMock extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

jest.mock("../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../lib/catalogContractClient", () => ({
  getCatalogContractReadiness: () => getCatalogContractReadinessMock(),
  publishCatalogPayloadToContract: (...args: unknown[]) => publishCatalogPayloadToContractMock(...args),
  publishCatalogArtifactsToContract: jest.fn(),
}));

jest.mock("../../../../../lib/catalogDraftContractClient", () => ({
  CatalogDraftContractError: CatalogDraftContractErrorMock,
  readCloudDraftSnapshot: (...args: unknown[]) => readCloudDraftSnapshotMock(...args),
  readCloudCurrencyRates: (...args: unknown[]) => readCloudCurrencyRatesMock(...args),
  writeCloudDraftSnapshot: (...args: unknown[]) => writeCloudDraftSnapshotMock(...args),
  acquireCloudSyncLock: (...args: unknown[]) => acquireCloudSyncLockMock(...args),
  releaseCloudSyncLock: (...args: unknown[]) => releaseCloudSyncLockMock(...args),
}));

jest.mock("../../../../../lib/catalogDraftToContract", () => ({
  buildCatalogArtifactsFromDrafts: (...args: unknown[]) => buildCatalogArtifactsFromDraftsMock(...args),
}));

jest.mock("../../../../../lib/catalogCloudPublish", () => ({
  applyCloudMediaExistenceValidation: (...args: unknown[]) => applyCloudMediaExistenceValidationMock(...args),
}));

jest.mock("../../../../../lib/syncMutex", () => ({
  getUploaderKv: (...args: unknown[]) => getUploaderKvMock(...args),
}));

jest.mock("../../../../../lib/rateLimit", () => ({
  rateLimit: () => ({ allowed: true, remaining: 99, resetAt: Date.now() + 60000, retryAfter: 0, limit: 99 }),
  withRateHeaders: (_res: unknown, ..._rest: unknown[]) => _res,
  getRequestIp: () => "127.0.0.1",
}));

describe("catalog sync route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    getCatalogContractReadinessMock.mockReturnValue({ configured: true, errors: [] });
    readCloudDraftSnapshotMock.mockResolvedValue({
      products: [VALID_CLOUD_PRODUCT],
      revisionsById: { p1: "rev-1" },
      docRevision: "doc-1",
    });
    readCloudCurrencyRatesMock.mockResolvedValue({ EUR: 0.92, GBP: 0.78, AUD: 1.5 });
    buildCatalogArtifactsFromDraftsMock.mockReturnValue({
      catalog: { products: [{ slug: "studio-jacket" }], brands: [], collections: [] },
      mediaIndex: { totals: { products: 1, media: 0, warnings: 0 }, items: [] },
      warnings: [],
    });
    applyCloudMediaExistenceValidationMock.mockResolvedValue({
      ok: true,
      artifacts: {
        catalog: { products: [{ slug: "studio-jacket" }], brands: [], collections: [] },
        mediaIndex: { totals: { products: 1, media: 0, warnings: 0 }, items: [] },
        warnings: [],
      },
      warnings: [],
    });
    publishCatalogPayloadToContractMock.mockResolvedValue({
      version: "v-cloud",
      publishedAt: "2026-03-09T00:00:00.000Z",
    });
    writeCloudDraftSnapshotMock.mockResolvedValue({ docRevision: "doc-2" });
    acquireCloudSyncLockMock.mockResolvedValue({
      status: "acquired",
      lock: { storefront: "xa-b", ownerToken: "lock-owner-1", expiresAt: "2999-01-01T00:00:00.000Z" },
    });
    releaseCloudSyncLockMock.mockResolvedValue(undefined);
    getUploaderKvMock.mockResolvedValue(null);
    delete process.env.XA_UPLOADER_MODE;
    delete process.env.XA_B_DEPLOY_HOOK_URL;
    delete process.env.XA_B_DEPLOY_HOOK_REQUIRED;
    delete process.env.XA_B_DEPLOY_HOOK_MAX_RETRIES;
    delete process.env.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS;
  });

  it("GET returns not ready when the hosted contract is unconfigured", async () => {
    getCatalogContractReadinessMock.mockReturnValueOnce({ configured: false, errors: ["missing base url"] });

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/sync?storefront=xa-b"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        ready: false,
        contractConfigured: false,
        recovery: "configure_catalog_contract",
        mode: "cloud",
      }),
    );
  });

  it("GET returns not ready when hosted currency rates are missing", async () => {
    readCloudCurrencyRatesMock.mockResolvedValueOnce(null);

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/sync?storefront=xa-b"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        ready: false,
        contractConfigured: true,
        recovery: "save_currency_rates",
        mode: "cloud",
      }),
    );
  });

  it("POST returns sync_already_running when the hosted lock is already held", async () => {
    acquireCloudSyncLockMock.mockResolvedValueOnce({
      status: "busy",
      expiresAt: "2999-01-01T00:00:00.000Z",
    });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront: "xa-b", options: {} }),
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "conflict", reason: "sync_already_running" }),
    );
  });

  it("POST returns no_publishable_products when hosted draft snapshot has no publishable entries", async () => {
    readCloudDraftSnapshotMock.mockResolvedValueOnce({
      products: [{ ...VALID_CLOUD_PRODUCT, publishState: "draft", imageFiles: "" }],
      revisionsById: { p1: "rev-1" },
      docRevision: "doc-1",
    });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront: "xa-b", options: {} }),
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "no_publishable_products",
        recovery: "mark_products_ready",
      }),
    );
  });

  // C3 — Empty catalog sync confirmation required

  it("C3: POST proceeds when confirmEmptyInput is true even with no publishable products", async () => {
    readCloudDraftSnapshotMock.mockResolvedValueOnce({
      products: [{ ...VALID_CLOUD_PRODUCT, publishState: "draft", imageFiles: "" }],
      revisionsById: { p1: "rev-1" },
      docRevision: "doc-1",
    });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront: "xa-b", options: { confirmEmptyInput: true } }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ ok: true }));
  });

  it("POST completes the hosted publish path", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront: "xa-b", options: { strict: true, dryRun: false } }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        mode: "cloud",
        counts: { products: 1, media: 0 },
      }),
    );
    expect(publishCatalogPayloadToContractMock).toHaveBeenCalledTimes(1);
    expect(releaseCloudSyncLockMock).toHaveBeenCalledTimes(1);
  });
});

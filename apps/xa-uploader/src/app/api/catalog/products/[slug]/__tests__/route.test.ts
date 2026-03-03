import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const getCatalogDraftBySlugMock = jest.fn();
const deleteCatalogProductMock = jest.fn();
const readCloudDraftSnapshotMock = jest.fn();
const deleteProductFromCloudSnapshotMock = jest.fn();
const writeCloudDraftSnapshotMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const parseStorefrontMock = jest.fn();
const isLocalFsRuntimeEnabledMock = jest.fn();
const rateLimitMock = jest.fn();
const applyRateLimitHeadersMock = jest.fn();
const getRequestIpMock = jest.fn();

class CatalogDraftContractErrorMock extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

jest.mock("../../../../../../lib/catalogCsv", () => ({
  getCatalogDraftBySlug: (...args: unknown[]) => getCatalogDraftBySlugMock(...args),
  deleteCatalogProduct: (...args: unknown[]) => deleteCatalogProductMock(...args),
}));

jest.mock("../../../../../../lib/catalogDraftContractClient", () => ({
  CatalogDraftContractError: CatalogDraftContractErrorMock,
  readCloudDraftSnapshot: (...args: unknown[]) => readCloudDraftSnapshotMock(...args),
  deleteProductFromCloudSnapshot: (...args: unknown[]) => deleteProductFromCloudSnapshotMock(...args),
  writeCloudDraftSnapshot: (...args: unknown[]) => writeCloudDraftSnapshotMock(...args),
}));

jest.mock("../../../../../../lib/catalogStorefront.ts", () => ({
  parseStorefront: (...args: unknown[]) => parseStorefrontMock(...args),
}));

jest.mock("../../../../../../lib/localFsGuard", () => ({
  isLocalFsRuntimeEnabled: (...args: unknown[]) => isLocalFsRuntimeEnabledMock(...args),
  localFsUnavailableResponse: () =>
    Response.json({ ok: false, error: "service_unavailable", reason: "local_fs_unavailable" }, { status: 503 }),
}));

jest.mock("../../../../../../lib/rateLimit", () => ({
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  applyRateLimitHeaders: (...args: unknown[]) => applyRateLimitHeadersMock(...args),
  getRequestIp: (...args: unknown[]) => getRequestIpMock(...args),
}));

jest.mock("../../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

describe("catalog products/[slug] route", () => {
  const params = Promise.resolve({ slug: "studio-jacket" });

  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    parseStorefrontMock.mockReturnValue("xa-b");
    isLocalFsRuntimeEnabledMock.mockReturnValue(true);
    getRequestIpMock.mockReturnValue("203.0.113.10");
    rateLimitMock.mockReturnValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 });
    applyRateLimitHeadersMock.mockImplementation(() => {});
    getCatalogDraftBySlugMock.mockResolvedValue({ id: "p1", slug: "studio-jacket" });
    deleteCatalogProductMock.mockResolvedValue({ deleted: true });
    readCloudDraftSnapshotMock.mockResolvedValue({
      products: [{ id: "p1", slug: "studio-jacket", title: "Studio Jacket" }],
      revisionsById: { p1: "rev-1" },
      docRevision: "doc-rev-1",
    });
    deleteProductFromCloudSnapshotMock.mockReturnValue({
      deleted: true,
      products: [],
      revisionsById: {},
    });
    writeCloudDraftSnapshotMock.mockResolvedValue({ docRevision: "doc-rev-2" });
  });

  it("GET returns 404 when unauthenticated", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(false);

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/products/studio-jacket"), { params });

    expect(response.status).toBe(404);
  });

  it("GET returns product when local fs mode is enabled", async () => {
    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/products/studio-jacket?storefront=xa-b"), {
      params,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: true, product: expect.objectContaining({ slug: "studio-jacket" }) }),
    );
    expect(getCatalogDraftBySlugMock).toHaveBeenCalledWith("studio-jacket", "xa-b");
  });

  it("GET returns not_found when product is absent", async () => {
    getCatalogDraftBySlugMock.mockResolvedValueOnce(null);

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/products/studio-jacket?storefront=xa-b"), {
      params,
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "not_found", reason: "product_not_found" }),
    );
  });

  it("GET returns service_unavailable when cloud draft contract is unconfigured", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValueOnce(false);
    readCloudDraftSnapshotMock.mockRejectedValueOnce(new CatalogDraftContractErrorMock("unconfigured"));

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/products/studio-jacket?storefront=xa-b"), {
      params,
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "service_unavailable", reason: "local_fs_unavailable" }),
    );
  });

  it("DELETE returns 429 when rate limited", async () => {
    rateLimitMock.mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const { DELETE } = await import("../route");
    const response = await DELETE(new Request("http://localhost/api/catalog/products/studio-jacket"), { params });

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "rate_limited", reason: "product_delete_rate_limited" }),
    );
  });

  it("DELETE returns conflict when cloud write reports revision mismatch", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValueOnce(false);
    writeCloudDraftSnapshotMock.mockRejectedValueOnce(new CatalogDraftContractErrorMock("conflict"));

    const { DELETE } = await import("../route");
    const response = await DELETE(
      new Request("http://localhost/api/catalog/products/studio-jacket?storefront=xa-b", { method: "DELETE" }),
      { params },
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "conflict", reason: "revision_conflict" }),
    );
  });
});

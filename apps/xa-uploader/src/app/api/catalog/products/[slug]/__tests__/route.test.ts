import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const getCatalogDraftBySlugMock = jest.fn();
const deleteCatalogProductMock = jest.fn();
const readCloudDraftSnapshotMock = jest.fn();
const deleteProductFromCloudSnapshotMock = jest.fn();
const writeCloudDraftSnapshotMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const parseStorefrontMock = jest.fn();
const isLocalFsRuntimeEnabledMock = jest.fn();

jest.mock("../../../../../../lib/catalogCsv", () => ({
  getCatalogDraftBySlug: (...args: unknown[]) => getCatalogDraftBySlugMock(...args),
  deleteCatalogProduct: (...args: unknown[]) => deleteCatalogProductMock(...args),
}));

jest.mock("../../../../../../lib/catalogDraftContractClient", () => ({
  CatalogDraftContractError: class extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.code = code;
    }
  },
  readCloudDraftSnapshot: (...args: unknown[]) => readCloudDraftSnapshotMock(...args),
  deleteProductFromCloudSnapshot: (...args: unknown[]) => deleteProductFromCloudSnapshotMock(...args),
  writeCloudDraftSnapshot: (...args: unknown[]) => writeCloudDraftSnapshotMock(...args),
}));

jest.mock("../../../../../../lib/catalogStorefront.ts", () => ({
  parseStorefront: (...args: unknown[]) => parseStorefrontMock(...args),
}));

jest.mock("../../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../../lib/localFsGuard", () => ({
  isLocalFsRuntimeEnabled: (...args: unknown[]) => isLocalFsRuntimeEnabledMock(...args),
  localFsUnavailableResponse: () =>
    Response.json({ ok: false, error: "service_unavailable", reason: "local_fs_unavailable" }, { status: 503 }),
}));

describe("catalog product-by-slug route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    parseStorefrontMock.mockReturnValue("xa-b");
    isLocalFsRuntimeEnabledMock.mockReturnValue(true);
    getCatalogDraftBySlugMock.mockResolvedValue(null);
    deleteCatalogProductMock.mockResolvedValue({ deleted: true });
    readCloudDraftSnapshotMock.mockResolvedValue({ products: [], revisionsById: {}, docRevision: "doc-rev-1" });
    deleteProductFromCloudSnapshotMock.mockReturnValue({ deleted: true, products: [], revisionsById: {} });
    writeCloudDraftSnapshotMock.mockResolvedValue({ docRevision: "doc-rev-2" });
  });

  it("uses cloud draft snapshot when local fs runtime is disabled", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValueOnce(false);
    readCloudDraftSnapshotMock.mockResolvedValueOnce({
      products: [{ slug: "studio-jacket", title: "Studio jacket" }],
      revisionsById: {},
      docRevision: "doc-rev-1",
    });

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/products/studio-jacket"), {
      params: Promise.resolve({ slug: "studio-jacket" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
      }),
    );
    expect(readCloudDraftSnapshotMock).toHaveBeenCalled();
  });

  it("returns not_found class for missing product on GET", async () => {
    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/products/studio-jacket"), {
      params: Promise.resolve({ slug: "studio-jacket" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "not_found",
        reason: "product_not_found",
      }),
    );
  });

  it("returns not_found class for missing product on DELETE", async () => {
    deleteCatalogProductMock.mockResolvedValueOnce({ deleted: false });

    const { DELETE } = await import("../route");
    const response = await DELETE(new Request("http://localhost/api/catalog/products/studio-jacket"), {
      params: Promise.resolve({ slug: "studio-jacket" }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "not_found",
        reason: "product_not_found",
      }),
    );
  });

  it("returns internal_error for unknown delete failures without leaking internals", async () => {
    deleteCatalogProductMock.mockRejectedValueOnce(
      new Error("EACCES /Users/petercowling/base-shop/apps/xa-uploader/data/products.csv"),
    );

    const { DELETE } = await import("../route");
    const response = await DELETE(new Request("http://localhost/api/catalog/products/studio-jacket"), {
      params: Promise.resolve({ slug: "studio-jacket" }),
    });

    expect(response.status).toBe(500);
    const payload = (await response.json()) as { error?: string; reason?: string };
    expect(payload.error).toBe("internal_error");
    expect(payload.reason).toBe("products_delete_failed");
    expect(JSON.stringify(payload)).not.toContain("EACCES");
    expect(JSON.stringify(payload)).not.toContain("/Users/petercowling");
  });
});

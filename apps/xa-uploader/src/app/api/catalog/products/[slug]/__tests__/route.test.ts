import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const readCloudDraftSnapshotMock = jest.fn();
const deleteProductFromCloudSnapshotMock = jest.fn();
const writeCloudDraftSnapshotMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const parseStorefrontMock = jest.fn();

class CatalogDraftContractErrorMock extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

jest.mock("../../../../../../lib/catalogDraftContractClient", () => ({
  CatalogDraftContractError: CatalogDraftContractErrorMock,
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

describe("catalog products/[slug] route", () => {
  const params = Promise.resolve({ slug: "studio-jacket" });

  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    parseStorefrontMock.mockReturnValue("xa-b");
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

  it("GET returns product from the cloud draft snapshot", async () => {
    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/products/studio-jacket?storefront=xa-b"), {
      params,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: true, product: expect.objectContaining({ slug: "studio-jacket" }) }),
    );
    expect(readCloudDraftSnapshotMock).toHaveBeenCalledWith("xa-b");
  });

  it("GET returns catalog contract unavailable when the snapshot contract is unconfigured", async () => {
    readCloudDraftSnapshotMock.mockRejectedValueOnce(new CatalogDraftContractErrorMock("unconfigured"));

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/products/studio-jacket?storefront=xa-b"), {
      params,
    });

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "service_unavailable", reason: "catalog_contract_unavailable" }),
    );
  });

  it("DELETE returns conflict when the hosted snapshot write reports a revision mismatch", async () => {
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

  it("DELETE writes the updated hosted snapshot when a product is removed", async () => {
    const { DELETE } = await import("../route");
    const response = await DELETE(
      new Request("http://localhost/api/catalog/products/studio-jacket?storefront=xa-b", { method: "DELETE" }),
      { params },
    );

    expect(response.status).toBe(200);
    expect(writeCloudDraftSnapshotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        storefront: "xa-b",
        ifMatchDocRevision: "doc-rev-1",
      }),
    );
  });

  // B3 — Session expiry during editing
  it("B3: GET returns 404 when the session is expired or missing", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(false);

    const { GET } = await import("../route");
    const response = await GET(
      new Request("http://localhost/api/catalog/products/studio-jacket?storefront=xa-b"),
      { params },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false });
    expect(readCloudDraftSnapshotMock).not.toHaveBeenCalled();
  });

  it("B3: DELETE returns 404 when the session is expired or missing", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(false);

    const { DELETE } = await import("../route");
    const response = await DELETE(
      new Request("http://localhost/api/catalog/products/studio-jacket?storefront=xa-b", { method: "DELETE" }),
      { params },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false });
    expect(readCloudDraftSnapshotMock).not.toHaveBeenCalled();
  });
});

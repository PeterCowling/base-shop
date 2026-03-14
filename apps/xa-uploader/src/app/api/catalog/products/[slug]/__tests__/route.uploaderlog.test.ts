import { beforeEach, describe, expect, it, jest } from "@jest/globals";

// Mock uploaderLog to assert structured-log calls on error branches.
const mockUploaderLog = jest.fn();
jest.mock("../../../../../../lib/uploaderLogger", () => ({
  uploaderLog: (...args: unknown[]) => mockUploaderLog(...args),
}));

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

describe("catalog products/[slug] route — uploaderLog assertions", () => {
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

  // TC-SLUG-01: GET with general error emits catalog_slug_get_error
  it("TC-SLUG-01: GET with a general network error calls uploaderLog with error level and catalog_slug_get_error", async () => {
    readCloudDraftSnapshotMock.mockRejectedValueOnce(new Error("network_failure"));

    const { GET } = await import("../route");
    const response = await GET(
      new Request("http://localhost/api/catalog/products/studio-jacket?storefront=xa-b"),
      { params },
    );

    expect(response.status).toBe(500);
    expect(mockUploaderLog).toHaveBeenCalledWith(
      "error",
      "catalog_slug_get_error",
      expect.objectContaining({ error: expect.any(String) }),
    );
  });

  // TC-SLUG-02: DELETE with general error emits catalog_slug_delete_error with slug
  it("TC-SLUG-02: DELETE with a general network error calls uploaderLog with error level, catalog_slug_delete_error, and slug", async () => {
    writeCloudDraftSnapshotMock.mockRejectedValueOnce(new Error("network_failure"));

    const { DELETE } = await import("../route");
    const response = await DELETE(
      new Request("http://localhost/api/catalog/products/studio-jacket?storefront=xa-b", {
        method: "DELETE",
      }),
      { params },
    );

    expect(response.status).toBe(500);
    expect(mockUploaderLog).toHaveBeenCalledWith(
      "error",
      "catalog_slug_delete_error",
      expect.objectContaining({ slug: "studio-jacket" }),
    );
  });

  // TC-SLUG-03: DELETE with revision conflict emits catalog_slug_delete_conflict (warn)
  it("TC-SLUG-03: DELETE with a revision conflict calls uploaderLog with warn level, catalog_slug_delete_conflict, and slug", async () => {
    writeCloudDraftSnapshotMock.mockRejectedValueOnce(new CatalogDraftContractErrorMock("conflict"));

    const { DELETE } = await import("../route");
    const response = await DELETE(
      new Request("http://localhost/api/catalog/products/studio-jacket?storefront=xa-b", {
        method: "DELETE",
      }),
      { params },
    );

    expect(response.status).toBe(409);
    expect(mockUploaderLog).toHaveBeenCalledWith(
      "warn",
      "catalog_slug_delete_conflict",
      expect.objectContaining({ slug: "studio-jacket" }),
    );
  });

  // TC-SLUG-NONE: GET with unconfigured contract error does NOT call uploaderLog
  it("TC-SLUG-NONE: GET with unconfigured contract error does NOT call uploaderLog", async () => {
    readCloudDraftSnapshotMock.mockRejectedValueOnce(new CatalogDraftContractErrorMock("unconfigured"));

    const { GET } = await import("../route");
    const response = await GET(
      new Request("http://localhost/api/catalog/products/studio-jacket?storefront=xa-b"),
      { params },
    );

    expect(response.status).toBe(503);
    expect(mockUploaderLog).not.toHaveBeenCalled();
  });
});

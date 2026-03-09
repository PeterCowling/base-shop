import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const readCloudDraftSnapshotMock = jest.fn();
const upsertProductInCloudSnapshotMock = jest.fn();
const writeCloudDraftSnapshotMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const parseStorefrontMock = jest.fn();

class MockCatalogDraftContractError extends Error {
  code: string;
  status?: number;

  constructor(code: string, options?: { status?: number }) {
    super(code);
    this.code = code;
    this.status = options?.status;
  }
}

class MockCatalogDraftConflictError extends Error {
  override name = "CatalogDraftConflictError";
}

jest.mock("../../../../../lib/catalogDraftContractClient", () => ({
  CatalogDraftConflictError: MockCatalogDraftConflictError,
  CatalogDraftContractError: MockCatalogDraftContractError,
  readCloudDraftSnapshot: (...args: unknown[]) => readCloudDraftSnapshotMock(...args),
  upsertProductInCloudSnapshot: (...args: unknown[]) => upsertProductInCloudSnapshotMock(...args),
  writeCloudDraftSnapshot: (...args: unknown[]) => writeCloudDraftSnapshotMock(...args),
}));

jest.mock("../../../../../lib/catalogStorefront.ts", () => ({
  parseStorefront: (...args: unknown[]) => parseStorefrontMock(...args),
}));

jest.mock("../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

describe("catalog products route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    parseStorefrontMock.mockReturnValue("xa-b");
    readCloudDraftSnapshotMock.mockResolvedValue({
      products: [],
      revisionsById: {},
      docRevision: "doc-rev-1",
    });
    upsertProductInCloudSnapshotMock.mockReturnValue({
      product: { title: "Studio jacket", slug: "studio-jacket", id: "p1" },
      revision: "rev-2",
      products: [{ title: "Studio jacket", slug: "studio-jacket", id: "p1" }],
      revisionsById: { p1: "rev-2" },
    });
    writeCloudDraftSnapshotMock.mockResolvedValue({ docRevision: "doc-rev-2" });
  });

  it("GET returns contract-backed products list on success", async () => {
    readCloudDraftSnapshotMock.mockResolvedValueOnce({
      products: [{ id: "p1", slug: "studio-jacket" }],
      revisionsById: { p1: "rev-1" },
      docRevision: "doc-rev-1",
    });

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/products?storefront=xa-b"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        products: [{ id: "p1", slug: "studio-jacket" }],
        revisionsById: { p1: "rev-1" },
      }),
    );
    expect(readCloudDraftSnapshotMock).toHaveBeenCalledWith("xa-b");
  });

  it("POST returns missing_product when product payload is absent", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ifMatch: "rev-1" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "missing_product",
        reason: "missing_product_payload",
      }),
    );
  });

  it("POST returns conflict when cloud snapshot upsert detects revision mismatch", async () => {
    upsertProductInCloudSnapshotMock.mockImplementationOnce(() => {
      throw new MockCatalogDraftConflictError("revision_conflict");
    });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: { title: "Studio jacket", slug: "studio-jacket", id: "p1" },
          ifMatch: "rev-old",
        }),
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "conflict", reason: "revision_conflict" }),
    );
  });

  it("POST returns catalog contract unavailable when draft contract is unconfigured", async () => {
    readCloudDraftSnapshotMock.mockRejectedValueOnce(new MockCatalogDraftContractError("unconfigured"));

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: { title: "Studio jacket", slug: "studio-jacket" } }),
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "service_unavailable",
        reason: "catalog_contract_unavailable",
      }),
    );
  });

  it("POST passes both product revision and doc revision through the hosted write path", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: { title: "Edited title", slug: "edited-slug", id: "p1" },
          ifMatch: "rev-current",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(upsertProductInCloudSnapshotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ifMatch: "rev-current",
      }),
    );
    expect(writeCloudDraftSnapshotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ifMatchDocRevision: "doc-rev-1",
      }),
    );
  });
});

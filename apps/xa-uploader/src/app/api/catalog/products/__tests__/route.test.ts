import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const listCatalogDraftsMock = jest.fn();
const upsertCatalogDraftMock = jest.fn();
const readCloudDraftSnapshotMock = jest.fn();
const upsertProductInCloudSnapshotMock = jest.fn();
const writeCloudDraftSnapshotMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const parseStorefrontMock = jest.fn();
const isLocalFsRuntimeEnabledMock = jest.fn();

class MockCatalogCsvConflictError extends Error {
  override name = "CatalogCsvConflictError";
}

class MockCatalogCsvStorageBusyError extends Error {
  override name = "CatalogCsvStorageBusyError";
}

class MockCatalogDraftContractError extends Error {
  code: string;
  status?: number;
  constructor(code: string, options?: { status?: number }) {
    super(code);
    this.code = code;
    this.status = options?.status;
  }
}

jest.mock("../../../../../lib/catalogCsv", () => ({
  CatalogCsvConflictError: MockCatalogCsvConflictError,
  CatalogCsvStorageBusyError: MockCatalogCsvStorageBusyError,
  listCatalogDrafts: (...args: unknown[]) => listCatalogDraftsMock(...args),
  upsertCatalogDraft: (...args: unknown[]) => upsertCatalogDraftMock(...args),
}));

jest.mock("../../../../../lib/catalogDraftContractClient", () => ({
  CatalogDraftConflictError: class extends Error {},
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

jest.mock("../../../../../lib/localFsGuard", () => ({
  isLocalFsRuntimeEnabled: (...args: unknown[]) => isLocalFsRuntimeEnabledMock(...args),
  localFsUnavailableResponse: () =>
    Response.json({ ok: false, error: "service_unavailable", reason: "local_fs_unavailable" }, { status: 503 }),
}));

describe("catalog products route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    parseStorefrontMock.mockReturnValue("xa-b");
    isLocalFsRuntimeEnabledMock.mockReturnValue(true);
    listCatalogDraftsMock.mockResolvedValue({ products: [], revisionsById: {} });
    upsertCatalogDraftMock.mockResolvedValue({
      product: { title: "Studio jacket", slug: "studio-jacket" },
      revision: "rev-1",
    });
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

  it("returns invalid for malformed JSON payload", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not-json",
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "invalid", reason: "invalid_json" }),
    );
    expect(upsertCatalogDraftMock).not.toHaveBeenCalled();
  });

  it("returns missing_product when product payload is absent", async () => {
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
    expect(upsertCatalogDraftMock).not.toHaveBeenCalled();
  });

  it("returns conflict code for CSV revision conflicts", async () => {
    upsertCatalogDraftMock.mockRejectedValueOnce(
      new MockCatalogCsvConflictError("conflict"),
    );

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: { title: "x", slug: "x" }, ifMatch: "rev-old" }),
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "conflict", reason: "revision_conflict" }),
    );
  });

  it("returns invalid code for validation-shape failures", async () => {
    upsertCatalogDraftMock.mockRejectedValueOnce({ issues: [{ path: ["title"], message: "Title is required" }] });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: { title: "" } }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "invalid",
        reason: "catalog_validation_failed",
      }),
    );
  });

  it("returns internal_error for unknown server failures without exposing raw message", async () => {
    upsertCatalogDraftMock.mockRejectedValueOnce(new Error("EACCES /Users/petercowling/base-shop"));

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: { title: "x", slug: "x" } }),
      }),
    );

    expect(response.status).toBe(500);
    const payload = (await response.json()) as { error?: string; reason?: string };
    expect(payload.error).toBe("internal_error");
    expect(payload.reason).toBe("products_upsert_failed");
    expect(JSON.stringify(payload)).not.toContain("EACCES");
    expect(JSON.stringify(payload)).not.toContain("/Users/petercowling");
  });

  it("returns storage_busy when CSV file is locked by another process", async () => {
    upsertCatalogDraftMock.mockRejectedValueOnce(
      new MockCatalogCsvStorageBusyError("locked"),
    );

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: { title: "x", slug: "x" } }),
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "storage_busy",
        reason: "products_csv_locked",
      }),
    );
  });

  it("uses cloud draft snapshot when local fs runtime is disabled", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValueOnce(false);

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/products"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: true }),
    );
    expect(readCloudDraftSnapshotMock).toHaveBeenCalled();
  });

  it("returns sanitized reason with upstream status when cloud draft read fails", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValueOnce(false);
    readCloudDraftSnapshotMock.mockRejectedValueOnce(
      new MockCatalogDraftContractError("request_failed", { status: 403 }),
    );

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/products"));

    expect(response.status).toBe(500);
    const payload = (await response.json()) as { error?: string; reason?: string };
    expect(payload.error).toBe("internal_error");
    expect(payload.reason).toBe("products_list_failed_contract_request_failed_status_403");
    expect(JSON.stringify(payload)).not.toContain("http");
    expect(JSON.stringify(payload)).not.toContain("base-shop");
  });

  it("returns sanitized reason when cloud draft payload is invalid", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValueOnce(false);
    readCloudDraftSnapshotMock.mockRejectedValueOnce(new MockCatalogDraftContractError("invalid_response"));

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: { title: "x", slug: "x" } }),
      }),
    );

    expect(response.status).toBe(500);
    const payload = (await response.json()) as { error?: string; reason?: string };
    expect(payload.error).toBe("internal_error");
    expect(payload.reason).toBe("products_upsert_failed_contract_invalid_response");
  });

  it("returns conflict when cloud draft write detects doc revision mismatch", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValueOnce(false);
    writeCloudDraftSnapshotMock.mockRejectedValueOnce(
      new MockCatalogDraftContractError("conflict"),
    );

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: { title: "x", slug: "x", id: "p1" },
          ifMatch: "rev-old",
        }),
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "conflict", reason: "revision_conflict" }),
    );
  });

  it("passes ifMatch to cloud upsert when local fs runtime is disabled (edit path)", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValueOnce(false);

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

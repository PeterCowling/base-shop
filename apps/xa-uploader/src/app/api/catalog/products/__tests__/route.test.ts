import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const listCatalogDraftsMock = jest.fn();
const upsertCatalogDraftMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const parseStorefrontMock = jest.fn();

class MockCatalogCsvConflictError extends Error {
  override name = "CatalogCsvConflictError";
}

jest.mock("../../../../../lib/catalogCsv", () => ({
  CatalogCsvConflictError: MockCatalogCsvConflictError,
  listCatalogDrafts: (...args: unknown[]) => listCatalogDraftsMock(...args),
  upsertCatalogDraft: (...args: unknown[]) => upsertCatalogDraftMock(...args),
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
    listCatalogDraftsMock.mockResolvedValue({ products: [], revisionsById: {} });
    upsertCatalogDraftMock.mockResolvedValue({
      product: { title: "Studio jacket", slug: "studio-jacket" },
      revision: "rev-1",
    });
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
});

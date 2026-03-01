import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const upsertCatalogDraftMock = jest.fn();
const readCloudDraftSnapshotMock = jest.fn();
const upsertProductInCloudSnapshotMock = jest.fn();
const writeCloudDraftSnapshotMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const parseStorefrontMock = jest.fn();
const isLocalFsRuntimeEnabledMock = jest.fn();

jest.mock("../../../../../../lib/catalogCsv", () => ({
  upsertCatalogDraft: (...args: unknown[]) => upsertCatalogDraftMock(...args),
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
  upsertProductInCloudSnapshot: (...args: unknown[]) => upsertProductInCloudSnapshotMock(...args),
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

describe("catalog products bulk route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    parseStorefrontMock.mockReturnValue("xa-b");
    isLocalFsRuntimeEnabledMock.mockReturnValue(true);
    readCloudDraftSnapshotMock.mockResolvedValue({
      products: [],
      revisionsById: {},
      docRevision: "doc-1",
    });
    upsertProductInCloudSnapshotMock.mockReturnValue({
      product: { id: "p1", slug: "studio-jacket", title: "Studio Jacket" },
      revision: "rev-2",
      products: [{ id: "p1", slug: "studio-jacket", title: "Studio Jacket" }],
      revisionsById: { p1: "rev-2" },
    });
    writeCloudDraftSnapshotMock.mockResolvedValue({ docRevision: "doc-2" });
  });

  it("upserts a bulk payload in local mode", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products/bulk?storefront=xa-b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: [
            {
              title: "Studio Jacket",
              slug: "studio-jacket",
              brandHandle: "studio",
              collectionHandle: "aw26",
              description: "Tailored wool jacket.",
              price: "120",
              stock: "3",
              createdAt: "2026-01-01T00:00:00.000Z",
              taxonomy: { department: "women", category: "clothing", subcategory: "jackets", color: "black", material: "wool" },
              sizes: "S|M",
            },
          ],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: true, mode: "local", upserted: 1 }),
    );
    expect(upsertCatalogDraftMock).toHaveBeenCalledTimes(1);
  });

  it("upserts a bulk payload in cloud mode", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValueOnce(false);

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products/bulk?storefront=xa-b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: [
            {
              title: "Studio Jacket",
              slug: "studio-jacket",
              brandHandle: "studio",
              collectionHandle: "aw26",
              description: "Tailored wool jacket.",
              price: "120",
              stock: "3",
              createdAt: "2026-01-01T00:00:00.000Z",
              taxonomy: { department: "women", category: "clothing", subcategory: "jackets", color: "black", material: "wool" },
              sizes: "S|M",
            },
          ],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: true, mode: "cloud", upserted: 1 }),
    );
    expect(readCloudDraftSnapshotMock).toHaveBeenCalledTimes(1);
    expect(writeCloudDraftSnapshotMock).toHaveBeenCalledTimes(1);
  });

  it("returns bounded diagnostics for invalid bulk rows", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products/bulk?storefront=xa-b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: [
            {
              title: "",
              slug: "studio-jacket",
            },
            {
              title: "",
              slug: "studio-jacket",
            },
          ],
        }),
      }),
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { diagnostics?: Array<{ row: number; code: string }> };
    expect(payload.diagnostics).toBeDefined();
    expect(payload.diagnostics?.length).toBeGreaterThan(0);
    expect(payload.diagnostics?.[0]).toEqual(
      expect.objectContaining({ row: 1, code: "validation_failed" }),
    );
    expect(upsertCatalogDraftMock).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const safeParseMock = jest.fn();
const slugifyMock = jest.fn((value: string) => value.toLowerCase().replace(/\s+/g, "-"));

jest.mock("@acme/lib/xa", () => ({
  catalogProductDraftSchema: {
    safeParse: (...args: unknown[]) => safeParseMock(...args),
  },
  slugify: (...args: unknown[]) => slugifyMock(...(args as [string])),
}));

const readCloudDraftSnapshotMock = jest.fn();
const upsertProductsInCloudSnapshotMock = jest.fn();
const writeCloudDraftSnapshotMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const parseStorefrontMock = jest.fn();
const readJsonBodyWithLimitMock = jest.fn();

class PayloadTooLargeErrorMock extends Error {}
class InvalidJsonErrorMock extends Error {}

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
  upsertProductsInCloudSnapshot: (...args: unknown[]) => upsertProductsInCloudSnapshotMock(...args),
  writeCloudDraftSnapshot: (...args: unknown[]) => writeCloudDraftSnapshotMock(...args),
}));

jest.mock("../../../../../../lib/catalogStorefront.ts", () => ({
  parseStorefront: (...args: unknown[]) => parseStorefrontMock(...args),
}));

jest.mock("../../../../../../lib/requestJson", () => ({
  PayloadTooLargeError: PayloadTooLargeErrorMock,
  InvalidJsonError: InvalidJsonErrorMock,
  readJsonBodyWithLimit: (...args: unknown[]) => readJsonBodyWithLimitMock(...args),
}));

jest.mock("../../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

describe("catalog products/bulk route", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    delete process.env.XA_UPLOADER_BULK_MAX_PRODUCTS;
    delete process.env.XA_UPLOADER_BULK_PAYLOAD_MAX_BYTES;

    hasUploaderSessionMock.mockResolvedValue(true);
    parseStorefrontMock.mockReturnValue("xa-b");

    safeParseMock.mockImplementation((entry: unknown) => ({ success: true, data: entry }));
    readJsonBodyWithLimitMock.mockResolvedValue({
      products: [
        { id: "p1", title: "Studio Jacket", slug: "studio-jacket" },
        { id: "p2", title: "Runway Coat", slug: "runway-coat" },
      ],
    });

    readCloudDraftSnapshotMock.mockResolvedValue({ products: [], revisionsById: {}, docRevision: "doc-rev-1" });
    upsertProductsInCloudSnapshotMock.mockReturnValue({
      products: [
        { id: "p1", title: "Studio Jacket", slug: "studio-jacket" },
        { id: "p2", title: "Runway Coat", slug: "runway-coat" },
      ],
      revisionsById: { p1: "rev-1", p2: "rev-2" },
    });
    writeCloudDraftSnapshotMock.mockResolvedValue({ docRevision: "doc-rev-2" });
  });

  it("returns diagnostics when payload has duplicate slugs", async () => {
    readJsonBodyWithLimitMock.mockResolvedValueOnce({
      products: [
        { id: "p1", title: "Studio Jacket", slug: "studio-jacket" },
        { id: "p2", title: "Studio Jacket", slug: "studio-jacket" },
      ],
    });

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products/bulk?storefront=xa-b", { method: "POST" }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "invalid", reason: "bulk_validation_failed" }),
    );
  });

  it("upserts products through the cloud snapshot path and returns doc revision", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products/bulk?storefront=xa-b", { method: "POST" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: true, mode: "cloud", upserted: 2, docRevision: "doc-rev-2" }),
    );
    expect(writeCloudDraftSnapshotMock).toHaveBeenCalledTimes(1);
  });

  it("returns catalog contract unavailable when the hosted draft contract is unconfigured", async () => {
    readCloudDraftSnapshotMock.mockRejectedValueOnce(new CatalogDraftContractErrorMock("unconfigured"));

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products/bulk?storefront=xa-b", { method: "POST" }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "service_unavailable", reason: "catalog_contract_unavailable" }),
    );
  });
});

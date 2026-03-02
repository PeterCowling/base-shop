import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const safeParseMock = jest.fn();
const slugifyMock = jest.fn((value: string) => value.toLowerCase().replace(/\s+/g, "-"));

jest.mock("@acme/lib/xa", () => ({
  catalogProductDraftSchema: {
    safeParse: (...args: unknown[]) => safeParseMock(...args),
  },
  slugify: (...args: unknown[]) => slugifyMock(...(args as [string])),
}));

const upsertCatalogDraftMock = jest.fn();
const readCloudDraftSnapshotMock = jest.fn();
const upsertProductInCloudSnapshotMock = jest.fn();
const writeCloudDraftSnapshotMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const parseStorefrontMock = jest.fn();
const isLocalFsRuntimeEnabledMock = jest.fn();
const rateLimitMock = jest.fn();
const applyRateLimitHeadersMock = jest.fn();
const getRequestIpMock = jest.fn();
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

jest.mock("../../../../../../lib/catalogCsv", () => ({
  upsertCatalogDraft: (...args: unknown[]) => upsertCatalogDraftMock(...args),
}));

jest.mock("../../../../../../lib/catalogDraftContractClient", () => ({
  CatalogDraftContractError: CatalogDraftContractErrorMock,
  readCloudDraftSnapshot: (...args: unknown[]) => readCloudDraftSnapshotMock(...args),
  upsertProductInCloudSnapshot: (...args: unknown[]) => upsertProductInCloudSnapshotMock(...args),
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

    getRequestIpMock.mockReturnValue("203.0.113.10");
    rateLimitMock.mockReturnValue({ allowed: true, remaining: 5, resetAt: Date.now() + 60_000 });
    applyRateLimitHeadersMock.mockImplementation(() => {});
    hasUploaderSessionMock.mockResolvedValue(true);
    parseStorefrontMock.mockReturnValue("xa-b");
    isLocalFsRuntimeEnabledMock.mockReturnValue(true);

    safeParseMock.mockImplementation((entry: unknown) => ({ success: true, data: entry }));
    readJsonBodyWithLimitMock.mockResolvedValue({
      products: [
        { id: "p1", title: "Studio Jacket", slug: "studio-jacket" },
        { id: "p2", title: "Runway Coat", slug: "runway-coat" },
      ],
    });

    upsertCatalogDraftMock.mockResolvedValue({});
    readCloudDraftSnapshotMock.mockResolvedValue({ products: [], revisionsById: {}, docRevision: "doc-rev-1" });
    upsertProductInCloudSnapshotMock.mockImplementation(({ product }: { product: { id: string } }) => ({
      products: [product],
      revisionsById: { [product.id]: "rev-1" },
    }));
    writeCloudDraftSnapshotMock.mockResolvedValue({ docRevision: "doc-rev-2" });
  });

  it("returns 429 when rate limited", async () => {
    rateLimitMock.mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const { POST } = await import("../route");
    const response = await POST(new Request("http://localhost/api/catalog/products/bulk", { method: "POST" }));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "rate_limited", reason: "products_bulk_rate_limited" }),
    );
  });

  it("returns 404 when unauthenticated", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(false);

    const { POST } = await import("../route");
    const response = await POST(new Request("http://localhost/api/catalog/products/bulk", { method: "POST" }));

    expect(response.status).toBe(404);
  });

  it("returns 413 when payload exceeds max bytes", async () => {
    readJsonBodyWithLimitMock.mockRejectedValueOnce(new PayloadTooLargeErrorMock("too large"));

    const { POST } = await import("../route");
    const response = await POST(new Request("http://localhost/api/catalog/products/bulk", { method: "POST" }));

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "payload_too_large", reason: "payload_too_large" }),
    );
  });

  it("returns diagnostics when payload has duplicate slugs", async () => {
    readJsonBodyWithLimitMock.mockResolvedValueOnce({
      products: [{ id: "p1", title: "Studio Jacket", slug: "studio-jacket" }, { id: "p2", title: "Studio Jacket", slug: "studio-jacket" }],
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

  it("upserts products in local mode", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products/bulk?storefront=xa-b", { method: "POST" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ ok: true, mode: "local", upserted: 2 }));
    expect(upsertCatalogDraftMock).toHaveBeenCalledTimes(2);
  });

  it("upserts products in cloud mode and returns doc revision", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValueOnce(false);

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

  it("returns service_unavailable when contract is unconfigured", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValueOnce(false);
    readCloudDraftSnapshotMock.mockRejectedValueOnce(new CatalogDraftContractErrorMock("unconfigured"));

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/products/bulk?storefront=xa-b", { method: "POST" }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "service_unavailable", reason: "local_fs_unavailable" }),
    );
  });
});

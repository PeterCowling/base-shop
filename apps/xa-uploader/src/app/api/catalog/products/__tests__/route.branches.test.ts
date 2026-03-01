import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const listCatalogDraftsMock = jest.fn();
const upsertCatalogDraftMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const parseStorefrontMock = jest.fn();
const rateLimitMock = jest.fn();
const applyRateLimitHeadersMock = jest.fn();
const getRequestIpMock = jest.fn();
const readJsonBodyWithLimitMock = jest.fn();

class InvalidJsonErrorMock extends Error {}
class PayloadTooLargeErrorMock extends Error {}

jest.mock("../../../../../lib/catalogCsv", () => ({
  listCatalogDrafts: (...args: unknown[]) => listCatalogDraftsMock(...args),
  upsertCatalogDraft: (...args: unknown[]) => upsertCatalogDraftMock(...args),
  CatalogCsvConflictError: class extends Error {},
}));

jest.mock("../../../../../lib/catalogStorefront.ts", () => ({
  parseStorefront: (...args: unknown[]) => parseStorefrontMock(...args),
}));

jest.mock("../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../lib/rateLimit", () => ({
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  applyRateLimitHeaders: (...args: unknown[]) => applyRateLimitHeadersMock(...args),
  getRequestIp: (...args: unknown[]) => getRequestIpMock(...args),
}));

jest.mock("../../../../../lib/requestJson", () => ({
  InvalidJsonError: InvalidJsonErrorMock,
  PayloadTooLargeError: PayloadTooLargeErrorMock,
  readJsonBodyWithLimit: (...args: unknown[]) => readJsonBodyWithLimitMock(...args),
}));

describe("catalog products route branch coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    parseStorefrontMock.mockReturnValue("xa-b");
    getRequestIpMock.mockReturnValue("203.0.113.10");
    rateLimitMock.mockReturnValue({ allowed: true, remaining: 5, resetAt: Date.now() + 60_000 });
    applyRateLimitHeadersMock.mockImplementation(() => {});
    listCatalogDraftsMock.mockResolvedValue({ products: [{ slug: "p1" }], revisionsById: { p1: "rev-1" } });
    readJsonBodyWithLimitMock.mockResolvedValue({ product: { title: "x", slug: "x" } });
    upsertCatalogDraftMock.mockResolvedValue({ product: { slug: "x" }, revision: "rev-2" });
  });

  it("GET returns products list on success", async () => {
    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/products?storefront=xa-b"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: true, products: [{ slug: "p1" }], revisionsById: { p1: "rev-1" } }),
    );
  });

  it("GET returns 404 when unauthenticated", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(false);
    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/products?storefront=xa-b"));
    expect(response.status).toBe(404);
  });

  it("GET returns 429 when rate limited", async () => {
    rateLimitMock.mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });
    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/products?storefront=xa-b"));
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "rate_limited", reason: "products_list_rate_limited" }),
    );
  });

  it("POST returns 404 when unauthenticated", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(false);
    const { POST } = await import("../route");
    const response = await POST(new Request("http://localhost/api/catalog/products", { method: "POST" }));
    expect(response.status).toBe(404);
  });

  it("POST returns 413 on payload too large parse error", async () => {
    readJsonBodyWithLimitMock.mockRejectedValueOnce(new PayloadTooLargeErrorMock("too large"));
    const { POST } = await import("../route");
    const response = await POST(new Request("http://localhost/api/catalog/products", { method: "POST" }));
    expect(response.status).toBe(413);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "payload_too_large", reason: "payload_too_large" }),
    );
  });

  it("POST returns 429 when rate limited", async () => {
    rateLimitMock.mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });
    const { POST } = await import("../route");
    const response = await POST(new Request("http://localhost/api/catalog/products", { method: "POST" }));
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "rate_limited", reason: "products_upsert_rate_limited" }),
    );
  });
});

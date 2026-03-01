import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const getCatalogDraftBySlugMock = jest.fn();
const deleteCatalogProductMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const parseStorefrontMock = jest.fn();
const rateLimitMock = jest.fn();
const applyRateLimitHeadersMock = jest.fn();
const getRequestIpMock = jest.fn();

jest.mock("../../../../../../lib/catalogCsv", () => ({
  getCatalogDraftBySlug: (...args: unknown[]) => getCatalogDraftBySlugMock(...args),
  deleteCatalogProduct: (...args: unknown[]) => deleteCatalogProductMock(...args),
}));

jest.mock("../../../../../../lib/catalogStorefront.ts", () => ({
  parseStorefront: (...args: unknown[]) => parseStorefrontMock(...args),
}));

jest.mock("../../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../../lib/rateLimit", () => ({
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  applyRateLimitHeaders: (...args: unknown[]) => applyRateLimitHeadersMock(...args),
  getRequestIp: (...args: unknown[]) => getRequestIpMock(...args),
}));

describe("catalog product-by-slug branch coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    parseStorefrontMock.mockReturnValue("xa-b");
    getRequestIpMock.mockReturnValue("203.0.113.20");
    rateLimitMock.mockReturnValue({ allowed: true, remaining: 5, resetAt: Date.now() + 60_000 });
    applyRateLimitHeadersMock.mockImplementation(() => {});
    getCatalogDraftBySlugMock.mockResolvedValue({ slug: "studio-jacket", title: "Studio jacket" });
    deleteCatalogProductMock.mockResolvedValue({ deleted: true });
  });

  it("GET returns product on success", async () => {
    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/products/studio-jacket"), {
      params: Promise.resolve({ slug: "studio-jacket" }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        product: expect.objectContaining({ slug: "studio-jacket" }),
      }),
    );
  });

  it("GET returns 404 when unauthenticated", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(false);
    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/products/studio-jacket"), {
      params: Promise.resolve({ slug: "studio-jacket" }),
    });
    expect(response.status).toBe(404);
  });

  it("GET returns 429 when rate limited", async () => {
    rateLimitMock.mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });
    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/products/studio-jacket"), {
      params: Promise.resolve({ slug: "studio-jacket" }),
    });
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "rate_limited", reason: "product_get_rate_limited" }),
    );
  });

  it("DELETE returns 404 when unauthenticated", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(false);
    const { DELETE } = await import("../route");
    const response = await DELETE(new Request("http://localhost/api/catalog/products/studio-jacket"), {
      params: Promise.resolve({ slug: "studio-jacket" }),
    });
    expect(response.status).toBe(404);
  });

  it("DELETE returns 429 when rate limited", async () => {
    rateLimitMock.mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 });
    const { DELETE } = await import("../route");
    const response = await DELETE(new Request("http://localhost/api/catalog/products/studio-jacket"), {
      params: Promise.resolve({ slug: "studio-jacket" }),
    });
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual(
      expect.objectContaining({ ok: false, error: "rate_limited", reason: "product_delete_rate_limited" }),
    );
  });
});

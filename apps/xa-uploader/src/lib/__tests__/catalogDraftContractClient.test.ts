import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

const ENV_KEYS = [
  "XA_CATALOG_CONTRACT_BASE_URL",
  "XA_CATALOG_CONTRACT_READ_TOKEN",
  "XA_CATALOG_CONTRACT_WRITE_TOKEN",
  "XA_TEST_ENABLE_CLOUDFLARE_CONTEXT",
] as const;
const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const getCloudflareContextMock = jest.fn();

jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: (...args: unknown[]) => getCloudflareContextMock(...args),
}));

describe("catalogDraftContractClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    getCloudflareContextMock.mockRejectedValue(new Error("no_cloudflare_context"));
    process.env.XA_CATALOG_CONTRACT_BASE_URL = "https://drop.example/catalog/";
    delete process.env.XA_CATALOG_CONTRACT_READ_TOKEN;
    process.env.XA_CATALOG_CONTRACT_WRITE_TOKEN = "catalog-write-token-1234567890";
    process.env.XA_TEST_ENABLE_CLOUDFLARE_CONTEXT = "1";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("throws unconfigured when base url is missing", async () => {
    delete process.env.XA_CATALOG_CONTRACT_BASE_URL;
    const { readCloudDraftSnapshot } = await import("../catalogDraftContractClient");

    await expect(readCloudDraftSnapshot("xa-b")).rejects.toMatchObject({
      code: "unconfigured",
    });
  });

  it("resolves draft endpoint from catalog base and parses snapshot", async () => {
    process.env.XA_CATALOG_CONTRACT_BASE_URL = "https://drop.example/catalog";
    global.fetch = jest.fn(async () =>
      Response.json({
        ok: true,
        products: [{ title: "Studio jacket", slug: "studio-jacket", brandHandle: "a", collectionHandle: "b", price: "1", description: "x", createdAt: "2026-03-02T00:00:00.000Z", popularity: "0", stock: "0", taxonomy: { department: "women", category: "bags", subcategory: "tote", color: "black", material: "leather" } }],
        revisionsById: { p1: "rev-1" },
        docRevision: "doc-rev-1",
      }),
    ) as unknown as typeof fetch;

    const { readCloudDraftSnapshot } = await import("../catalogDraftContractClient");
    const snapshot = await readCloudDraftSnapshot("xa-b");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://drop.example/drafts/xa-b",
      expect.objectContaining({
        method: "GET",
        headers: { "X-XA-Catalog-Token": "catalog-write-token-1234567890" },
      }),
    );
    expect(snapshot.docRevision).toBe("doc-rev-1");
    expect(snapshot.revisionsById).toEqual({ p1: "rev-1" });
  });

  it("resolves draft endpoint when base url includes catalog storefront path", async () => {
    process.env.XA_CATALOG_CONTRACT_BASE_URL = "https://drop.example/catalog/xa-b";
    global.fetch = jest.fn(async () =>
      Response.json({
        ok: true,
        products: [],
        revisionsById: {},
        docRevision: "doc-rev-1",
      }),
    ) as unknown as typeof fetch;

    const { readCloudDraftSnapshot } = await import("../catalogDraftContractClient");
    await readCloudDraftSnapshot("xa-b");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://drop.example/drafts/xa-b",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("preserves upstream path prefix before catalog route segment", async () => {
    process.env.XA_CATALOG_CONTRACT_BASE_URL = "https://drop.example/api/catalog/xa-b";
    global.fetch = jest.fn(async () =>
      Response.json({
        ok: true,
        products: [],
        revisionsById: {},
        docRevision: "doc-rev-1",
      }),
    ) as unknown as typeof fetch;

    const { readCloudDraftSnapshot } = await import("../catalogDraftContractClient");
    await readCloudDraftSnapshot("xa-b");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://drop.example/api/drafts/xa-b",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("uses cloudflare service binding when available", async () => {
    const bindingFetchMock = jest.fn(async () =>
      Response.json({
        ok: true,
        products: [],
        revisionsById: {},
        docRevision: "doc-rev-1",
      }),
    );
    getCloudflareContextMock.mockResolvedValueOnce({
      env: {
        XA_CATALOG_CONTRACT_SERVICE: {
          fetch: bindingFetchMock,
        },
      },
    });
    global.fetch = jest.fn(async () => Response.json({ ok: false })) as unknown as typeof fetch;

    const { readCloudDraftSnapshot } = await import("../catalogDraftContractClient");
    await readCloudDraftSnapshot("xa-b");

    expect(bindingFetchMock).toHaveBeenCalledWith(
      "https://catalog-contract.internal/drafts/xa-b",
      expect.objectContaining({ method: "GET" }),
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("prefers read token for draft reads when configured", async () => {
    process.env.XA_CATALOG_CONTRACT_READ_TOKEN = "catalog-read-token-1234567890";
    global.fetch = jest.fn(async () =>
      Response.json({
        ok: true,
        products: [],
        revisionsById: {},
        docRevision: "doc-rev-1",
      }),
    ) as unknown as typeof fetch;

    const { readCloudDraftSnapshot } = await import("../catalogDraftContractClient");
    await readCloudDraftSnapshot("xa-b");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://drop.example/drafts/xa-b",
      expect.objectContaining({
        method: "GET",
        headers: { "X-XA-Catalog-Token": "catalog-read-token-1234567890" },
      }),
    );
  });

  it("throws conflict on 409 write response", async () => {
    global.fetch = jest.fn(async () => new Response(null, { status: 409 })) as unknown as typeof fetch;

    const { writeCloudDraftSnapshot } = await import("../catalogDraftContractClient");
    await expect(
      writeCloudDraftSnapshot({ storefront: "xa-b", products: [], revisionsById: {} }),
    ).rejects.toMatchObject({ code: "conflict", status: 409 });
  });

  it("throws request_failed when delete is rejected", async () => {
    global.fetch = jest.fn(async () => new Response(null, { status: 502 })) as unknown as typeof fetch;

    const { deleteCloudDraftSnapshot } = await import("../catalogDraftContractClient");
    await expect(deleteCloudDraftSnapshot("xa-b")).rejects.toMatchObject({
      code: "request_failed",
      status: 502,
    });
  });

  it("detects duplicate slugs in local cloud snapshot updates", async () => {
    const { upsertProductInCloudSnapshot } = await import("../catalogDraftContractClient");

    expect(() =>
      upsertProductInCloudSnapshot({
        product: {
          id: "p2",
          title: "Studio jacket",
          slug: "studio-jacket",
          brandHandle: "atelier-x",
          collectionHandle: "outerwear",
          price: "189",
          description: "desc",
          createdAt: "2026-03-02T00:00:00.000Z",
          popularity: "0",
          stock: "1",
          taxonomy: {
            department: "women",
            category: "bags",
            subcategory: "tote",
            color: "black",
            material: "leather",
          },
        },
        snapshot: {
          products: [
            {
              id: "p1",
              title: "Studio jacket",
              slug: "studio-jacket",
              brandHandle: "atelier-x",
              collectionHandle: "outerwear",
              price: "189",
              description: "desc",
              createdAt: "2026-03-01T00:00:00.000Z",
              popularity: "0",
              stock: "1",
              taxonomy: {
                department: "women",
                category: "bags",
                subcategory: "tote",
                color: "black",
                material: "leather",
              },
            },
          ],
          revisionsById: { p1: "rev-1" },
          docRevision: "doc-1",
        },
      }),
    ).toThrow("Duplicate product slug");
  });
});

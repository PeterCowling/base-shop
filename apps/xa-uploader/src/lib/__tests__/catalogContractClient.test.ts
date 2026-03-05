import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

const readFileMock = jest.fn();
const getCloudflareContextMock = jest.fn();

jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: (...args: unknown[]) => getCloudflareContextMock(...args),
}));

jest.mock("node:fs/promises", () => ({
  __esModule: true,
  default: {
    readFile: (...args: unknown[]) => readFileMock(...args),
  },
}));

const ENV_KEYS = [
  "XA_CATALOG_CONTRACT_BASE_URL",
  "XA_CATALOG_CONTRACT_WRITE_TOKEN",
  "XA_CATALOG_CONTRACT_TIMEOUT_MS",
] as const;
const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

describe("catalogContractClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    getCloudflareContextMock.mockRejectedValue(new Error("no_cloudflare_context"));
    process.env.XA_CATALOG_CONTRACT_BASE_URL = "https://drop.example/catalog/";
    process.env.XA_CATALOG_CONTRACT_WRITE_TOKEN = "catalog-write-token-1234567890";
    delete process.env.XA_CATALOG_CONTRACT_TIMEOUT_MS;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("reports readiness errors when env is missing", async () => {
    delete process.env.XA_CATALOG_CONTRACT_BASE_URL;
    delete process.env.XA_CATALOG_CONTRACT_WRITE_TOKEN;

    const { getCatalogContractReadiness } = await import("../catalogContractClient");
    const readiness = getCatalogContractReadiness();

    expect(readiness.configured).toBe(false);
    expect(readiness.errors).toEqual(
      expect.arrayContaining([
        "XA_CATALOG_CONTRACT_BASE_URL not set",
        "XA_CATALOG_CONTRACT_WRITE_TOKEN not set",
      ]),
    );
  });

  it("throws unconfigured when write token is missing", async () => {
    delete process.env.XA_CATALOG_CONTRACT_WRITE_TOKEN;

    const { publishCatalogPayloadToContract } = await import("../catalogContractClient");
    await expect(
      publishCatalogPayloadToContract({
        storefrontId: "xa-b",
        payload: {
          storefront: "xa-b",
          publishedAt: "2026-03-02T00:00:00.000Z",
          catalog: { products: [] },
          mediaIndex: { items: [] },
        },
      }),
    ).rejects.toMatchObject({ code: "unconfigured" });
  });

  it("throws request_failed with status/details on non-ok response", async () => {
    global.fetch = jest.fn(async () =>
      new Response("denied", { status: 403, headers: { "Content-Type": "text/plain" } }),
    ) as unknown as typeof fetch;

    const { publishCatalogPayloadToContract } = await import("../catalogContractClient");
    await expect(
      publishCatalogPayloadToContract({
        storefrontId: "xa-b",
        payload: {
          storefront: "xa-b",
          publishedAt: "2026-03-02T00:00:00.000Z",
          catalog: { products: [] },
          mediaIndex: { items: [] },
        },
      }),
    ).rejects.toMatchObject({
      code: "request_failed",
      status: 403,
      details: "denied",
    });
  });

  it("throws invalid_response when success body is not valid json", async () => {
    global.fetch = jest.fn(async () => new Response("not-json", { status: 200 })) as unknown as typeof fetch;

    const { publishCatalogPayloadToContract } = await import("../catalogContractClient");
    await expect(
      publishCatalogPayloadToContract({
        storefrontId: "xa-b",
        payload: {
          storefront: "xa-b",
          publishedAt: "2026-03-02T00:00:00.000Z",
          catalog: { products: [] },
          mediaIndex: { items: [] },
        },
      }),
    ).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("returns version and publishedAt on valid success payload", async () => {
    global.fetch = jest.fn(async () =>
      Response.json({ ok: true, version: "20260302-abcdef", publishedAt: "2026-03-02T10:00:00.000Z" }),
    ) as unknown as typeof fetch;

    const { publishCatalogPayloadToContract } = await import("../catalogContractClient");
    await expect(
      publishCatalogPayloadToContract({
        storefrontId: "xa-b",
        payload: {
          storefront: "xa-b",
          publishedAt: "2026-03-02T00:00:00.000Z",
          catalog: { products: [] },
          mediaIndex: { items: [] },
        },
      }),
    ).resolves.toEqual({
      version: "20260302-abcdef",
      publishedAt: "2026-03-02T10:00:00.000Z",
    });
  });

  it("builds payload from artifact files", async () => {
    readFileMock
      .mockResolvedValueOnce(JSON.stringify({ products: [] }))
      .mockResolvedValueOnce(JSON.stringify({ items: [] }));
    global.fetch = jest.fn(async () => Response.json({ ok: true })) as unknown as typeof fetch;

    const { publishCatalogArtifactsToContract } = await import("../catalogContractClient");
    await publishCatalogArtifactsToContract({
      storefrontId: "xa-b",
      catalogOutPath: "/tmp/catalog.json",
      mediaOutPath: "/tmp/media.json",
    });

    expect(readFileMock).toHaveBeenNthCalledWith(1, "/tmp/catalog.json", "utf8");
    expect(readFileMock).toHaveBeenNthCalledWith(2, "/tmp/media.json", "utf8");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://drop.example/catalog/xa-b",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("normalizes storefront-scoped base URL for publish route", async () => {
    process.env.XA_CATALOG_CONTRACT_BASE_URL = "https://drop.example/catalog/xa-b";
    global.fetch = jest.fn(async () => Response.json({ ok: true })) as unknown as typeof fetch;

    const { publishCatalogPayloadToContract } = await import("../catalogContractClient");
    await publishCatalogPayloadToContract({
      storefrontId: "xa-b",
      payload: {
        storefront: "xa-b",
        publishedAt: "2026-03-02T00:00:00.000Z",
        catalog: { products: [] },
        mediaIndex: { items: [] },
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://drop.example/catalog/xa-b",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("uses cloudflare service binding when available", async () => {
    const bindingFetchMock = jest.fn(async () => Response.json({ ok: true }));
    getCloudflareContextMock.mockResolvedValueOnce({
      env: {
        XA_CATALOG_CONTRACT_SERVICE: {
          fetch: bindingFetchMock,
        },
      },
    });
    global.fetch = jest.fn(async () => Response.json({ ok: false })) as unknown as typeof fetch;

    const { publishCatalogPayloadToContract } = await import("../catalogContractClient");
    await publishCatalogPayloadToContract({
      storefrontId: "xa-b",
      payload: {
        storefront: "xa-b",
        publishedAt: "2026-03-02T00:00:00.000Z",
        catalog: { products: [] },
        mediaIndex: { items: [] },
      },
    });

    expect(bindingFetchMock).toHaveBeenCalledWith(
      "https://catalog-contract.internal/catalog/xa-b",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

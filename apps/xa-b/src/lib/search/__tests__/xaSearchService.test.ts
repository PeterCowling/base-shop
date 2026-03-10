import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

describe("xaSearchService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetModules();
  });

  it("uses cached index and maps worker ids to products", async () => {
    jest.doMock("../../demoData", () => ({ XA_PRODUCTS: [] }));
    jest.doMock("../xaSearchDb", () => ({
      readXaSearchCache: jest.fn().mockResolvedValue({
        version: "v1",
        products: [{ slug: "studio-jacket", title: "Studio Jacket", brand: "AX", collection: "Outerwear" }],
        index: { documents: [], index: {} },
      }),
      writeXaSearchCache: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock("../xaSearchWorkerClient", () => ({
      buildXaSearchIndex: jest.fn(),
      loadXaSearchIndex: jest.fn().mockResolvedValue(undefined),
      searchXaIndex: jest.fn().mockResolvedValue(["studio-jacket"]),
    }));
    jest.doMock("../xaSearchConfig", () => ({ toXaSearchDoc: (doc: unknown) => doc }));

    const { getXaSearchService } = await import("../xaSearchService");
    const service = await getXaSearchService();
    await expect(service.searchProducts("jacket")).resolves.toEqual([
      { slug: "studio-jacket", title: "Studio Jacket", brand: "AX", collection: "Outerwear" },
    ]);
  });

  it("falls back to substring search when worker query throws", async () => {
    jest.doMock("../../demoData", () => ({
      XA_PRODUCTS: [
        { slug: "studio-jacket", title: "Studio Jacket", brand: "AX", collection: "Outerwear" },
        { slug: "city-bag", title: "City Bag", brand: "BX", collection: "Bags" },
      ],
    }));
    jest.doMock("../xaSearchDb", () => ({
      readXaSearchCache: jest.fn().mockResolvedValue({ version: "v1", products: [], index: undefined }),
      writeXaSearchCache: jest.fn().mockResolvedValue(undefined),
    }));
    jest.doMock("../xaSearchWorkerClient", () => ({
      buildXaSearchIndex: jest.fn().mockResolvedValue({ documents: [], index: {} }),
      loadXaSearchIndex: jest.fn().mockResolvedValue(undefined),
      searchXaIndex: jest.fn().mockRejectedValue(new Error("worker-down")),
    }));
    jest.doMock("../xaSearchConfig", () => ({ toXaSearchDoc: (doc: unknown) => doc }));

    const { getXaSearchService } = await import("../xaSearchService");
    const service = await getXaSearchService();
    await expect(service.searchProducts("bag")).resolves.toEqual([
      { slug: "city-bag", title: "City Bag", brand: "BX", collection: "Bags" },
    ]);
  });
});

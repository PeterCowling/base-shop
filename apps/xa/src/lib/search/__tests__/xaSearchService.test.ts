import { describe, expect, it, jest } from "@jest/globals";

import { XA_PRODUCTS } from "../../demoData";

const readXaSearchCache = jest.fn(async () => ({}));
const writeXaSearchCache = jest.fn(async () => undefined);
const buildXaSearchIndex = jest.fn(async () => "index");
const loadXaSearchIndex = jest.fn(async () => undefined);
const searchXaIndex = jest.fn(async () => [XA_PRODUCTS[0]?.slug ?? ""]);

jest.mock("../xaSearchDb", () => ({
  readXaSearchCache: (...args: unknown[]) => readXaSearchCache(...args),
  writeXaSearchCache: (...args: unknown[]) => writeXaSearchCache(...args),
}));

jest.mock("../xaSearchWorkerClient", () => ({
  buildXaSearchIndex: (...args: unknown[]) => buildXaSearchIndex(...args),
  loadXaSearchIndex: (...args: unknown[]) => loadXaSearchIndex(...args),
  searchXaIndex: (...args: unknown[]) => searchXaIndex(...args),
}));

describe("xaSearchService", () => {
  it("returns all products on empty query", async () => {
    jest.resetModules();
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const { getXaSearchService } = await import("../xaSearchService");
    const service = await getXaSearchService();
    const products = await service.searchProducts("");
    expect(products.length).toBeGreaterThan(0);
  });

  it("returns matched products from worker search", async () => {
    jest.resetModules();
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const { getXaSearchService } = await import("../xaSearchService");
    const service = await getXaSearchService();
    const results = await service.searchProducts("studio");
    expect(results[0]?.slug).toBe(XA_PRODUCTS[0]?.slug);
  });
});

import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";

const getShopById = jest.fn();
const getSanityConfig = jest.fn();

jest.mock("@acme/platform-core/repositories/shop.server", () => ({ getShopById }));
jest.mock("@acme/platform-core/shops", () => ({ getSanityConfig }));

import { getConfig, collectProductSlugs, filterExistingProductSlugs } from "../config";

describe("blog config service", () => {
  beforeEach(() => {
    getShopById.mockReset();
    getSanityConfig.mockReset();
  });

  afterEach(() => {
    (global.fetch as jest.Mock | undefined)?.mockReset?.();
  });

  test("getConfig returns sanity config", async () => {
    const config = { projectId: "p", dataset: "d", token: "t" };
    getShopById.mockResolvedValue({ id: "shop1" });
    getSanityConfig.mockReturnValue(config);
    await expect(getConfig("shop1")).resolves.toEqual(config);
  });

  test("getConfig throws when missing config", async () => {
    getShopById.mockResolvedValue({ id: "shop2" });
    getSanityConfig.mockReturnValue(undefined);
    await expect(getConfig("shop2")).rejects.toThrow(
      "Missing Sanity config for shop shop2",
    );
  });

  test("collectProductSlugs extracts nested slugs", () => {
    const content = {
      a: { _type: "productReference", slug: "s1" },
      b: [
        { nested: { _type: "productReference", slug: "s2" } },
        { _type: "productReference", slug: "s1" },
      ],
    };
    expect(collectProductSlugs(content).sort()).toEqual(["s1", "s2"]);
  });

  describe("filterExistingProductSlugs", () => {
    test("returns [] and skips fetch for empty slugs", async () => {
      const fetchMock = jest.fn();
      global.fetch = fetchMock as any;
      await expect(
        filterExistingProductSlugs("shop", []),
      ).resolves.toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    test("returns [] on non-ok response", async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false }) as any;
      await expect(
        filterExistingProductSlugs("shop", ["a"]),
      ).resolves.toEqual([]);
    });

    test("returns original slugs when JSON is not an array", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ not: "array" }),
      }) as any;
      await expect(
        filterExistingProductSlugs("shop", ["a", "b"]),
      ).resolves.toEqual(["a", "b"]);
    });

    test("returns filtered slugs", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ["a"],
      }) as any;
      await expect(
        filterExistingProductSlugs("shop", ["a", "b"]),
      ).resolves.toEqual(["a"]);
    });

    test("returns full list on invalid JSON", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("bad");
        },
      }) as any;
      await expect(
        filterExistingProductSlugs("shop", ["a", "b"]),
      ).resolves.toEqual(["a", "b"]);
    });

    test("returns null on network failure", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("network")) as any;
      await expect(
        filterExistingProductSlugs("shop", ["a"]),
      ).resolves.toBeNull();
    });
  });
});


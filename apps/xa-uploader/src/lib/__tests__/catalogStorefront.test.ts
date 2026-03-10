import { describe, expect, it } from "@jest/globals";

import {
  DEFAULT_STOREFRONT,
  getStorefrontConfig,
  parseStorefront,
  XA_CATALOG_STOREFRONTS,
} from "../catalogStorefront";

describe("catalogStorefront", () => {
  it("resolves supported storefront values", () => {
    expect(parseStorefront("xa-b")).toBe("xa-b");
  });

  it("falls back to default storefront for invalid values", () => {
    expect(parseStorefront("unknown")).toBe(DEFAULT_STOREFRONT);
    expect(parseStorefront(undefined)).toBe(DEFAULT_STOREFRONT);
    expect(parseStorefront(null)).toBe(DEFAULT_STOREFRONT);
  });

  it("returns storefront config with fallback", () => {
    const direct = getStorefrontConfig("xa-b");
    expect(direct).toEqual(expect.objectContaining({ id: "xa-b", appDir: "xa-b" }));

    const fallback = getStorefrontConfig("not-real");
    expect(fallback).toEqual(XA_CATALOG_STOREFRONTS[0]);
  });
});

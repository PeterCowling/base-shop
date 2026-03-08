import { describe, expect, it } from "@jest/globals";

import {
  isCatalogMediaPathSpec,
  normalizeCatalogMediaPath,
} from "../catalogSyncCommon";

describe("catalogSyncCommon media path helpers", () => {
  it("normalizes leading slashes for catalog-relative paths", () => {
    expect(normalizeCatalogMediaPath("/images/hermes/birkin-25/1.jpg")).toBe(
      "images/hermes/birkin-25/1.jpg",
    );
  });

  it("keeps absolute URLs unchanged", () => {
    expect(normalizeCatalogMediaPath("https://cdn.example.com/a.jpg")).toBe(
      "https://cdn.example.com/a.jpg",
    );
  });

  it("detects uploader and legacy catalog key formats", () => {
    expect(isCatalogMediaPathSpec("/images/hermes/birkin-25/1.jpg")).toBe(true);
    expect(isCatalogMediaPathSpec("images/hermes/birkin-25/1.jpg")).toBe(true);
    expect(isCatalogMediaPathSpec("xa-b/hermes-birkin-25/1709510400-front.jpg")).toBe(true);
    expect(isCatalogMediaPathSpec("https://cdn.example.com/a.jpg")).toBe(true);
  });

  it("does not classify source-file specs as catalog keys", () => {
    expect(isCatalogMediaPathSpec("./lookbook/front.jpg")).toBe(false);
    expect(isCatalogMediaPathSpec("catalog-images/**/*.jpg")).toBe(false);
  });
});

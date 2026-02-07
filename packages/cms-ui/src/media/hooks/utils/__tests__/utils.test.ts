import { beforeEach,describe, expect, it, jest } from "@jest/globals";

import { ensureHasUrl, hasUrl } from "../utils";

describe("media utils: hasUrl/ensureHasUrl", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("detects when a media item has a non-empty url", () => {
    expect(hasUrl({ url: "https://example.com/img.png", type: "image" } as any)).toBe(
      true
    );
    expect(hasUrl({ url: "", type: "image" } as any)).toBe(false);
    expect(hasUrl({ type: "image" } as any)).toBe(false);
  });

  it("filters out items without a url (empty or missing) and warns per missing", () => {
    const items = [
      { url: "https://a/img.png", type: "image" },
      { type: "image" },
      { url: "   ", type: "image" },
      { url: "https://b/img.png", type: "image" },
    ] as any[];

    const result = ensureHasUrl(items as any);
    // current implementation treats non-empty strings (even whitespace) as present
    expect(result.map((i) => i.url)).toEqual([
      "https://a/img.png",
      "   ",
      "https://b/img.png",
    ]);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});

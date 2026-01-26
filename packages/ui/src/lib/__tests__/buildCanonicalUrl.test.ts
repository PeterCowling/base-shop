import { buildCanonicalUrl } from "../seo/buildCanonicalUrl";

describe("buildCanonicalUrl", () => {
  it("joins base url and path safely", () => {
    expect(buildCanonicalUrl("https://example.com/", "/en/guide")).toBe("https://example.com/en/guide");
    expect(buildCanonicalUrl("https://example.com", "en/guide")).toBe("https://example.com/en/guide");
  });

  it("returns absolute path unchanged", () => {
    expect(buildCanonicalUrl("https://example.com", "https://cdn.example/foo")).toBe("https://cdn.example/foo");
  });

  it("handles empty inputs", () => {
    expect(buildCanonicalUrl("", "/en/guide")).toBe("/en/guide");
    expect(buildCanonicalUrl("https://example.com/", "")).toBe("https://example.com");
  });
});

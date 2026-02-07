import { buildCanonicalUrl } from "../seo/buildCanonicalUrl";

describe("buildCanonicalUrl", () => {
  it("joins base url and path safely, preserving trailing slashes", () => {
    expect(buildCanonicalUrl("https://example.com/", "/en/guide/")).toBe("https://example.com/en/guide/");
    expect(buildCanonicalUrl("https://example.com", "en/guide")).toBe("https://example.com/en/guide");
  });

  it("returns absolute path unchanged, preserving trailing slash", () => {
    expect(buildCanonicalUrl("https://example.com", "https://cdn.example/foo/")).toBe("https://cdn.example/foo/");
    expect(buildCanonicalUrl("https://example.com", "https://cdn.example/foo")).toBe("https://cdn.example/foo");
  });

  it("handles empty inputs", () => {
    expect(buildCanonicalUrl("", "/en/guide")).toBe("/en/guide");
    expect(buildCanonicalUrl("https://example.com/", "")).toBe("https://example.com");
  });

  it("preserves trailing slashes to align with server behavior", () => {
    expect(buildCanonicalUrl("https://example.com", "/en/")).toBe("https://example.com/en/");
    expect(buildCanonicalUrl("https://example.com", "/")).toBe("https://example.com/");
  });
});

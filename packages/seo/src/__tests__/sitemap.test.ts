import {
  buildSitemapEntry,
  buildSitemapWithAlternates,
} from "../sitemap/index.js";

describe("buildSitemapEntry", () => {
  it("creates a basic sitemap entry", () => {
    const entry = buildSitemapEntry({
      siteUrl: "https://example.com",
      path: "/about",
      lastModified: "2026-01-15",
    });
    expect(entry.url).toBe("https://example.com/about");
    expect(entry.lastModified).toBe("2026-01-15");
  });

  it("strips trailing slash from siteUrl", () => {
    const entry = buildSitemapEntry({
      siteUrl: "https://example.com/",
      path: "/about",
    });
    expect(entry.url).toBe("https://example.com/about");
  });
});

describe("buildSitemapWithAlternates", () => {
  // TC-04: sitemap entries with hreflang alternates
  it("returns entries with alternates per locale", () => {
    const entries = buildSitemapWithAlternates(
      [{ path: "/rooms", lastModified: "2026-01-15" }],
      {
        siteUrl: "https://example.com",
        locales: ["en", "it"],
        defaultLocale: "en",
      },
    );

    expect(entries).toHaveLength(1);
    const entry = entries[0]!;
    expect(entry.url).toBe("https://example.com/en/rooms");
    expect(entry.lastModified).toBe("2026-01-15");
    expect(entry.alternates).toBeDefined();
    expect(entry.alternates?.languages).toEqual({
      en: "https://example.com/en/rooms",
      it: "https://example.com/it/rooms",
    });
  });

  it("handles root path correctly", () => {
    const entries = buildSitemapWithAlternates(
      [{ path: "", lastModified: "2026-01-15" }],
      {
        siteUrl: "https://example.com",
        locales: ["en", "it"],
        defaultLocale: "en",
      },
    );

    const entry = entries[0]!;
    expect(entry.url).toBe("https://example.com/en");
    expect(entry.alternates?.languages).toEqual({
      en: "https://example.com/en",
      it: "https://example.com/it",
    });
  });

  it("uses first locale as default when defaultLocale not specified", () => {
    const entries = buildSitemapWithAlternates(
      [{ path: "/page", lastModified: "2026-01-15" }],
      {
        siteUrl: "https://example.com",
        locales: ["fr", "de"],
      },
    );

    const entry = entries[0]!;
    // URL uses first locale (fr) as the primary
    expect(entry.url).toBe("https://example.com/fr/page");
  });

  it("handles multiple pages", () => {
    const entries = buildSitemapWithAlternates(
      [
        { path: "/rooms", lastModified: "2026-01-15" },
        { path: "/faq", lastModified: "2026-01-10" },
      ],
      {
        siteUrl: "https://example.com",
        locales: ["en"],
        defaultLocale: "en",
      },
    );

    expect(entries).toHaveLength(2);
    expect(entries[0]!.url).toBe("https://example.com/en/rooms");
    expect(entries[1]!.url).toBe("https://example.com/en/faq");
  });
});

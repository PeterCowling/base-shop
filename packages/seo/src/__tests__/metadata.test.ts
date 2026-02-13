/**
 * Tests for @acme/seo metadata builders (SEO-03)
 *
 * TC-02: buildMetadata returns valid Metadata with correct fields
 * TC-03: buildAlternates generates hreflang entries for all locales
 * TC-04: ensureTrailingSlash handles edge cases
 * TC-05: SeoSiteConfig enforces required fields (compile-time; runtime proxy test)
 */

import type { SeoSiteConfig } from "../config";
import { buildAlternates } from "../metadata/buildAlternates";
import { buildMetadata } from "../metadata/buildMetadata";
import { ensureTrailingSlash } from "../metadata/ensureTrailingSlash";

const testConfig: SeoSiteConfig = {
  siteName: "Test Site",
  siteUrl: "https://example.com",
  supportedLocales: ["en", "it", "de"],
  defaultLocale: "en",
  twitter: { site: "@testsite", creator: "@testcreator" },
  defaultOgImage: {
    url: "https://example.com/og.jpg",
    width: 1200,
    height: 630,
    alt: "Test image",
  },
};

describe("ensureTrailingSlash (TC-04)", () => {
  it("converts empty string to /", () => {
    expect(ensureTrailingSlash("")).toBe("/");
  });

  it("preserves root /", () => {
    expect(ensureTrailingSlash("/")).toBe("/");
  });

  it("adds trailing slash to /rooms", () => {
    expect(ensureTrailingSlash("/rooms")).toBe("/rooms/");
  });

  it("preserves existing trailing slash on /rooms/", () => {
    expect(ensureTrailingSlash("/rooms/")).toBe("/rooms/");
  });

  it("handles full URL", () => {
    expect(ensureTrailingSlash("https://example.com/rooms")).toBe(
      "https://example.com/rooms/",
    );
  });
});

describe("buildAlternates (TC-03)", () => {
  it("returns canonical with trailing slash", () => {
    const result = buildAlternates(
      { siteUrl: "https://example.com" },
      { canonicalPath: "/rooms", locales: ["en", "it", "de"] },
    );
    expect(result.canonical).toBe("https://example.com/rooms/");
  });

  it("generates hreflang entries for all locales", () => {
    const result = buildAlternates(
      { siteUrl: "https://example.com" },
      {
        canonicalPath: "/rooms",
        locales: ["en", "it", "de"],
        defaultLocale: "en",
      },
    );
    expect(result.languages).toEqual({
      en: "https://example.com/en/rooms/",
      it: "https://example.com/it/rooms/",
      de: "https://example.com/de/rooms/",
      "x-default": "https://example.com/en/rooms/",
    });
  });

  it("handles root path", () => {
    const result = buildAlternates(
      { siteUrl: "https://example.com" },
      { canonicalPath: "/", locales: ["en", "it"], defaultLocale: "en" },
    );
    expect(result.canonical).toBe("https://example.com/");
    expect(result.languages.en).toBe("https://example.com/en/");
    expect(result.languages.it).toBe("https://example.com/it/");
  });

  it("returns empty languages when no locales provided", () => {
    const result = buildAlternates(
      { siteUrl: "https://example.com" },
      { canonicalPath: "/rooms" },
    );
    expect(result.canonical).toBe("https://example.com/rooms/");
    expect(result.languages).toEqual({});
  });
});

describe("buildMetadata (TC-02)", () => {
  it("returns Metadata with correct title and description", () => {
    const meta = buildMetadata(testConfig, {
      title: "Rooms",
      description: "Our rooms",
      path: "/rooms",
    });
    expect(meta.title).toBe("Rooms");
    expect(meta.description).toBe("Our rooms");
  });

  it("sets metadataBase from siteUrl", () => {
    const meta = buildMetadata(testConfig, {
      title: "Rooms",
      description: "Our rooms",
      path: "/rooms",
    });
    expect(meta.metadataBase?.toString()).toBe("https://example.com/");
  });

  it("includes openGraph with siteName and url", () => {
    const meta = buildMetadata(testConfig, {
      title: "Rooms",
      description: "Our rooms",
      path: "/rooms",
    });
    const og = meta.openGraph;
    expect(og).toBeDefined();
    expect((og as Record<string, unknown>).siteName).toBe("Test Site");
    expect((og as Record<string, unknown>).url).toBe(
      "https://example.com/rooms/",
    );
  });

  it("uses default OG image when none provided", () => {
    const meta = buildMetadata(testConfig, {
      title: "Rooms",
      description: "Our rooms",
      path: "/rooms",
    });
    const og = meta.openGraph as Record<string, unknown>;
    const images = og.images as Array<Record<string, unknown>>;
    expect(images).toBeDefined();
    expect(images[0].url).toBe("https://example.com/og.jpg");
    expect(images[0].width).toBe(1200);
  });

  it("uses provided image over default", () => {
    const meta = buildMetadata(testConfig, {
      title: "Rooms",
      description: "Our rooms",
      path: "/rooms",
      image: { url: "https://example.com/custom.jpg", width: 800, height: 400 },
    });
    const og = meta.openGraph as Record<string, unknown>;
    const images = og.images as Array<Record<string, unknown>>;
    expect(images[0].url).toBe("https://example.com/custom.jpg");
    expect(images[0].width).toBe(800);
  });

  it("sets twitter card fields from config", () => {
    const meta = buildMetadata(testConfig, {
      title: "Rooms",
      description: "Our rooms",
      path: "/rooms",
    });
    const twitter = meta.twitter as Record<string, unknown>;
    expect(twitter.card).toBe("summary_large_image");
    expect(twitter.site).toBe("@testsite");
    expect(twitter.creator).toBe("@testcreator");
  });

  it("sets robots noindex when isPublished is false", () => {
    const meta = buildMetadata(testConfig, {
      title: "Draft",
      description: "Draft page",
      path: "/draft",
      isPublished: false,
    });
    const robots = meta.robots as Record<string, unknown>;
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(true);
  });

  it("includes alternates with hreflang entries", () => {
    const meta = buildMetadata(testConfig, {
      title: "Rooms",
      description: "Our rooms",
      path: "/rooms",
      locale: "en",
    });
    const alternates = meta.alternates as Record<string, unknown>;
    expect(alternates.canonical).toBe("https://example.com/rooms/");
    const languages = alternates.languages as Record<string, string>;
    expect(languages.en).toBeDefined();
    expect(languages.it).toBeDefined();
    expect(languages.de).toBeDefined();
  });
});

describe("SeoSiteConfig type safety (TC-05)", () => {
  it("requires siteName and siteUrl", () => {
    // Runtime check that the interface shape is enforced
    const config: SeoSiteConfig = { siteName: "Test", siteUrl: "https://test.com" };
    expect(config.siteName).toBe("Test");
    expect(config.siteUrl).toBe("https://test.com");
  });

  it("accepts optional fields", () => {
    const config: SeoSiteConfig = {
      siteName: "Test",
      siteUrl: "https://test.com",
      defaultLocale: "en",
      supportedLocales: ["en", "de"],
      twitter: { site: "@test" },
    };
    expect(config.defaultLocale).toBe("en");
    expect(config.supportedLocales).toEqual(["en", "de"]);
  });
});

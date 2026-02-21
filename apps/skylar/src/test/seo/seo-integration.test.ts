/**
 * SEO-08: Skylar @acme/seo integration tests
 *
 * Tests robots.ts, sitemap.ts, JSON-LD (Organization),
 * page metadata via skylarMetadata, and llms.txt builder.
 */
import { organizationJsonLd } from "@acme/seo/jsonld";
import { buildMetadata } from "@acme/seo/metadata";
import { buildRobotsMetadataRoute } from "@acme/seo/robots";
import { buildSitemapWithAlternates } from "@acme/seo/sitemap";

describe("Skylar SEO integration", () => {
  const SITE_URL = "https://skylarsrl.com";
  const LOCALES = ["en", "it", "zh"];

  // TC-01: robots.ts with environment-aware indexing
  describe("robots.ts", () => {
    test("TC-01: returns correct MetadataRoute.Robots object when indexing enabled", () => {
      const robots = buildRobotsMetadataRoute({
        siteUrl: SITE_URL,
        allowIndexing: true,
        sitemapPaths: ["/sitemap.xml"],
      });

      expect(robots.rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userAgent: "*",
            allow: "/",
          }),
        ]),
      );
      expect(robots.sitemap).toEqual([`${SITE_URL}/sitemap.xml`]);
    });

    test("TC-01b: disallows all when indexing disabled", () => {
      const robots = buildRobotsMetadataRoute({
        siteUrl: SITE_URL,
        allowIndexing: false,
      });

      expect(robots.rules).toEqual([{ userAgent: "*", disallow: "/" }]);
      expect(robots.sitemap).toBeUndefined();
    });
  });

  // TC-02: sitemap.ts with hreflang for 3 locales
  describe("sitemap.ts", () => {
    test("TC-02: returns entries for all pages with hreflang alternates", () => {
      const pages = [
        { path: "", priority: 1.0 },
        { path: "/products", priority: 0.9 },
        { path: "/real-estate", priority: 0.8 },
        { path: "/people", priority: 0.7 },
      ];

      const entries = buildSitemapWithAlternates(pages, {
        siteUrl: SITE_URL,
        locales: LOCALES,
        defaultLocale: "en",
      });

      expect(entries).toHaveLength(4);

      // Home entry
      expect(entries[0].url).toBe(`${SITE_URL}/en`);
      expect(entries[0].alternates!.languages).toEqual({
        en: `${SITE_URL}/en`,
        it: `${SITE_URL}/it`,
        zh: `${SITE_URL}/zh`,
      });

      // Products entry
      expect(entries[1].url).toBe(`${SITE_URL}/en/products`);
      expect(entries[1].priority).toBe(0.9);
    });
  });

  // TC-03: Organization JSON-LD
  describe("Organization JSON-LD", () => {
    test("TC-03: renders Organization schema with Skylar SRL data", () => {
      const org = organizationJsonLd({
        name: "Skylar SRL",
        url: SITE_URL,
      });

      expect(org["@context"]).toBe("https://schema.org");
      expect(org["@type"]).toBe("Organization");
      expect(org.name).toBe("Skylar SRL");
      expect(org.url).toBe(SITE_URL);
    });
  });

  // TC-04: Page metadata via buildMetadata
  describe("Page metadata", () => {
    test("TC-04: generateMetadata returns title + description + canonical + hreflang", () => {
      const siteConfig = {
        siteName: "Skylar SRL",
        siteUrl: SITE_URL,
        defaultLocale: "en",
        supportedLocales: LOCALES,
      };

      const metadata = buildMetadata(siteConfig, {
        title: "Products & Platforms",
        description: "Skylar product design and sourcing",
        path: "/en/products",
        locale: "en",
      });

      expect(metadata.title).toBe("Products & Platforms");
      expect(metadata.description).toBe("Skylar product design and sourcing");
      expect(metadata.alternates?.canonical).toBeDefined();
      expect(metadata.openGraph?.title).toBe("Products & Platforms");
    });
  });

  // TC-05: metadataBase from buildMetadata
  describe("metadataBase", () => {
    test("TC-05: metadataBase is set from siteUrl config", () => {
      const siteConfig = {
        siteName: "Skylar SRL",
        siteUrl: SITE_URL,
        defaultLocale: "en",
        supportedLocales: LOCALES,
      };

      const metadata = buildMetadata(siteConfig, {
        title: "Skylar SRL",
        description: "Product design and distribution",
        path: "/en",
        locale: "en",
      });

      expect(metadata.metadataBase?.toString()).toContain("skylarsrl.com");
    });
  });

  // TC-06: llms.txt builder
  describe("llms.txt", () => {
    test("TC-06: llms.txt contains valid markdown", () => {
      const { buildLlmsTxt } = require("@acme/seo/ai");

      const content = buildLlmsTxt({
        siteName: "Skylar SRL",
        description:
          "Product design, China sourcing, custom distribution, and multilingual platforms.",
        sources: [
          { title: "Sitemap", url: "/sitemap.xml" },
          { title: "Robots", url: "/robots.txt" },
        ],
      });

      expect(content).toContain("# Skylar SRL");
      expect(content).toContain("## Machine-readable sources");
      expect(content).toContain("[Sitemap](/sitemap.xml)");
    });
  });
});

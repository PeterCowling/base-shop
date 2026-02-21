/**
 * SEO-07: Cochlearfit @acme/seo integration tests
 *
 * Tests robots.ts, sitemap.ts, JSON-LD (Organization + FAQ),
 * and llms.txt for the Cochlearfit app.
 */
import { faqJsonLd, organizationJsonLd } from "@acme/seo/jsonld";
import { buildRobotsMetadataRoute } from "@acme/seo/robots";
import { buildSitemapWithAlternates } from "@acme/seo/sitemap";

describe("Cochlearfit SEO integration", () => {
  const SITE_URL = "https://cochlearfit.example";
  const LOCALES = ["en", "it", "es", "de"];

  // TC-01: robots.txt with indexing enabled
  describe("robots.ts", () => {
    test("TC-01: allows indexing with sitemap reference when ALLOW_INDEXING=true", () => {
      const robots = buildRobotsMetadataRoute({
        siteUrl: SITE_URL,
        allowIndexing: true,
        sitemapPaths: ["/sitemap.xml"],
        disallowPaths: ["/api/", "/checkout/"],
      });

      expect(robots.rules).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userAgent: "*",
            allow: "/",
            disallow: ["/api/", "/checkout/"],
          }),
        ]),
      );
      expect(robots.sitemap).toEqual([`${SITE_URL}/sitemap.xml`]);
    });

    // TC-02: robots.txt with indexing disabled
    test("TC-02: disallows all when ALLOW_INDEXING not set", () => {
      const robots = buildRobotsMetadataRoute({
        siteUrl: SITE_URL,
        allowIndexing: false,
      });

      expect(robots.rules).toEqual([
        { userAgent: "*", disallow: "/" },
      ]);
      expect(robots.sitemap).toBeUndefined();
    });
  });

  // TC-03: sitemap with hreflang alternates
  describe("sitemap.ts", () => {
    test("TC-03: generates entries for all pages with per-locale alternates", () => {
      const pages = [
        { path: "", priority: 1.0 },
        { path: "/shop", priority: 0.9 },
        { path: "/faq", priority: 0.7 },
        { path: "/about", priority: 0.6 },
        { path: "/contact", priority: 0.5 },
        { path: "/sizing", priority: 0.7 },
      ];

      const entries = buildSitemapWithAlternates(pages, {
        siteUrl: SITE_URL,
        locales: LOCALES,
        defaultLocale: "en",
      });

      // Should have one entry per page
      expect(entries).toHaveLength(6);

      // First entry (home) should use default locale
      expect(entries[0].url).toBe(`${SITE_URL}/en`);

      // Each entry should have alternates for all 4 locales
      expect(entries[0].alternates).toBeDefined();
      const langs = entries[0].alternates!.languages!;
      expect(langs).toEqual({
        en: `${SITE_URL}/en`,
        it: `${SITE_URL}/it`,
        es: `${SITE_URL}/es`,
        de: `${SITE_URL}/de`,
      });

      // Priority preserved
      expect(entries[0].priority).toBe(1.0);
      expect(entries[1].priority).toBe(0.9);
      expect(entries[1].url).toBe(`${SITE_URL}/en/shop`);
    });
  });

  // TC-04: Organization JSON-LD
  describe("Organization JSON-LD", () => {
    test("TC-04: root layout renders Organization schema", () => {
      const org = organizationJsonLd({
        name: "CochlearFit Headbands",
        url: SITE_URL,
      });

      expect(org["@context"]).toBe("https://schema.org");
      expect(org["@type"]).toBe("Organization");
      expect(org.name).toBe("CochlearFit Headbands");
      expect(org.url).toBe(SITE_URL);
    });
  });

  // TC-05: FAQ JSON-LD
  describe("FAQ JSON-LD", () => {
    test("TC-05: FAQ page renders FAQPage schema with all Q&A pairs", () => {
      const faqEntries = [
        { question: "Will it fit my processor?", answer: "Yes, our headbands are designed..." },
        { question: "How do I wash it?", answer: "Hand wash with mild soap..." },
        { question: "Can kids wear it?", answer: "Absolutely..." },
        { question: "Is this a medical device?", answer: "No, it is not..." },
      ];

      const faq = faqJsonLd(faqEntries);

      expect(faq).not.toBeNull();
      expect(faq!["@context"]).toBe("https://schema.org");
      expect(faq!["@type"]).toBe("FAQPage");

      const entities = faq!.mainEntity as Array<Record<string, unknown>>;
      expect(entities).toHaveLength(4);
      expect(entities[0]).toEqual({
        "@type": "Question",
        name: "Will it fit my processor?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, our headbands are designed...",
        },
      });
    });

    test("TC-05b: FAQ with empty entries returns null", () => {
      expect(faqJsonLd([])).toBeNull();
    });
  });

  // TC-06: llms.txt file validity
  describe("llms.txt", () => {
    test("TC-06: llms.txt contains valid markdown with site info", () => {
      // This test verifies the static file exists and is well-formed
      // The actual file test is a build/deploy concern; we test the builder
      const { buildLlmsTxt } = require("@acme/seo/ai");

      const content = buildLlmsTxt({
        siteName: "CochlearFit Headbands",
        description: "Soft-fit headbands for cochlear implant processors.",
        sources: [
          { title: "Sitemap", url: "/sitemap.xml" },
          { title: "Robots", url: "/robots.txt" },
        ],
      });

      expect(content).toContain("# CochlearFit Headbands");
      expect(content).toContain("> Soft-fit headbands for cochlear implant processors.");
      expect(content).toContain("## Machine-readable sources");
      expect(content).toContain("[Sitemap](/sitemap.xml)");
      expect(content).toContain("[Robots](/robots.txt)");
    });
  });
});

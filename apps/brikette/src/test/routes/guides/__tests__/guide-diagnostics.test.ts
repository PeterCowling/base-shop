/**
 * Tests for the guide diagnostics system
 *
 * Validates that analyzeGuideCompleteness accurately detects content presence
 * across different guide types and content patterns.
 */

import {
  analyzeGuideCompleteness,
  analyzeTranslationCoverage,
} from "@/routes/guides/guide-diagnostics";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { loadGuidesForTest } from "@/test/helpers/loadGuidesForTest";

describe("guide diagnostics", () => {
  beforeAll(() => {
    // Load actual guide content from filesystem for testing
    loadGuidesForTest(["en"]);
  });

  describe("analyzeGuideCompleteness", () => {
    describe("positanoMainBeach - full content guide with FAQs", () => {
      let result: ReturnType<typeof analyzeGuideCompleteness>;

      beforeAll(() => {
        result = analyzeGuideCompleteness("positanoMainBeach", "en");
      });

      it("detects intro content", () => {
        expect(result.fields.intro).toBe(true);
      });

      it("detects sections content", () => {
        expect(result.fields.sections).toBe(true);
      });

      it("detects FAQ content", () => {
        expect(result.fields.faqs).toBe(true);
        expect(result.faqCount).toBe(3);
      });

      it("detects SEO fields", () => {
        expect(result.fields.seo).toBe(true);
        expect(result.seoFields.title).toBe(true);
        expect(result.seoFields.description).toBe(true);
      });

      it("returns correct guide key and language", () => {
        expect(result.guideKey).toBe("positanoMainBeach");
        expect(result.lang).toBe("en");
      });
    });

    describe("positanoMainBeachBusBack - guide without FAQs", () => {
      let result: ReturnType<typeof analyzeGuideCompleteness>;

      beforeAll(() => {
        result = analyzeGuideCompleteness("positanoMainBeachBusBack", "en");
      });

      it("detects intro content", () => {
        expect(result.fields.intro).toBe(true);
      });

      it("detects sections content with inline images", () => {
        expect(result.fields.sections).toBe(true);

        // Verify sections are actually present in the content
        const sectionsRaw = getGuideResource("en", "content.positanoMainBeachBusBack.sections", {
          includeFallback: false,
        });
        expect(Array.isArray(sectionsRaw)).toBe(true);
        expect((sectionsRaw as unknown[]).length).toBeGreaterThan(0);
      });

      it("correctly reports no FAQs", () => {
        expect(result.fields.faqs).toBe(false);
        expect(result.faqCount).toBe(0);
      });

      it("detects SEO fields", () => {
        expect(result.fields.seo).toBe(true);
        expect(result.seoFields.title).toBe(true);
        expect(result.seoFields.description).toBe(true);
      });
    });

    describe("pathOfTheGodsNocelle - guide with FAQs", () => {
      let result: ReturnType<typeof analyzeGuideCompleteness>;

      beforeAll(() => {
        result = analyzeGuideCompleteness("pathOfTheGodsNocelle", "en");
      });

      it("detects all required content fields", () => {
        expect(result.fields.intro).toBe(true);
        expect(result.fields.sections).toBe(true);
        expect(result.fields.faqs).toBe(true);
        expect(result.fields.seo).toBe(true);
      });

      it("counts FAQ entries accurately", () => {
        expect(result.faqCount).toBe(3);
      });
    });
  });

  describe("content detection accuracy", () => {
    it("retrieves actual section data from positanoMainBeach", () => {
      const sectionsRaw = getGuideResource("en", "content.positanoMainBeach.sections", {
        includeFallback: false,
      });

      expect(Array.isArray(sectionsRaw)).toBe(true);
      expect((sectionsRaw as unknown[]).length).toBeGreaterThan(0);

      // Verify structure of a known section
      const sections = sectionsRaw as Array<{ id?: string; title?: string; body?: string[] }>;
      const layoutSection = sections.find((section) => section.id === "layout");

      expect(layoutSection).toBeTruthy();
      expect(layoutSection?.title).toBeTruthy();
      expect(Array.isArray(layoutSection?.body)).toBe(true);
    });

    it("retrieves actual FAQ data from positanoMainBeach", () => {
      const faqsRaw = getGuideResource("en", "content.positanoMainBeach.faqs", {
        includeFallback: false,
      });

      expect(Array.isArray(faqsRaw)).toBe(true);
      const faqs = faqsRaw as Array<{ q?: string; a?: string[] }>;
      expect(faqs.length).toBe(3);
      expect(faqs[0]?.q).toBeTruthy();
      expect(Array.isArray(faqs[0]?.a)).toBe(true);
    });

    it("retrieves SEO data correctly", () => {
      const seoTitle = getGuideResource<string>("en", "content.positanoMainBeach.seo.title", {
        includeFallback: false,
      });
      const seoDescription = getGuideResource<string>("en", "content.positanoMainBeach.seo.description", {
        includeFallback: false,
      });

      expect(typeof seoTitle).toBe("string");
      expect(seoTitle.length).toBeGreaterThan(0);
      expect(typeof seoDescription).toBe("string");
      expect(seoDescription.length).toBeGreaterThan(0);
    });
  });

  describe("analyzeTranslationCoverage", () => {
    it("analyzes coverage for a single locale", () => {
      const result = analyzeTranslationCoverage("positanoMainBeach", ["en"]);

      expect(result.guideKey).toBe("positanoMainBeach");
      expect(result.totalLocales).toBe(1);
      expect(result.completeLocales).toContain("en");
      expect(result.missingLocales).toEqual([]);
    });

    it("marks locale as complete when all required fields present", () => {
      const result = analyzeTranslationCoverage("positanoMainBeach", ["en"]);

      expect(result.locales[0]?.locale).toBe("en");
      expect(result.locales[0]?.complete).toBe(true);
      expect(result.locales[0]?.missing).toEqual([]);
    });

    it("does not require intro when English lacks it", () => {
      const result = analyzeTranslationCoverage("checkinCheckout", ["en"]);

      expect(result.locales[0]?.locale).toBe("en");
      expect(result.locales[0]?.missing).not.toContain("intro");
      expect(result.locales[0]?.complete).toBe(true);
    });
  });
});

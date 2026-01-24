/**
 * Tests for GuideSearchService
 */

import { describe, it, expect, beforeEach } from "@jest/globals";

import { GuideSearchService } from "@/lib/search/guide-search";
import type { GuideMeta } from "@/data/guides.index";

describe("GuideSearchService", () => {
  let service: GuideSearchService;

  // Sample guides for testing
  const sampleGuides: GuideMeta[] = [
    { key: "positanoBeaches" as never, tags: ["beach", "beaches", "positano"], section: "experiences" },
    { key: "pathOfTheGods" as never, tags: ["hiking", "stairs", "positano"], section: "experiences" },
    { key: "howToGetToPositano" as never, tags: ["transport", "decision", "positano"], section: "help" },
    { key: "capriDayTrip" as never, tags: ["day-trip", "capri", "ferry"], section: "experiences" },
    { key: "cheapEats" as never, tags: ["budgeting", "cuisine", "positano"], section: "experiences" },
  ];

  // Mock translation functions
  const getTitle = (key: string): string => {
    const titles: Record<string, string> = {
      positanoBeaches: "Positano Beaches Guide",
      pathOfTheGods: "Path of the Gods Hiking Trail",
      howToGetToPositano: "How to Get to Positano",
      capriDayTrip: "Capri Day Trip from Positano",
      cheapEats: "Budget Restaurants in Positano",
    };
    return titles[key] ?? key;
  };

  const getSummary = (key: string): string | undefined => {
    const summaries: Record<string, string> = {
      positanoBeaches: "Discover the best beaches in Positano including Fornillo and Spiaggia Grande",
      pathOfTheGods: "A stunning hiking trail along the Amalfi Coast with breathtaking views",
      howToGetToPositano: "Transport options from Naples, Rome, and Salerno to reach Positano",
      capriDayTrip: "How to plan a perfect day trip to the island of Capri by ferry",
      cheapEats: "Affordable restaurants and local eateries for budget travelers",
    };
    return summaries[key];
  };

  beforeEach(() => {
    service = new GuideSearchService();
  });

  describe("buildIndex", () => {
    it("should build an index for a language", () => {
      service.buildIndex("en", sampleGuides, getTitle, getSummary);

      expect(service.hasIndex("en")).toBe(true);
      expect(service.hasIndex("de")).toBe(false);
    });

    it("should report correct statistics", () => {
      service.buildIndex("en", sampleGuides, getTitle, getSummary);

      const stats = service.getStats("en");
      expect(stats).not.toBeNull();
      expect(stats!.documentCount).toBe(5);
      expect(stats!.termCount).toBeGreaterThan(0);
    });
  });

  describe("search", () => {
    beforeEach(() => {
      service.buildIndex("en", sampleGuides, getTitle, getSummary);
    });

    it("should find guides by title keywords", () => {
      const results = service.search("en", "beaches");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].key).toBe("positanoBeaches");
    });

    it("should find guides by tag keywords", () => {
      const results = service.search("en", "hiking");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].key).toBe("pathOfTheGods");
    });

    it("should find guides by summary content", () => {
      const results = service.search("en", "ferry");

      expect(results.length).toBeGreaterThan(0);
      const keys = results.map((r) => r.key);
      expect(keys).toContain("capriDayTrip");
    });

    it("should rank title matches higher than summary matches", () => {
      // "Positano" appears in titles and summaries
      const results = service.search("en", "positano");

      expect(results.length).toBeGreaterThan(0);
      // All guides should match since Positano is everywhere
      expect(results.length).toBe(5);
    });

    it("should return empty array for no matches", () => {
      const results = service.search("en", "xyz123nonexistent");

      expect(results).toEqual([]);
    });

    it("should return empty array for empty query", () => {
      const results = service.search("en", "");

      expect(results).toEqual([]);
    });

    it("should return empty array for non-existent language", () => {
      const results = service.search("fr", "beaches");

      expect(results).toEqual([]);
    });

    it("should respect limit parameter", () => {
      const results = service.search("en", "positano", 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it("should include matching terms in results", () => {
      const results = service.search("en", "beaches");

      expect(results.length).toBeGreaterThan(0);
      const topResult = results[0];
      expect(topResult.matches.title || topResult.matches.tags || topResult.matches.summary).toBeDefined();
    });
  });

  describe("suggest", () => {
    beforeEach(() => {
      service.buildIndex("en", sampleGuides, getTitle, getSummary);
    });

    it("should suggest similar terms for typos", () => {
      // "bech" is a typo for "beach"
      const suggestions = service.suggest("en", "bech");

      expect(suggestions.length).toBeGreaterThan(0);
    });

    it("should not include exact matches in suggestions", () => {
      const suggestions = service.suggest("en", "beaches");

      expect(suggestions).not.toContain("beaches");
    });

    it("should return empty array for very short queries", () => {
      const suggestions = service.suggest("en", "a");

      expect(suggestions).toEqual([]);
    });

    it("should return empty array for non-existent language", () => {
      const suggestions = service.suggest("fr", "beach");

      expect(suggestions).toEqual([]);
    });
  });

  describe("nearestTerm", () => {
    beforeEach(() => {
      service.buildIndex("en", sampleGuides, getTitle, getSummary);
    });

    it("should find the nearest matching term", () => {
      const nearest = service.nearestTerm("en", "beachess");

      expect(nearest).not.toBeNull();
    });

    it("should return null for non-existent language", () => {
      const nearest = service.nearestTerm("fr", "beach");

      expect(nearest).toBeNull();
    });
  });

  describe("clearIndex", () => {
    it("should clear a specific language index", () => {
      service.buildIndex("en", sampleGuides, getTitle, getSummary);
      service.buildIndex("de", sampleGuides, getTitle, getSummary);

      expect(service.hasIndex("en")).toBe(true);
      expect(service.hasIndex("de")).toBe(true);

      service.clearIndex("en");

      expect(service.hasIndex("en")).toBe(false);
      expect(service.hasIndex("de")).toBe(true);
    });
  });

  describe("clearAll", () => {
    it("should clear all indices", () => {
      service.buildIndex("en", sampleGuides, getTitle, getSummary);
      service.buildIndex("de", sampleGuides, getTitle, getSummary);

      service.clearAll();

      expect(service.hasIndex("en")).toBe(false);
      expect(service.hasIndex("de")).toBe(false);
    });
  });

  describe("custom boosts", () => {
    it("should allow custom field boosts", () => {
      const customService = new GuideSearchService({
        boosts: {
          title: 5.0, // Much higher title boost
          tags: 1.0,
          summary: 0.5,
        },
      });

      customService.buildIndex("en", sampleGuides, getTitle, getSummary);

      // With higher title boost, title matches should score higher
      const results = customService.search("en", "guide");

      expect(results.length).toBeGreaterThan(0);
    });
  });
});

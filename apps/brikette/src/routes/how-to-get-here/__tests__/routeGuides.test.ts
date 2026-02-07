// src/routes/how-to-get-here/__tests__/routeGuides.test.ts
// Tests for the how-to-get-here route guide canonical mapping.
// Ensures the mapping stays in sync with routes.json and GUIDE_SLUG_OVERRIDES.

import routesJson from "@/data/how-to-get-here/routes.json";
import {
  HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS,
  HOW_TO_GET_HERE_ROUTE_GUIDES,
  getHowToGetHereRouteSlug,
  getHowToGetHereRouteTags,
  isHowToGetHereRouteGuideKey,
} from "@/data/how-to-get-here/routeGuides";
import { GUIDES_INDEX } from "@/data/guides.index";
import { GUIDE_BASE_KEY_OVERRIDES, guideNamespace } from "@/guides/slugs/namespaces";
import { GUIDE_SLUG_OVERRIDES } from "@/guides/slugs/overrides";
import { guidePath, resolveGuideKeyFromSlug } from "@/guides/slugs/urls";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { listAppRouterUrls } from "@/routing/routeInventory";

describe("routeGuides", () => {
  const routesJsonSlugs = Object.keys(routesJson.routes).sort();
  const routeGuideSlugs = HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS.map((key) =>
    getHowToGetHereRouteSlug(key),
  ).sort();

  describe("1:1 sync with routes.json", () => {
    it("has exactly 24 route guide keys", () => {
      expect(HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS).toHaveLength(24);
    });

    it("has the same number of routes as routes.json", () => {
      expect(HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS.length).toBe(routesJsonSlugs.length);
    });

    it("maps to exactly the same slugs as routes.json", () => {
      expect(routeGuideSlugs).toEqual(routesJsonSlugs);
    });

    it("has no duplicate keys", () => {
      const keySet = new Set(HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS);
      expect(keySet.size).toBe(HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS.length);
    });

    it("has no duplicate slugs", () => {
      const slugSet = new Set(routeGuideSlugs);
      expect(slugSet.size).toBe(routeGuideSlugs.length);
    });
  });

  describe("isHowToGetHereRouteGuideKey type guard", () => {
    it("returns true for valid keys", () => {
      for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
        expect(isHowToGetHereRouteGuideKey(key)).toBe(true);
      }
    });

    it("returns false for invalid keys", () => {
      expect(isHowToGetHereRouteGuideKey("not-a-key")).toBe(false);
      expect(isHowToGetHereRouteGuideKey("")).toBe(false);
      expect(isHowToGetHereRouteGuideKey("amalfi-positano-bus")).toBe(false); // slug, not key
    });
  });

  describe("getHowToGetHereRouteSlug", () => {
    it("returns the correct slug for each key", () => {
      // Spot check some mappings
      expect(getHowToGetHereRouteSlug("amalfiPositanoBus")).toBe("amalfi-positano-bus");
      expect(getHowToGetHereRouteSlug("positanoCapriFerry")).toBe("positano-capri-ferry");
      expect(getHowToGetHereRouteSlug("naplesCenterTrainBus")).toBe(
        "naples-center-train-bus",
      );
      expect(getHowToGetHereRouteSlug("positanoToNaplesDirectionsByFerry")).toBe(
        "positano-to-naples-directions-by-ferry",
      );
    });
  });

  describe("getHowToGetHereRouteTags", () => {
    it("always includes transport tag", () => {
      for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
        const tags = getHowToGetHereRouteTags(key);
        expect(tags).toContain("transport");
      }
    });

    it("always includes at least one transport mode tag", () => {
      const transportModes = ["bus", "ferry", "train"];
      for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
        const tags = getHowToGetHereRouteTags(key);
        const hasModeTag = transportModes.some((mode) => tags.includes(mode));
        expect(hasModeTag).toBe(true);
      }
    });

    it("always includes positano location tag", () => {
      for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
        const tags = getHowToGetHereRouteTags(key);
        expect(tags).toContain("positano");
      }
    });

    it("returns expected tags for specific routes", () => {
      expect(getHowToGetHereRouteTags("amalfiPositanoBus")).toEqual([
        "transport",
        "bus",
        "amalfi",
        "positano",
      ]);
      expect(getHowToGetHereRouteTags("naplesCenterTrainBus")).toEqual([
        "transport",
        "train",
        "bus",
        "naples",
        "positano",
      ]);
      expect(getHowToGetHereRouteTags("positanoRavelloFerryBus")).toEqual([
        "transport",
        "ferry",
        "bus",
        "positano",
        "ravello",
      ]);
    });
  });

  describe("HOW_TO_GET_HERE_ROUTE_GUIDES structure", () => {
    it("each entry has required properties", () => {
      for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
        const entry = HOW_TO_GET_HERE_ROUTE_GUIDES[key];
        expect(entry).toHaveProperty("slug");
        expect(entry).toHaveProperty("tags");
        expect(typeof entry.slug).toBe("string");
        expect(Array.isArray(entry.tags)).toBe(true);
      }
    });
  });

  // TASK-02: GUIDE_SLUG_OVERRIDES integration
  describe("GUIDE_SLUG_OVERRIDES integration (TASK-02)", () => {
    it("every route guide key has a slug override entry", () => {
      for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
        expect(GUIDE_SLUG_OVERRIDES[key]).toBeDefined();
      }
    });

    it("slug overrides match the canonical slug from routeGuides", () => {
      for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
        const override = GUIDE_SLUG_OVERRIDES[key];
        const canonicalSlug = getHowToGetHereRouteSlug(key);
        // At minimum, the English slug should match
        expect(override?.en).toBe(canonicalSlug);
      }
    });

    it("resolveGuideKeyFromSlug resolves for all supported languages", () => {
      const supportedLangs = i18nConfig.supportedLngs as AppLanguage[];

      for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
        const slug = getHowToGetHereRouteSlug(key);

        for (const lang of supportedLangs) {
          const resolved = resolveGuideKeyFromSlug(slug, lang);
          expect(resolved).toBe(key);
        }
      }
    });
  });

  // TASK-03: GUIDE_BASE_KEY_OVERRIDES integration
  describe("GUIDE_BASE_KEY_OVERRIDES integration (TASK-03)", () => {
    it("every route guide key has a base key override entry", () => {
      for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
        expect(GUIDE_BASE_KEY_OVERRIDES[key as never]).toBeDefined();
      }
    });

    it("all base key overrides are set to howToGetHere", () => {
      for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
        expect(GUIDE_BASE_KEY_OVERRIDES[key as never]).toBe("howToGetHere");
      }
    });

    it("guideNamespace returns howToGetHere baseKey for all route keys", () => {
      const testLang = "en" as AppLanguage;

      for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
        const namespace = guideNamespace(testLang, key as never);
        expect(namespace.baseKey).toBe("howToGetHere");
      }
    });
  });

  // TASK-04: GUIDES_INDEX integration
  describe("GUIDES_INDEX integration (TASK-04)", () => {
    it("every route guide key has a GUIDES_INDEX entry", () => {
      const indexKeys = new Set(GUIDES_INDEX.map((g) => g.key));

      for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
        expect(indexKeys.has(key)).toBe(true);
      }
    });

    it("all GUIDES_INDEX entries have section howToGetHere", () => {
      // Updated from "help" to "howToGetHere" as part of guide-system-unification TASK-02
      for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
        const entry = GUIDES_INDEX.find((g) => g.key === key);
        expect(entry?.section).toBe("howToGetHere");
      }
    });

    it("all GUIDES_INDEX entries have status published", () => {
      for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
        const entry = GUIDES_INDEX.find((g) => g.key === key);
        expect(entry?.status).toBe("published");
      }
    });

    it("all GUIDES_INDEX entries have transport tag", () => {
      for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
        const entry = GUIDES_INDEX.find((g) => g.key === key);
        expect(entry?.tags).toContain("transport");
      }
    });

    it("GUIDES_INDEX tags match canonical routeGuides tags", () => {
      for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
        const indexEntry = GUIDES_INDEX.find((g) => g.key === key);
        const canonicalTags = getHowToGetHereRouteTags(key);

        expect(indexEntry?.tags).toEqual(expect.arrayContaining([...canonicalTags]));
        expect(canonicalTags).toEqual(expect.arrayContaining(indexEntry?.tags ?? []));
      }
    });
  });

  // TASK-05: URL inventory integration
  describe("URL inventory integration (TASK-05)", () => {
    const supportedLangs = i18nConfig.supportedLngs as AppLanguage[];
    const allUrls = listAppRouterUrls();

    it("URL inventory includes all how-to-get-here routes", () => {
      for (const lang of supportedLangs) {
        for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
          const path = guidePath(lang, key as never);
          expect(allUrls).toContain(path);
        }
      }
    });

    it("URL inventory has exactly 432 how-to-get-here route URLs (24 routes × 18 languages)", () => {
      // Build set of expected URLs from guidePath for all routes
      const expectedUrls = new Set<string>();
      for (const lang of supportedLangs) {
        for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
          expectedUrls.add(guidePath(lang, key as never));
        }
      }

      // Verify count is exactly 24 × 18 = 432
      expect(expectedUrls.size).toBe(24 * 18);

      // Verify all expected URLs are in the inventory
      const allUrlsSet = new Set(allUrls);
      for (const url of expectedUrls) {
        expect(allUrlsSet.has(url)).toBe(true);
      }
    });

    it("URL inventory has no duplicate URLs", () => {
      const urlSet = new Set(allUrls);
      expect(urlSet.size).toBe(allUrls.length);
    });
  });

  // TASK-02 (guide-system-unification): GUIDES_INDEX.section alignment with guideNamespaceKey()
  describe("GUIDES_INDEX section alignment (guide-system-unification TASK-02)", () => {
    it("how-to-get-here route guide has section 'howToGetHere'", () => {
      // Representative how-to-get-here route key
      const entry = GUIDES_INDEX.find((g) => g.key === "amalfiPositanoBus");
      expect(entry?.section).toBe("howToGetHere");
    });

    it("experiences guide has section 'experiences'", () => {
      // Representative experiences key (default namespace)
      const entry = GUIDES_INDEX.find((g) => g.key === "pathOfTheGods");
      expect(entry?.section).toBe("experiences");
    });

    it("section matches guideNamespace baseKey for how-to-get-here routes", () => {
      for (const key of HOW_TO_GET_HERE_ROUTE_GUIDE_KEYS) {
        const entry = GUIDES_INDEX.find((g) => g.key === key);
        const namespace = guideNamespace("en", key as never);
        expect(entry?.section).toBe(namespace.baseKey);
      }
    });

    it("GUIDES_INDEX.section equals guideNamespaceKey() for all entries", () => {
      // Core invariant: section is derived from guideNamespaceKey
      for (const entry of GUIDES_INDEX) {
        const namespace = guideNamespace("en", entry.key as never);
        expect(entry.section).toBe(namespace.baseKey);
      }
    });
  });
});

/**
 * Snapshot test for guide namespace migration.
 *
 * This test captures the current namespace behavior for all guides,
 * ensuring that the migration from GUIDE_BASE_KEY_OVERRIDES to JSON
 * manifest overrides preserves identical behavior.
 */
import { GUIDE_KEYS } from "@/guides/slugs/keys";
import { guideNamespaceKey } from "@/guides/slugs/namespaces";
import { getGuideManifestEntryWithOverrides } from "@/routes/guides/guide-manifest";
import { loadGuideManifestOverridesFromFs } from "@/routes/guides/guide-manifest-overrides.node";

describe("guide namespace migration", () => {
  // Load overrides once for all tests
  const overrides = loadGuideManifestOverridesFromFs();

  it("preserves namespace assignment for all guides", () => {
    const namespaceMap: Record<string, string> = {};

    for (const key of GUIDE_KEYS) {
      // Get merged manifest entry with JSON overrides applied
      const mergedEntry = getGuideManifestEntryWithOverrides(key, overrides);
      namespaceMap[key] = guideNamespaceKey(key, mergedEntry);
    }

    // Snapshot the entire namespace assignment
    expect(namespaceMap).toMatchSnapshot();
  });

  it("assigns expected namespaces to howToGetHere guides", () => {
    const howToGetHereGuides = [
      "chiesaNuovaArrivals",
      "chiesaNuovaDepartures",
      "ferryDockToBrikette",
      "briketteToFerryDock",
      "fornilloBeachToBrikette",
      "naplesPositano",
      "salernoPositano",
    ];

    for (const key of howToGetHereGuides) {
      const mergedEntry = getGuideManifestEntryWithOverrides(key as never, overrides);
      expect(guideNamespaceKey(key as never, mergedEntry)).toBe("howToGetHere");
    }
  });

  it("assigns expected namespaces to assistance guides", () => {
    const assistanceGuides = [
      "onlyHostel",
      "porterServices",
      "luggageStorage",
      "parking",
      "whatToPack",
      "simsAtms",
      "workCafes",
      "ferrySchedules",
      "transportBudget",
      "bestTimeToVisit",
      "howToGetToPositano",
      "safetyAmalfi",
      "publicTransportAmalfi",
      "sitaTickets",
      "reachBudget",
    ];

    for (const key of assistanceGuides) {
      const mergedEntry = getGuideManifestEntryWithOverrides(key as never, overrides);
      expect(guideNamespaceKey(key as never, mergedEntry)).toBe("assistance");
    }
  });

  it("assigns experiences as default namespace for guides without overrides", () => {
    // These guides should default to experiences (no override in GUIDE_BASE_KEY_OVERRIDES)
    // Pick a few known experience guides to verify
    const sampleExperienceGuides = [
      "positanoBeaches",
      "pathOfTheGods",
      "amalfiCoastDayTrips",
    ];

    for (const key of sampleExperienceGuides) {
      // Only test if the key exists in GUIDE_KEYS
      if (GUIDE_KEYS.includes(key as never)) {
        const mergedEntry = getGuideManifestEntryWithOverrides(key as never, overrides);
        expect(guideNamespaceKey(key as never, mergedEntry)).toBe("experiences");
      }
    }
  });
});

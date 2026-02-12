/**
 * Snapshot test for guide namespace migration.
 *
 * This test captures the current namespace behavior for all guides,
 * ensuring that the migration from GUIDE_BASE_KEY_OVERRIDES to JSON
 * manifest overrides preserves identical behavior.
 */
import { GUIDE_KEYS } from "@/guides/slugs/keys";
import { guideNamespaceKey } from "@/guides/slugs/namespaces";
import { getGuideManifestEntry } from "@/routes/guides/guide-manifest";

describe("guide namespace migration", () => {
  it("preserves namespace assignment for all guides", () => {
    const namespaceMap: Record<string, string> = {};

    for (const key of GUIDE_KEYS) {
      const entry = getGuideManifestEntry(key);
      namespaceMap[key] = guideNamespaceKey(key, entry);
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
      const entry = getGuideManifestEntry(key as never);
      expect(guideNamespaceKey(key as never, entry)).toBe("howToGetHere");
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
      const entry = getGuideManifestEntry(key as never);
      expect(guideNamespaceKey(key as never, entry)).toBe("assistance");
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
        const entry = getGuideManifestEntry(key as never);
        expect(guideNamespaceKey(key as never, entry)).toBe("experiences");
      }
    }
  });
});

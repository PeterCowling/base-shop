/**
 * Regression baseline for guide status filtering.
 * Created as part of guide-publication-decoupling TASK-01.
 * Updated in TASK-05 to use canonical "live" status from manifest.
 * Updated in guide-status-single-source to add cross-validation tests.
 */

import { getGuideManifestEntry, listGuideManifestEntries } from "@acme/guide-system";

import {
  getGuideStatus,
  GUIDE_STATUS_BY_KEY,
  GUIDES_INDEX,
  isGuideLive,
} from "@/data/guides.index";

describe("guide status filtering", () => {
  // --- TC-21: Known live guide returns true ---
  it("isGuideLive returns true for a known live guide (TC-21)", () => {
    expect(isGuideLive("santaMariaDelCastelloHike")).toBe(true);
  });

  // --- TC-22: Known draft guide returns false ---
  it("isGuideLive returns false for a known draft guide (TC-22)", () => {
    expect(isGuideLive("ageAccessibility")).toBe(false);
  });

  // --- TC-23: Unknown key defaults to "draft" (not live) ---
  it("getGuideStatus defaults to 'draft' for unknown keys (TC-23)", () => {
    expect(getGuideStatus("nonexistentGuideKey_xyz")).toBe("draft");
  });

  // --- TC-24: Live guide count is identical to previous published count ---
  it("GUIDES_INDEX contains the expected count of live guides (TC-24)", () => {
    const liveCount = GUIDES_INDEX.filter(
      (g) => g.status === "live",
    ).length;

    // Same count as before (119) — terminology changed, set unchanged.
    expect(liveCount).toBe(119);
  });

  // --- TC-05 (preserved): Non-live guide key set snapshot ---
  it("draft/review guide keys match known set (TC-05)", () => {
    const nonLive = Object.entries(GUIDE_STATUS_BY_KEY)
      .filter(([, status]) => status !== "live")
      .map(([key]) => key)
      .sort();

    expect(nonLive).toEqual([
      "ageAccessibility",
      "arrivingByFerry",
      "bookingBasics",
      "changingCancelling",
      "checkinCheckout",
      "defectsDamages",
      "depositsPayments",
      "legal",
      "naplesAirportBus",
      "rules",
      "security",
      "travelHelp",
    ]);
  });
});

describe("single source of truth invariants", () => {
  // TC-42: Every GUIDES_INDEX key has a manifest entry
  it("every GUIDES_INDEX key has a corresponding manifest entry (TC-42)", () => {
    for (const guide of GUIDES_INDEX) {
      const entry = getGuideManifestEntry(guide.key);
      expect(entry).toBeDefined();
    }
  });

  // TC-43: No status divergence between index and manifest
  it("GUIDES_INDEX status matches manifest status for every guide (TC-43)", () => {
    for (const guide of GUIDES_INDEX) {
      const entry = getGuideManifestEntry(guide.key);
      if (entry) {
        expect(guide.status).toBe(entry.status);
      }
    }
  });

  // TC-44: Manifest has at least as many entries as GUIDES_INDEX
  it("manifest entry count >= GUIDES_INDEX entry count (TC-44)", () => {
    const manifestCount = listGuideManifestEntries().length;
    const indexCount = GUIDES_INDEX.length;
    expect(manifestCount).toBeGreaterThanOrEqual(indexCount);
  });
});

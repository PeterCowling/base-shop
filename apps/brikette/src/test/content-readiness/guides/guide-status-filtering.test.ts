/**
 * Regression baseline for guide status filtering.
 * Created as part of guide-publication-decoupling TASK-01.
 *
 * These tests snapshot the current publication status system so that
 * Phase 2 status changes (TASK-05) can be validated against a known baseline.
 */

import {
  getGuideStatus,
  GUIDE_STATUS_BY_KEY,
  GUIDES_INDEX,
  isGuidePublished,
} from "@/data/guides.index";

// --- TC-01: Known published guide returns true ---
describe("guide status filtering", () => {
  it("isGuidePublished returns true for a known published guide (TC-01)", () => {
    // santaMaria has no explicit status → defaults to "published"
    expect(isGuidePublished("santaMariaDelCastelloHike")).toBe(true);
  });

  // --- TC-02: Known draft guide returns false ---
  it("isGuidePublished returns false for a known draft guide (TC-02)", () => {
    expect(isGuidePublished("ageAccessibility")).toBe(false);
  });

  // --- TC-03: Unknown key defaults to "published" ---
  it("getGuideStatus defaults to 'published' for unknown keys (TC-03)", () => {
    expect(getGuideStatus("nonexistentGuideKey_xyz")).toBe("published");
  });

  // --- TC-04: Published guide count snapshot ---
  it("GUIDES_INDEX contains the expected count of published guides (TC-04)", () => {
    const publishedCount = GUIDES_INDEX.filter(
      (g) => g.status === "published",
    ).length;

    // Baseline count — any change should be intentional.
    // Update this number when guides are intentionally published or unpublished.
    expect(publishedCount).toBe(119);
  });

  // --- TC-05: Draft guide key set snapshot ---
  it("draft/review guide keys match known set (TC-05)", () => {
    const nonPublished = Object.entries(GUIDE_STATUS_BY_KEY)
      .filter(([, status]) => status !== "published")
      .map(([key]) => key)
      .sort();

    // Snapshot the exact set of non-published guides
    expect(nonPublished).toEqual([
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

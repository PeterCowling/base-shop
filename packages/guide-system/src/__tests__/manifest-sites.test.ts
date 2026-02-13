/**
 * Tests for the per-site publication status field on GuideManifestEntry.
 * Created as part of guide-publication-decoupling TASK-07.
 */

import {
  createManifestEntrySchema,
  type GuideManifestEntry,
  resolveGuideStatusForSite,
} from "../manifest-types";

const TEST_KEYS = ["testGuide", "anotherGuide"] as const;
const { schema } = createManifestEntrySchema(TEST_KEYS);

/** Minimal valid manifest input for schema parsing */
function minimalInput(overrides: Record<string, unknown> = {}) {
  return {
    key: "testGuide",
    slug: "test-guide",
    contentKey: "testGuide",
    status: "live",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: [],
    blocks: [],
    ...overrides,
  };
}

describe("manifest sites field (TASK-07)", () => {
  // TC-34: backwards compatibility — no sites field
  it("TC-34: entry with no sites field parses successfully", () => {
    const result = schema.safeParse(minimalInput());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sites).toBeUndefined();
    }
  });

  // TC-35: sites with brikette status resolves correctly
  it("TC-35: entry with sites.brikette.status=live parses and resolves to live", () => {
    const input = minimalInput({
      sites: { brikette: { status: "live" } },
    });
    const result = schema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sites).toEqual({ brikette: { status: "live" } });
      expect(resolveGuideStatusForSite(result.data, "brikette")).toBe("live");
    }
  });

  // TC-36: per-site status overrides global status
  it("TC-36: per-site draft overrides global live status", () => {
    const input = minimalInput({
      status: "live",
      sites: { brikette: { status: "draft" } },
    });
    const result = schema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(resolveGuideStatusForSite(result.data, "brikette")).toBe("draft");
      // Global status should still be live
      expect(result.data.status).toBe("live");
    }
  });

  // TC-37: no brikette-specific override → uses global status
  it("TC-37: no brikette override falls back to global status", () => {
    const input = minimalInput({
      status: "live",
      sites: { otherSite: { status: "draft" } },
    });
    const result = schema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(resolveGuideStatusForSite(result.data, "brikette")).toBe("live");
      expect(resolveGuideStatusForSite(result.data, "otherSite")).toBe("draft");
    }
  });

  // TC-38: schema rejects invalid sites values
  it("TC-38: schema rejects invalid status in sites field", () => {
    const input = minimalInput({
      sites: { brikette: { status: "invalid" } },
    });
    const result = schema.safeParse(input);
    expect(result.success).toBe(false);
  });

  // Additional: resolveGuideStatusForSite with no sites field
  it("resolveGuideStatusForSite returns global status when no sites field", () => {
    const entry: GuideManifestEntry = {
      key: "testGuide",
      slug: "test-guide",
      contentKey: "testGuide",
      status: "review",
      areas: ["experience"],
      primaryArea: "experience",
      structuredData: ["Article"],
      relatedGuides: [],
      blocks: [],
    };
    expect(resolveGuideStatusForSite(entry, "brikette")).toBe("review");
  });
});

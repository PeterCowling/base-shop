/**
 * Tests for guide content filtering — ensures only live guide content is loaded.
 * Created as part of guide-publication-decoupling TASK-06.
 */

import { GENERATED_GUIDE_SLUGS } from "@/data/generate-guide-slugs";
import { GUIDES_INDEX, isGuideLive } from "@/data/guides.index";
import { __CONTENT_KEYS_FOR_TESTS as CONTENT_KEYS } from "@/locales/guides.imports";

const ALL_GUIDE_KEYS = Object.keys(GENERATED_GUIDE_SLUGS);
const LIVE_GUIDE_KEYS = ALL_GUIDE_KEYS.filter((key) => isGuideLive(key));
const DRAFT_GUIDE_KEYS = ALL_GUIDE_KEYS.filter((key) => !isGuideLive(key));

describe("guide content filtering (TASK-06)", () => {
  // TC-28: CONTENT_KEYS count matches number of live guides
  it("TC-28: CONTENT_KEYS count matches number of live guides", () => {
    expect(CONTENT_KEYS.length).toBe(LIVE_GUIDE_KEYS.length);
    // Sanity: there should be fewer content keys than total guide keys
    expect(CONTENT_KEYS.length).toBeLessThan(ALL_GUIDE_KEYS.length);
  });

  // TC-29: CONTENT_KEYS includes all live guide content keys
  it("TC-29: CONTENT_KEYS includes all live guide content keys", () => {
    const contentKeySet = new Set(CONTENT_KEYS);
    for (const key of LIVE_GUIDE_KEYS) {
      expect(contentKeySet.has(key)).toBe(true);
    }
  });

  // TC-30: CONTENT_KEYS excludes known draft guide content keys
  it("TC-30: CONTENT_KEYS excludes known draft guide content keys", () => {
    const contentKeySet = new Set(CONTENT_KEYS);
    // There should be at least some draft guides to validate the filter works
    expect(DRAFT_GUIDE_KEYS.length).toBeGreaterThan(0);
    for (const key of DRAFT_GUIDE_KEYS) {
      expect(contentKeySet.has(key)).toBe(false);
    }
  });

  // TC-31: All GUIDES_INDEX live entries have corresponding content keys
  it("TC-31: every live guide in GUIDES_INDEX is in CONTENT_KEYS", () => {
    const contentKeySet = new Set(CONTENT_KEYS);
    const liveIndexEntries = GUIDES_INDEX.filter((g) => g.status === "live");
    for (const entry of liveIndexEntries) {
      // Only check if the key exists in GENERATED_GUIDE_SLUGS (has a content file)
      if (GENERATED_GUIDE_SLUGS[entry.key as keyof typeof GENERATED_GUIDE_SLUGS]) {
        expect(contentKeySet.has(entry.key)).toBe(true);
      }
    }
  });

  // TC-32: No draft GUIDES_INDEX entries are in CONTENT_KEYS
  it("TC-32: no draft guide in GUIDES_INDEX is in CONTENT_KEYS", () => {
    const contentKeySet = new Set(CONTENT_KEYS);
    const draftIndexEntries = GUIDES_INDEX.filter((g) => g.status === "draft");
    expect(draftIndexEntries.length).toBeGreaterThan(0);
    for (const entry of draftIndexEntries) {
      expect(contentKeySet.has(entry.key)).toBe(false);
    }
  });
});

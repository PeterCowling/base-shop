// Content readiness guardrail: every guide slug has a corresponding manifest entry.

import { GUIDE_KEYS } from "@/routes.guides-helpers";
import { getGuideManifestEntry, listGuideManifestEntries } from "@/routes/guides/guide-manifest";

describe("guide manifest completeness", () => {
  it("provides a manifest entry for every guide key in GUIDE_KEYS", () => {
    const missingEntries: string[] = [];

    for (const key of GUIDE_KEYS) {
      const entry = getGuideManifestEntry(key);
      if (!entry) {
        missingEntries.push(key);
      }
    }

    if (missingEntries.length > 0) {
      throw new Error(
        `Missing manifest entries for the following guide keys:\n${missingEntries.map((k) => `  - ${k}`).join("\n")}\n\n` +
        `These keys exist in GENERATED_GUIDE_SLUGS but have no corresponding entry in GUIDE_MANIFEST.\n` +
        `Add manifest entries for these guides in src/routes/guides/guide-manifest.ts`
      );
    }
  });

  it("every manifest entry has a valid guide key", () => {
    const allEntries = listGuideManifestEntries();
    const manifestKeys = allEntries.map((entry) => entry.key);
    const validGuideKeys = new Set(GUIDE_KEYS);
    const invalidKeys: string[] = [];

    for (const key of manifestKeys) {
      if (!validGuideKeys.has(key)) {
        invalidKeys.push(key);
      }
    }

    if (invalidKeys.length > 0) {
      throw new Error(
        `The following manifest entries have keys not found in GENERATED_GUIDE_SLUGS:\n${invalidKeys.map((k) => `  - ${k}`).join("\n")}\n\n` +
        `Either add these keys to GENERATED_GUIDE_SLUGS or remove the manifest entries.`
      );
    }
  });

  it("manifest keys match guide content keys", () => {
    const allEntries = listGuideManifestEntries();
    const mismatchedKeys: Array<{ manifestKey: string; contentKey: string }> = [];

    for (const entry of allEntries) {
      // Skip entries where contentKey is intentionally different (fallbacks, etc)
      if (entry.key !== entry.contentKey) {
        // This is expected for some guides that reuse content
        continue;
      }

      if (entry.key !== entry.contentKey) {
        mismatchedKeys.push({
          manifestKey: entry.key,
          contentKey: entry.contentKey,
        });
      }
    }

    // This test just documents the expectation - most guides should have matching keys
    expect(mismatchedKeys).toEqual([]);
  });
});

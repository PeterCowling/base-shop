import { GUIDE_KEYS } from "@/routes.guides-helpers";
import { getGuideManifestEntry, GUIDE_STATUS_VALUES } from "@/routes/guides/guide-manifest";

describe("guide manifest status", () => {
  it("provides a manifest entry with a valid status for every guide", () => {
    const validStatuses = new Set(GUIDE_STATUS_VALUES);
    for (const key of GUIDE_KEYS) {
      const entry = getGuideManifestEntry(key);
      expect(entry).toBeDefined();
      expect(validStatuses.has(entry?.status ?? "")).toBe(true);
    }
  });
});

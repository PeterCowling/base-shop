import { GUIDE_KEYS } from "@/routes.guides-helpers";
import { getGuideManifestEntry } from "@/routes/guides/guide-manifest";

describe("guide manifest draft status", () => {
  it("provides a draft manifest entry for every guide", () => {
    for (const key of GUIDE_KEYS) {
      const entry = getGuideManifestEntry(key);
      expect(entry).toBeDefined();
      expect(entry?.status).toBe("draft");
    }
  });
});

import { describe, expect, it } from "vitest";

import { publishedGuideKeysByBase } from "@/guides/slugs";
import { buildGuideStatusMap, listGuideManifestEntries } from "@/routes/guides/guide-manifest";

describe("guide alias keys", () => {
  it("includes positanoBeaches in the experiences group", () => {
    const manifestEntries = listGuideManifestEntries();
    const statusMap = buildGuideStatusMap(manifestEntries);
    const groups = publishedGuideKeysByBase(false, statusMap, manifestEntries);
    expect(groups.experiences).toContain("positanoBeaches");
  });
});
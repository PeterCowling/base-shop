import { describe, expect, it } from "vitest";

import type { GuideKey } from "@/routes.guides-helpers";

import {
  buildGuideContentSeed,
  buildGuideRouteSource,
  buildGuideTestSource,
} from "../../../../scripts/scaffold/templates/guide";

describe("guide templates", () => {
  it("builds content seeds with optional galleries and service schema fields", () => {
    const seed = buildGuideContentSeed("naplesToPositano", ["gallery", "serviceSchema"]);
    expect(seed.gallery).toEqual({
      primaryCaption: "TODO-TRANSLATE gallery caption",
      primaryAlt: "TODO-TRANSLATE gallery alt",
    });
    expect(seed.serviceType).toBe("TODO-TRANSLATE service type");
    expect(seed.areaServed).toBe("TODO-TRANSLATE area served");
  });

  it("outputs a route wrapper wired to defineGuideRoute and manifest helpers", () => {
    const key = "naplesToPositano" as GuideKey;
    const routeSource = buildGuideRouteSource(key, "naples-to-positano");
    expect(routeSource).toContain('export const GUIDE_KEY = "naplesToPositano"');
    expect(routeSource).toContain('const manifestEntry = getGuideManifestEntry(GUIDE_KEY);');
    expect(routeSource).toContain('const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry);');
  });

  it("stubs a route test harness for the generated slug", () => {
    const testSource = buildGuideTestSource("naples-to-positano", "naplesToPositano" as GuideKey);
    expect(testSource).toContain('describe("naples-to-positano route"');
    expect(testSource).toContain('expect(screen.getAllByRole("article").length).toBeGreaterThan(0);');
  });
});
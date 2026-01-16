import { describe, expect, it } from "vitest";

import type { GuideArea, GuideStatus } from "@/routes/guides/guide-manifest";
import type { GuideKey } from "@/routes.guides-helpers";

import {
  buildGuideMigrationManifestEntry,
  buildGuideMigrationRouteSource,
  normalizeGuideMigrationPattern,
} from "../../../../scripts/scaffold/templates/guide-migration";

const key = "porterServicePositano" as GuideKey;
const slug = "porter-service-positano";
const area: GuideArea = "experience";
const status: GuideStatus = "draft";

describe("guide migration templates", () => {
  it("normalizes migration pattern inputs", () => {
    expect(normalizeGuideMigrationPattern("MANUAL")).toBe("manual");
    expect(normalizeGuideMigrationPattern("redirect")).toBe("redirect");
    expect(normalizeGuideMigrationPattern("unknown")).toBe("generic");
    expect(normalizeGuideMigrationPattern()).toBe("generic");
  });

  it("renders manual and redirect route templates with the right hooks", () => {
    const manual = buildGuideMigrationRouteSource({ pattern: "manual", key, slug });
    expect(manual).toContain("articleLead");
    expect(manual).toContain("preferManualWhenUnlocalized");

    const redirect = buildGuideMigrationRouteSource({ pattern: "redirect", key, slug });
    expect(redirect).toContain("throw redirect(resolveTarget(lang));");
    expect(redirect).toContain('guides.meta.porterServicePositano.title');
  });

  it("builds manifest entries tailored to each pattern", () => {
    const genericEntry = buildGuideMigrationManifestEntry({
      key,
      slug,
      area,
      status,
      pattern: "generic",
      related: ["naplesToPositano" as GuideKey],
    });
    expect(genericEntry.blocks).toHaveLength(2);
    expect(genericEntry.options).toMatchObject({ showPlanChoice: true, showTagChips: true });

    const manualEntry = buildGuideMigrationManifestEntry({
      key,
      slug,
      area,
      status,
      pattern: "manual",
      related: [],
    });
    expect(manualEntry.blocks).toHaveLength(0);
    expect(manualEntry.options).toMatchObject({
      suppressTocTitle: true,
      suppressUnlocalizedFallback: true,
      preferManualWhenUnlocalized: true,
    });

    const redirectEntry = buildGuideMigrationManifestEntry({
      key,
      slug,
      area,
      status,
      pattern: "redirect",
      related: [],
    });
    expect(redirectEntry.blocks).toHaveLength(0);
    expect(redirectEntry.structuredData).toEqual([]);
  });
});
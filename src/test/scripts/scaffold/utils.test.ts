import { describe, expect, it } from "vitest";

import {
  kebab,
  toPascalCase,
  normalizeGuideArea,
  toManifestStatus,
  toIndexStatus,
} from "../../../../scripts/scaffold/lib/utils";

describe("scaffold utils", () => {
  it("normalizes text to kebab-case slugs", () => {
    expect(kebab("  Salerno To Positano  ")).toBe("salerno-to-positano");
    expect(kebab("Already-Slugged_value")).toBe("already-slugged-value");
  });

  it("converts dashed names to PascalCase", () => {
    expect(toPascalCase("amalfi-coast")).toBe("AmalfiCoast");
    expect(toPascalCase("porter_service")).toBe("PorterService");
  });

  it("falls back to experience area when unset", () => {
    expect(normalizeGuideArea("help")).toBe("help");
    expect(normalizeGuideArea()).toBe("experience");
  });

  it("maps workflow status to manifest/index states", () => {
    expect(toManifestStatus("published")).toBe("live");
    expect(toManifestStatus("review")).toBe("review");
    expect(toManifestStatus()).toBe("draft");

    expect(toIndexStatus("published")).toBe("published");
    expect(toIndexStatus("review")).toBe("review");
    expect(toIndexStatus()).toBe("draft");
  });
});
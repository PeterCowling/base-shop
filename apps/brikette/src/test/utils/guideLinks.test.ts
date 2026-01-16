import { describe, expect, it, vi } from "vitest";

import { GUIDE_KEYS } from "@/routes.guides-helpers";
import { normaliseGuideLinks } from "@/utils/guideLinks";

describe("normaliseGuideLinks", () => {
  it("returns guide links for string and object inputs", () => {
    const [firstKey, secondKey] = GUIDE_KEYS;

    const result = normaliseGuideLinks([
      firstKey,
      { key: secondKey, label: "Custom label" },
    ]);

    expect(result).toEqual([
      { key: firstKey },
      { key: secondKey, label: "Custom label" },
    ]);
  });

  it("filters out invalid entries", () => {
    const [firstKey] = GUIDE_KEYS;

    const result = normaliseGuideLinks([
      "unknown",
      { key: "also-unknown" },
      { key: firstKey, label: "" },
      123 as never,
    ]);

    expect(result).toEqual([{ key: firstKey }]);
  });

  it("falls back to provided keys when value is empty", () => {
    const [firstKey, secondKey] = GUIDE_KEYS;

    const result = normaliseGuideLinks(null, [firstKey, "invalid" as never, secondKey]);

    expect(result).toEqual([{ key: firstKey }, { key: secondKey }]);
  });

  it("returns an empty array when nothing is usable", () => {
    expect(normaliseGuideLinks(undefined)).toEqual([]);
    expect(normaliseGuideLinks([], [])).toEqual([]);
  });

  it("validates fallback keys when the canonical list is empty", async () => {
    vi.resetModules();
    vi.doMock("@/routes.guides-helpers", () => ({
      __esModule: true,
      GUIDE_KEYS: [],
    }));

    const mod = await import("@/utils/guideLinks");
    const result = mod.normaliseGuideLinks([{ key: "portoMap" }], ["portoMap" as never]);

    expect(result).toEqual([{ key: "portoMap" }]);

    vi.doUnmock("@/routes.guides-helpers");
  });

  it("falls back to shape validation when no keys are provided", async () => {
    vi.resetModules();
    vi.doMock("@/routes.guides-helpers", () => ({
      __esModule: true,
      GUIDE_KEYS: [],
    }));

    const mod = await import("@/utils/guideLinks");
    const result = mod.normaliseGuideLinks("summerBoat", []);

    expect(result).toEqual([{ key: "summerBoat" }]);

    vi.doUnmock("@/routes.guides-helpers");
  });
});
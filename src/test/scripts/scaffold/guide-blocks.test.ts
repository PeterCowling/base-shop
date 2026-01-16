import { describe, expect, it, vi } from "vitest";

import {
  buildGuideBlock,
  parseGuideBlockType,
  printGuideBlockCatalog,
} from "../../../../scripts/scaffold/templates/guide-blocks";

describe("guide block templates", () => {
  it("parses known block types and rejects unknown entries", () => {
    expect(parseGuideBlockType("hero")).toBe("hero");
    expect(() => parseGuideBlockType("unknown-block")).toThrowError(/Unknown block type/);
  });

  it("builds block declarations with sensible defaults", () => {
    const hero = buildGuideBlock("hero", "salernoToPositano", "salerno-to-positano");
    expect(hero).toEqual({
      type: "hero",
      options: {
        image: "salerno-to-positano/hero.jpg",
        altKey: "content.salernoToPositano.heroAlt",
        introLimit: 1,
      },
    });

    const alsoHelpful = buildGuideBlock("alsoHelpful", "porterServicePositano", "porter-service-positano");
    expect(alsoHelpful.options).toEqual({ tags: ["positano"] });

    const tagged = buildGuideBlock(
      "alsoHelpful",
      "porterServicePositano",
      "porter-service-positano",
      ["transport", "porter"],
    );
    expect(tagged.options).toEqual({ tags: ["transport", "porter"] });
  });

  it("prints a human-readable block catalog", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      printGuideBlockCatalog();
      expect(logSpy).toHaveBeenCalledWith("Guide block library");
      expect(
        logSpy.mock.calls.some(([message]) => typeof message === "string" && message.includes("Add blocks via")),
      ).toBe(true);
    } finally {
      logSpy.mockRestore();
    }
  });
});
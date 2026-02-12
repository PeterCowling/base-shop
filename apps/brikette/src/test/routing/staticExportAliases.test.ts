import { describe, expect, it } from "@jest/globals";

import { buildLocalizedStaticAliasPairs } from "@/routing/staticExportAliases";

describe("buildLocalizedStaticAliasPairs", () => {
  it("includes localized section aliases for translated slugs", () => {
    const pairs = buildLocalizedStaticAliasPairs();

    expect(pairs).toEqual(
      expect.arrayContaining([
        { sourceBasePath: "/fr/chambres", targetBasePath: "/fr/rooms" },
        { sourceBasePath: "/fr/a-propos", targetBasePath: "/fr/about" },
        { sourceBasePath: "/fr/aide", targetBasePath: "/fr/assistance" },
        {
          sourceBasePath: "/es/experiencias",
          targetBasePath: "/es/experiences",
        },
        {
          sourceBasePath: "/fr/comment-venir",
          targetBasePath: "/fr/how-to-get-here",
        },
      ])
    );
  });

  it("includes localized guides tags aliases", () => {
    const pairs = buildLocalizedStaticAliasPairs();

    expect(pairs).toEqual(
      expect.arrayContaining([
        {
          sourceBasePath: "/fr/experiences/etiquettes",
          targetBasePath: "/fr/experiences/tags",
        },
      ])
    );
  });

  it("does not include duplicate alias pairs", () => {
    const pairs = buildLocalizedStaticAliasPairs();
    const uniqueKeys = new Set(
      pairs.map((pair) => `${pair.sourceBasePath}->${pair.targetBasePath}`)
    );
    expect(uniqueKeys.size).toBe(pairs.length);
  });
});

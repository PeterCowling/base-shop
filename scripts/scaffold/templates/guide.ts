import type { GuideBlockType } from "../../../src/routes/guides/blocks/types";
import type { GuideKey } from "../../../src/routes.guides-helpers";

export function buildGuideContentSeed(key: string, blocks: GuideBlockType[]): Record<string, unknown> {
  const seed: Record<string, unknown> = {
    seo: { title: "TODO-TRANSLATE", description: "TODO-TRANSLATE" },
    linkLabel: "TODO-TRANSLATE",
    heroAlt: "TODO-TRANSLATE hero alt text",
    intro: ["TODO-TRANSLATE intro paragraph"],
    sections: [
      { id: "overview", title: "Overview", body: ["TODO-TRANSLATE body copy"] },
    ],
    faqs: [
      { q: "TODO-TRANSLATE FAQ question", a: ["TODO-TRANSLATE FAQ answer"] },
    ],
  };

  if (blocks.includes("gallery")) {
    seed.gallery = {
      primaryCaption: "TODO-TRANSLATE gallery caption",
      primaryAlt: "TODO-TRANSLATE gallery alt",
    };
  }

  if (blocks.includes("serviceSchema")) {
    seed.serviceType = "TODO-TRANSLATE service type";
    seed.areaServed = "TODO-TRANSLATE area served";
  }

  return seed;
}

export function buildGuideRouteSource(key: GuideKey, slug: string): string {
  return `// ${["src", "routes", "guides", `${slug}.tsx`].join("/")}
import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import type { GuideKey } from "@/routes.guides-helpers";

export const GUIDE_KEY = ${JSON.stringify(key)} as const satisfies GuideKey;
export const GUIDE_SLUG = ${JSON.stringify(slug)} as const;

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error(\`guide manifest entry missing for ${key}\`);
}
const { Component, clientLoader, meta, links } = defineGuideRoute(manifestEntry);

export default Component;
export { clientLoader, meta, links };
`;
}

export function buildGuideTestSource(slug: string, key: GuideKey): string {
  return `// ${["src", "routes", "guides", "__tests__", `${slug}.route.test.tsx`].join("/")}
import { describe, it, expect } from "vitest";
import { withGuideMocks } from "./guideTestHarness";
import type { GuideKey } from "@/routes.guides-helpers";

const GUIDE_KEY = ${JSON.stringify(key)} as const satisfies GuideKey;

describe("${slug} route", () => {
  it("renders with manifest-driven blocks", async () => {
    await withGuideMocks(GUIDE_KEY, async ({ renderRoute, screen }) => {
      await renderRoute();
      expect(screen.getAllByRole("article").length).toBeGreaterThan(0);
    });
  });
});
`;
}
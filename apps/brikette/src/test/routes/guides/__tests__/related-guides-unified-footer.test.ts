import type { GuideManifestEntry } from "@/routes/guides/guide-manifest";
import { composeBlocks } from "@/routes/guides/blocks/composeBlocks";

jest.mock("@/utils/related", () => {
  const actual = jest.requireActual<typeof import("@/utils/related")>("@/utils/related");
  return {
    __esModule: true,
    ...actual,
    relatedGuidesByTags: jest.fn(actual.relatedGuidesByTags),
  };
});

import { relatedGuidesByTags } from "@/utils/related";

const unique = <T,>(values: readonly T[]): T[] => Array.from(new Set(values));

describe("composeBlocks: unify non-inline guide links into RelatedGuides", () => {
  it("folds alsoHelpful tag suggestions into relatedGuides and strips alsoHelpful output", async () => {
    const entry = {
      key: "naplesPositano",
      slug: "naples-to-positano",
      contentKey: "naplesPositano",
      status: "draft",
      areas: ["experience"],
      primaryArea: "experience",
      structuredData: [],
      relatedGuides: ["ferrySchedules", "luggageStorage"],
      blocks: [
        {
          type: "alsoHelpful",
          options: {
            tags: ["transport", "ferry", "positano"],
          },
        },
      ],
    } as unknown as GuideManifestEntry;

    const { template } = composeBlocks(entry);

    expect(template.alsoHelpful).toBeUndefined();

    const related = template.relatedGuides?.items ?? [];
    const keys = related.map((item) => item.key);

    expect(keys.slice(0, 2)).toEqual(["ferrySchedules", "luggageStorage"]);
    expect(keys).toEqual(unique(keys));
    expect(keys).not.toContain(entry.key);

    expect(relatedGuidesByTags).toHaveBeenCalled();
  });

  it("preserves explicit relatedGuides order and appends tag suggestions after", () => {
    const entry = {
      key: "capriDayTrip",
      slug: "day-trip-capri-from-positano",
      contentKey: "capriDayTrip",
      status: "draft",
      areas: ["experience"],
      primaryArea: "experience",
      structuredData: [],
      relatedGuides: ["ferrySchedules", "boatTours", "whatToPack"],
      blocks: [
        {
          type: "relatedGuides",
          options: { guides: ["boatTours"] },
        },
        {
          type: "alsoHelpful",
          options: { tags: ["day-trip", "capri", "ferry", "positano"] },
        },
      ],
    } as unknown as GuideManifestEntry;

    const { template } = composeBlocks(entry);
    const keys = (template.relatedGuides?.items ?? []).map((item) => item.key);

    expect(keys[0]).toBe("boatTours");
    expect(keys).toEqual(unique(keys));
  });
});

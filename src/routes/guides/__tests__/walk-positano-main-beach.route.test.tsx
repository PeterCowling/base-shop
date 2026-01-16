import { beforeEach, describe, expect, it } from "vitest";

import { renderGuideRoute } from "@tests/guides/harness";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";

const BACK_MODULE = "@/routes/guides/walk-back-to-hostel-brikette-from-positano-main-beach";
const BACK_ROUTE = "/en/guides/walk-back-to-hostel-brikette-from-positano-main-beach";

const DOWN_MODULE = "@/routes/guides/walk-down-to-positano-main-beach";
const DOWN_ROUTE = "/en/guides/walk-down-to-positano-main-beach";

describe("positano main beach walking guides", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("exposes related guides and helpers for the walk-back variant", async () => {
    await renderGuideRoute(BACK_MODULE, BACK_ROUTE);

    const props = getGuideTemplateProps<{
      guideKey: string;
      metaKey: string;
      ogImage?: { path: string; width: number; height: number };
      relatedGuides?: { items: Array<{ key: string }> };
      alsoHelpful?: { tags: string[]; excludeGuide: string[]; includeRooms?: boolean };
    }>();

    expect(props?.guideKey).toBe("positanoMainBeachWalkBack");
    expect(props?.metaKey).toBe("positanoMainBeachWalkBack");
    expect(props?.ogImage).toMatchObject({ path: "/img/positano-panorama.avif", width: 1200, height: 630 });
    expect(props?.relatedGuides?.items).toEqual([
      { key: "positanoMainBeachWalkDown" },
      { key: "positanoMainBeachBusBack" },
      { key: "positanoBeaches" },
    ]);
    expect(props?.alsoHelpful).toEqual({
      tags: ["beaches", "positano", "stairs"],
      excludeGuide: [
        "positanoMainBeachWalkDown",
        "positanoMainBeachBusBack",
        "positanoBeaches",
      ],
      includeRooms: true,
    });
  });

  it("exposes related guides and helpers for the walk-down variant", async () => {
    resetGuideTemplateSpy();
    await renderGuideRoute(DOWN_MODULE, DOWN_ROUTE);

    const props = getGuideTemplateProps<{
      guideKey: string;
      metaKey: string;
      relatedGuides?: { items: Array<{ key: string }> };
      alsoHelpful?: { excludeGuide: string[]; includeRooms?: boolean };
    }>();

    expect(props?.guideKey).toBe("positanoMainBeachWalkDown");
    expect(props?.metaKey).toBe("positanoMainBeachWalkDown");
    expect(props?.relatedGuides?.items).toEqual([
      { key: "positanoMainBeachBusDown" },
      { key: "positanoMainBeachBusBack" },
      { key: "positanoBeaches" },
    ]);
    expect(props?.alsoHelpful?.excludeGuide).toEqual([
      "positanoMainBeachBusDown",
      "positanoMainBeachBusBack",
      "positanoBeaches",
    ]);
    expect(props?.alsoHelpful?.includeRooms).toBe(true);
  });
});

import "@testing-library/jest-dom";

import {
  howToGetHereRouteDefinitionsSchema,
  howToGetHereRoutesLocaleSchema,
  linkTargetSchema,
  routeContentSchema,
} from "@/lib/how-to-get-here/schema";

describe("how-to-get-here schemas", () => {
  it("accepts a minimal route definition", () => {
    const definition = {
      contentKey: "capriPositanoFerry",
      linkBindings: [
        {
          key: "tip.copy",
          linkObject: { type: "howToOverview" },
        },
      ],
      media: [
        {
          key: "sections.walk.image",
          src: "/img/example.png",
        },
      ],
    };

    expect(() => howToGetHereRouteDefinitionsSchema.parse({ routes: { slug: definition } })).not.toThrow();
  });

  it("rejects an unknown link target type", () => {
    const result = linkTargetSchema.safeParse({ type: "unknown" });
    expect(result.success).toBe(false);
  });

  it("requires meta title and description in route content", () => {
    const base = {
      header: { title: "Header" },
      sections: { intro: { body: "Copy" } },
    };

    const missingMeta = routeContentSchema.safeParse(base);
    expect(missingMeta.success).toBe(false);

    const emptyMeta = routeContentSchema.safeParse({
      ...base,
      meta: { title: "", description: "" },
    });
    expect(emptyMeta.success).toBe(false);
  });

  it("parses nested locale content", () => {
    const valid = {
      meta: {
        title: "Title",
        description: "Description",
      },
      header: {
        eyebrow: "Guide",
        title: "Header",
        description: "Detailed description",
      },
      sections: {
        overview: {
          title: "Overview",
          list: [
            "First",
            "Second",
            {
              title: "Nested",
              body: "Text",
            },
          ],
        },
      },
      aside: {
        body: {
          before: "See the",
          linkLabel: "main guide",
          after: "for more",
        },
      },
    };

    const result = howToGetHereRoutesLocaleSchema.safeParse({ example: valid });
    expect(result.success).toBe(true);
  });
});
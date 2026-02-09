import { describe, expect,it } from "@jest/globals";

import {
  guideContentSchema,
  type GuidePublication,
  type GuidePublicationStatus,
} from "../Guide";

const validGuide: GuidePublication = {
  id: "01J4ZV7HKWJG9QFKCMY9AZWABP",
  shop: "brikette",
  status: "published",
  row_version: 1,
  created_at: "2026-02-09T00:00:00.000Z",
  updated_at: "2026-02-09T00:00:00.000Z",
  key: "exampleGuide",
  slug: "example-guide",
  contentKey: "exampleGuide",
  areas: ["transport"],
  primaryArea: "transport",
  blocks: [],
  relatedGuides: [],
  structuredData: [],
  riskTier: 0,
  schemaVersion: 1,
};

describe("Guide types", () => {
  it("accepts a valid GuidePublication shape", () => {
    expect(validGuide.status).toBe("published");
    expect(validGuide.riskTier).toBe(0);
  });

  it("guideContentSchema validates minimal valid content", () => {
    const parsed = guideContentSchema.safeParse({
      seo: { title: "Guide title", description: "Guide description" },
    });

    expect(parsed.success).toBe(true);
  });

  it("guideContentSchema rejects missing seo.title", () => {
    const parsed = guideContentSchema.safeParse({
      seo: { description: "Guide description" },
    });

    expect(parsed.success).toBe(false);
  });

  it("guideContentSchema preserves passthrough fields", () => {
    const parsed = guideContentSchema.parse({
      seo: { title: "Guide title", description: "Guide description" },
      customField: { nested: true },
    });

    expect(parsed.customField).toEqual({ nested: true });
  });

  it("GuidePublicationStatus excludes legacy values", () => {
    const status: GuidePublicationStatus = "draft";
    expect(status).toBe("draft");
  });
});

const assertGuidePublication = (_guide: GuidePublication) => undefined;

assertGuidePublication(validGuide);

// @ts-expect-error status is required
assertGuidePublication({
  ...validGuide,
  status: undefined,
});

// @ts-expect-error only draft/review/published are valid
const invalidStatus: GuidePublicationStatus = "live";
void invalidStatus;

// @ts-expect-error riskTier must be 0 | 1 | 2
const invalidRiskTier: GuidePublication = { ...validGuide, riskTier: 3 };
void invalidRiskTier;

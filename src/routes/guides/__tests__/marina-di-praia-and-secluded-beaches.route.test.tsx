import { beforeEach, describe, expect, it } from "vitest";
import { renderGuideRoute } from "@tests/guides/harness";
import { mockGuideTemplate, resetGuideTemplateSpy } from "@tests/guides/template-spy";

beforeAll(() => {
  vi.doMock("@/routes/guides/_GuideSeoTemplate", mockGuideTemplate);
});

describe("marina-di-praia-and-secluded-beaches route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("exposes the expected guide metadata", async () => {
    const { props, unmount } = await renderGuideRoute(
      "@/routes/guides/marina-di-praia-and-secluded-beaches",
      "/en/guides/marina-di-praia-and-secluded-beaches",
    );

    expect(props.guideKey).toBe("marinaDiPraiaBeaches");
    expect(props.metaKey).toBe("marinaDiPraiaBeaches");
    expect(props.relatedGuides?.items).toEqual([
      { key: "praianoGuide" },
      { key: "beachHoppingAmalfi" },
      { key: "positanoBeaches" },
    ]);

    unmount();
  });
});

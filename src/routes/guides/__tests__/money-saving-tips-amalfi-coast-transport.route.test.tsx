import { beforeEach, describe, expect, it } from "vitest";
import { renderGuideRoute } from "@tests/guides/harness";
import { mockGuideTemplate, resetGuideTemplateSpy } from "@tests/guides/template-spy";

beforeAll(() => {
  vi.doMock("@/routes/guides/_GuideSeoTemplate", mockGuideTemplate);
});

describe("money-saving-tips-amalfi-coast-transport route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
  });

  it("enables transport widgets and related guides", async () => {
    const { props, unmount } = await renderGuideRoute(
      "@/routes/guides/money-saving-tips-amalfi-coast-transport",
      "/en/guides/money-saving-tips-amalfi-coast-transport",
    );

    expect(props.guideKey).toBe("transportMoneySaving");
    expect(props.metaKey).toBe("transportMoneySaving");
    expect(props.showPlanChoice).toBe(true);
    expect(props.showTransportNotice).toBe(true);
    expect(props.relatedGuides?.items).toEqual([
      { key: "transportBudget" },
      { key: "howToGetToPositano" },
      { key: "reachBudget" },
    ]);

    unmount();
  });
});

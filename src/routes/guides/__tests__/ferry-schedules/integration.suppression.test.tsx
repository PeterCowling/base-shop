import { describe, expect, it, vi } from "vitest";

import type { GuideExtras } from "@/routes/guides/ferry-schedules/types";

import { withGuideMocks } from "../guideTestHarness";

describe("ferry-schedules route – suppression", () => {
  it("omits optional sections when the extras builder returns empty data", async () => {
    const extras: GuideExtras = {
      hasStructured: false,
      intro: [],
      sections: [],
      tips: [],
      tipsTitle: "Tips",
      faqs: [],
      faqsTitle: "FAQs",
      tocTitle: "On this page",
      tocItems: [],
      galleryTitle: "Gallery",
      galleryItems: [],
    };

    await withGuideMocks("ferrySchedules", async ({ routeModule, renderRoute, screen }) => {
      const extrasSpy = vi
        .spyOn(
          routeModule as { buildFerrySchedulesGuideExtras: (...args: unknown[]) => GuideExtras },
          "buildFerrySchedulesGuideExtras",
        )
        .mockReturnValue(extras);

      try {
        await renderRoute({
          lang: "en",
          route: "/en/guides/ferry-schedules",
        });

        expect(screen.queryByTestId("toc")).toBeNull();
        expect(screen.queryByText("Tips")).toBeNull();
        expect(screen.queryByText("FAQs")).toBeNull();
        expect(screen.queryByTestId("image-gallery")).toBeNull();
      } finally {
        extrasSpy.mockRestore();
      }
    });
  });
});
import { describe, expect, it } from "vitest";

import { withGuideMocks } from "./guideTestHarness";
import { capturedFaqFallbacks } from "./guides.test-utils";

describe("Amalfi Coast public transport guide", () => {
  it("renders localized introductions via GenericContent when structured arrays exist", async () => {
    await withGuideMocks("publicTransportAmalfi", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "content.publicTransportAmalfi.seo.title": "Public transport Amalfi",
        "content.publicTransportAmalfi.seo.description": "How to get around",
        "content.publicTransportAmalfi.intro": ["Primary intro"],
        "content.publicTransportAmalfi.sections": [
          { id: "bus", title: "Bus basics", body: ["Buy tickets in advance"] },
        ],
      });

      await renderRoute({
        lang: "en",
        route: "/en/guides/amalfi-coast-public-transport-guide",
      });

      expect(screen.getByTestId("generic-publicTransportAmalfi")).toBeInTheDocument();
      expect(screen.queryByText("Alt intro")).toBeNull();
    });
  });

  it("falls back to alternate copy when primary guide content is empty", async () => {
    await withGuideMocks("publicTransportAmalfi", async ({ setTranslations, renderRoute, screen }) => {
      setTranslations("en", "guides", {
        "content.publicTransportAmalfi.seo.title": "Public transport Amalfi",
        "content.publicTransportAmalfi.seo.description": "How to get around",
        "content.publicTransportAmalfi.intro": [],
        "content.publicTransportAmalfi.sections": [],
        "content.amalfiCoastPublicTransportGuide.intro": ["Alt intro"],
        "content.amalfiCoastPublicTransportGuide.sections": [
          { id: "ferry", title: "Ferry tips", body: ["Check weather"] },
        ],
        "content.amalfiCoastPublicTransportGuide.faqs": [
          { q: "Do buses run late?", a: ["Only until 22:00"] },
        ],
      });

      await renderRoute({
        lang: "en",
        route: "/en/guides/amalfi-coast-public-transport-guide",
      });

      expect(screen.queryByTestId("generic-publicTransportAmalfi")).toBeNull();
      expect(screen.getByRole("heading", { level: 2, name: "Ferry tips" })).toBeInTheDocument();
      expect(screen.getByText("Only until 22:00")).toBeInTheDocument();
      expect(screen.getByText("Check weather")).toBeInTheDocument();
    });
  });
});
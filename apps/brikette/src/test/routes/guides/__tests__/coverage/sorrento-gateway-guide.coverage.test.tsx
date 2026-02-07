
import "@testing-library/jest-dom";

import { genericContentMock,resetCoverageState, withCoverageGuide } from "@/routes/guides/__tests__/coverage/shared";

describe("sorrento-gateway-guide", () => {
  beforeEach(() => {
    resetCoverageState();
  });

  it("combines gateway and fallback content when both are available", async () => {
    await withCoverageGuide("sorrentoGuide", async ({ renderRoute, screen, waitFor }) => {
      await renderRoute({ route: "/en/guides/sorrento-gateway-guide" });

      const articleNode = await screen.findByTestId("article-structured");
      expect(articleNode).toHaveAttribute("data-headline", "Plan your Sorrento day");
      expect(articleNode).toHaveAttribute("data-description", "Discover the gateway");

      await waitFor(() => {
        const payloads = genericContentMock.mock.calls.map(([props]) => props);
        expect(payloads).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ guideKey: "sorrentoGatewayGuide" }),
            expect.objectContaining({ guideKey: "sorrentoGuide", showToc: false }),
          ]),
        );
      });
    });
  });

  it("renders fallback content when gateway data is missing", async () => {
    await withCoverageGuide(
      "sorrentoGuide",
      async ({ renderRoute, waitFor, coverageTranslations, setCoverageTranslations }) => {
        const content = {
          ...((coverageTranslations.en?.guides?.content ?? {}) as Record<string, unknown>),
          sorrentoGatewayGuide: { intro: [], sections: [], faqs: [] },
        };
        setCoverageTranslations("en", "guides", { content });

        await renderRoute({ route: "/en/guides/sorrento-gateway-guide" });

        await waitFor(() => {
          const payloads = genericContentMock.mock.calls.map(([props]) => props);
          expect(payloads).toEqual(
            expect.arrayContaining([expect.objectContaining({ guideKey: "sorrentoGuide", showToc: true })]),
          );
          expect(
            payloads.every((props) => (props as { guideKey?: string } | undefined)?.guideKey !== "sorrentoGatewayGuide"),
          ).toBe(true);
        });
      },
    );
  });

  it("falls back to SEO metadata when explicit meta entries are blank", async () => {
    await withCoverageGuide(
      "sorrentoGuide",
      async ({ renderRoute, screen, waitFor, coverageTranslations, setCoverageTranslations }) => {
        const meta = {
          ...((coverageTranslations.en?.guides?.meta ?? {}) as Record<string, unknown>),
          sorrentoGuide: { title: "", description: "" },
        };
        setCoverageTranslations("en", "guides", { meta });

        await renderRoute({ route: "/en/guides/sorrento-gateway-guide" });

        const articleNode = await screen.findByTestId("article-structured");
        expect(articleNode).toHaveAttribute("data-headline", "Sorrento gateway essentials");
        expect(articleNode).toHaveAttribute("data-description", "Compare Sorrento with Positano");
        await waitFor(() =>
          expect(document.querySelector("title")?.textContent).toBe("Sorrento gateway essentials"),
        );
        await waitFor(() =>
          expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
            "Compare Sorrento with Positano",
          ),
        );
      },
    );
  });
});

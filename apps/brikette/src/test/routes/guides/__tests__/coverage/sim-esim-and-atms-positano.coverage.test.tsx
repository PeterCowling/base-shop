
import "@testing-library/jest-dom";

import {
  capturedFaqFallbacks,
  relatedGuidesMock,
  resetCoverageState,
  tagChipsMock,
  withCoverageGuide,
} from "@/routes/guides/__tests__/coverage/shared";

describe("sim-esim-and-atms-positano", () => {
  beforeEach(() => {
    resetCoverageState();
  });

  it("renders structured article content when bundles include rich copy", async () => {
    await withCoverageGuide("simsAtms", async ({ renderRoute, screen, waitFor }) => {
      await renderRoute({ route: "/en/guides/sim-esim-and-atms-positano" });

      expect(
        await screen.findByRole("heading", { name: "SIM/eSIM and ATMs in Positano" }),
      ).toBeInTheDocument();
      const articleNode = await screen.findByTestId("article-structured");
      expect(articleNode).toHaveAttribute("data-headline", "SIM/eSIM and ATMs in Positano");
      expect(articleNode).toHaveAttribute(
        "data-description",
        "Where to get a SIM/eSIM, coverage notes, and ATM availability and fees in Positano.",
      );

      await waitFor(() => expect(tagChipsMock).toHaveBeenCalled());

      const fallback = capturedFaqFallbacks.get("simsAtms");
      expect(typeof fallback).toBe("function");
      expect(fallback?.("en")).toEqual([
        {
          question: "Where can I top up credit?",
          answer: ["Most tabacchi offer ricarica services."],
        },
      ]);
    });
  }, 30000);

  it("falls back to the locale's guidesFallback bundle when primary content is empty", async () => {
    await withCoverageGuide(
      "simsAtms",
      async ({
        setCoverageTranslations,
        setCoverageLanguage,
        coverageTranslations,
        renderRoute,
        screen,
        waitFor,
      }) => {
        setCoverageLanguage("it");

        const enContent = {
          ...((coverageTranslations.en?.guides?.content ?? {}) as Record<string, unknown>),
          simsAtms: {
            seo: { title: "SIM, eSIM and ATMs in Positano", description: "Stay connected with local tips." },
            intro: [],
            sections: [],
            faqs: [],
          },
        };
        const itContent = {
          ...((coverageTranslations.it?.guides?.content ?? {}) as Record<string, unknown>),
          simsAtms: {
            seo: { title: "", description: "" },
            intro: [],
            sections: [],
            faqs: [],
          },
        };
        const itFallback = {
          ...((coverageTranslations.it?.guidesFallback ?? {}) as Record<string, unknown>),
          simsAtms: {
            intro: ["Acquista la SIM al tabaccaio vicino alla piazza."],
            faqs: [{ q: "Dove prelevare?", a: ["Vicino al porto."] }],
          },
        };

        setCoverageTranslations("en", "guides", { content: enContent });
        setCoverageTranslations("it", "guides", { content: itContent });
        setCoverageTranslations("it", "guidesFallback", itFallback);

        await renderRoute({ route: "/it/guides/sim-esim-and-atms-positano" });

        const fallback = capturedFaqFallbacks.get("simsAtms");
        expect(fallback?.("it")).toEqual([
          { question: "Dove prelevare?", answer: ["Vicino al porto."] },
        ]);

        await waitFor(() => {
          const call = relatedGuidesMock.mock.calls.at(-1);
          expect(call?.[0]).toEqual(expect.objectContaining({ lang: "it" }));
        });
      },
    );
  }, 30000);

  it("falls back to English defaults when locale fallback data is missing", async () => {
    await withCoverageGuide(
      "simsAtms",
      async ({
        setCoverageTranslations,
        setCoverageLanguage,
        coverageTranslations,
        renderRoute,
      }) => {
        setCoverageLanguage("it");

        const itContent = {
          ...((coverageTranslations.it?.guides?.content ?? {}) as Record<string, unknown>),
          simsAtms: {
            seo: { title: "", description: "" },
            intro: [],
            sections: [],
            faqs: [],
          },
        };
        const itFallback = {
          ...((coverageTranslations.it?.guidesFallback ?? {}) as Record<string, unknown>),
          simsAtms: { intro: [], faqs: [] },
        };

        setCoverageTranslations("it", "guides", { content: itContent });
        setCoverageTranslations("it", "guidesFallback", itFallback);

        await renderRoute({ route: "/it/guides/sim-esim-and-atms-positano" });

        const fallback = capturedFaqFallbacks.get("simsAtms");
        expect(fallback?.("it")).toEqual([
          { question: "Where can I top up credit?", answer: ["Most tabacchi offer ricarica services."] },
        ]);
      },
    );
  }, 30000);
});

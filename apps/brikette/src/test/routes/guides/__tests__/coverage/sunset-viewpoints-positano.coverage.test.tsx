import "@testing-library/jest-dom";

import { screen, waitFor } from "@testing-library/react";

import { resetCoverageState,withCoverageGuide } from "@/routes/guides/__tests__/coverage/shared";

import { createTranslator } from "../guides.test-utils";

type SunsetViewpointsContent = {
  intro?: unknown;
  gallery?: { items?: Array<{ alt?: string; caption?: string }> };
  faqs?: Array<{ q?: string; a?: string[] }>;
};

describe("sunset-viewpoints-positano", () => {
  beforeEach(() => {
    resetCoverageState();
  });

  it("derives fallback content and structured metadata", async () => {
    await withCoverageGuide(
      "sunsetViewpoints",
      async ({ setCoverageLanguage, renderRoute, coverageTranslations }) => {
        setCoverageLanguage("it");

        await renderRoute({ route: "/it/guides/sunset-viewpoints-positano" });

        await waitFor(() =>
          expect(document.querySelector("title")?.textContent).toBe("Sunset viewpoints"),
        );
        await waitFor(() =>
          expect(document.querySelector('meta[property="og:title"]')?.getAttribute("content")).toBe(
            "Sunset viewpoints",
          ),
        );

        const introMatches = await screen.findAllByText("English intro line.");
        expect(introMatches[0]?.textContent).toBe("English intro line.");

        const translatorIt = createTranslator("it", ["guides"], { allowEnglishFallback: false });
        expect(translatorIt("content.sunsetViewpoints.intro", { returnObjects: true })).toEqual([]);

        const englishNamespaces = coverageTranslations.en as
          | {
              guides?: { content?: { sunsetViewpoints?: SunsetViewpointsContent } };
              header?: { home?: string };
            }
          | undefined;
        const englishSunset = englishNamespaces?.guides?.content?.sunsetViewpoints;

        const englishIntro = (englishSunset?.intro as string[] | undefined) ?? [];
        const sanitisedIntro = englishIntro
          .map((line) => (typeof line === "string" ? line.trim() : ""))
          .filter((line) => line.length > 0);
        expect(sanitisedIntro).toEqual(["English intro line."]);

        const gallery = englishSunset?.gallery;
        expect(Array.isArray(gallery?.items)).toBe(true);
        expect(gallery?.items?.map((item) => item?.alt)).toEqual(["Chiesa Nuova sunset", "Nocelle sunset"]);

        const englishFaqs =
          (englishSunset?.faqs as Array<{ q?: string; a?: string[] }> | undefined) ??
          [];
        const sanitisedFaqs = englishFaqs
          .map((entry) => {
            const question = typeof entry.q === "string" ? entry.q.trim() : "";
            const answers = Array.isArray(entry.a) ? entry.a.map((answer) => (typeof answer === "string" ? answer.trim() : "")).filter(Boolean) : [];
            if (!question || answers.length === 0) return null;
            return { q: question, a: answers };
          })
          .filter((entry): entry is { q: string; a: string[] } => entry !== null);
        expect(sanitisedFaqs).toEqual([{ q: "Do I need tickets?", a: ["No tickets required."] }]);

        const headerHome = englishNamespaces?.header?.home;
        expect(headerHome).toBe("Home");

        const itemListJson =
          document.querySelector('script[type="application/ld+json"]')?.textContent ?? "";
        expect(itemListJson).toContain("ItemList");
      },
    );
  });
});

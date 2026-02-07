
import "@testing-library/jest-dom";

import {
  genericContentMock,
  resetCoverageState,
  tableOfContentsMock,
  withCoverageGuide,
} from "@/routes/guides/__tests__/coverage/shared";

describe("staying-safe-positano-amalfi-coast", () => {
  beforeEach(() => {
    resetCoverageState();
  });

  it("renders structured sections with table of contents when data exists", async () => {
    await withCoverageGuide("safetyAmalfi", async ({ renderRoute, screen, waitFor }) => {
      await renderRoute({ route: "/en/guides/staying-safe-positano-amalfi-coast" });
      await waitFor(() => expect(tableOfContentsMock).toHaveBeenCalled());
      expect(tableOfContentsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [
            { href: "#awareness", label: "Awareness" },
            { href: "#section-2", label: "Section 2" },
            { href: "#faqs", label: "Safety FAQs" },
          ],
          title: "Safety navigation",
        }),
      );

      await waitFor(() => {
        expect(screen.getByText("Stay aware of your surroundings.")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Awareness" })).toBeInTheDocument();
        expect(screen.getByText("Fallback body text.")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Safety FAQs" })).toBeInTheDocument();
        expect(screen.getByText("Is Positano safe at night?")).toBeInTheDocument();
      });

      expect(genericContentMock).not.toHaveBeenCalled();
    });
  });

  it("falls back to generic content when structured data is missing", async () => {
    await withCoverageGuide(
      "safetyAmalfi",
      async ({ renderRoute, waitFor, coverageTranslations, setCoverageTranslations }) => {
        const content = {
          ...((coverageTranslations.en?.guides?.content ?? {}) as Record<string, unknown>),
          safetyAmalfi: {
            seo: { title: "Stay safe in Positano", description: "Local safety advice." },
            intro: [],
            sections: [],
            faqs: [],
          },
        };
        setCoverageTranslations("en", "guides", { content });

        await renderRoute({ route: "/en/guides/staying-safe-positano-amalfi-coast" });

        await waitFor(() => expect(genericContentMock).toHaveBeenCalled());
        expect(genericContentMock).toHaveBeenCalledWith(
          expect.objectContaining({ guideKey: "safetyAmalfi" }),
        );
        expect(tableOfContentsMock).not.toHaveBeenCalled();
      },
    );
  });

  it("uses SEO defaults when meta translations are removed", async () => {
    await withCoverageGuide(
      "safetyAmalfi",
      async ({ renderRoute, waitFor, coverageTranslations, setCoverageTranslations }) => {
        const meta = {
          ...((coverageTranslations.en?.guides?.meta ?? {}) as Record<string, unknown>),
          safetyAmalfi: { title: "", description: "" },
        };
        setCoverageTranslations("en", "guides", { meta });

        await renderRoute({ route: "/en/guides/staying-safe-positano-amalfi-coast" });

        await waitFor(() => {
          expect(document.querySelector("title")?.textContent).toBe("Stay safe in Positano");
        });
        await waitFor(() => {
          expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
            "Local safety advice.",
          );
        });
      },
    );
  });
});

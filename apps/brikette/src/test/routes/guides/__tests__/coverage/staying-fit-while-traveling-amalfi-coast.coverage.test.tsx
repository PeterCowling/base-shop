
import "@testing-library/jest-dom";

import { resetCoverageState,withCoverageGuide } from "@/routes/guides/__tests__/coverage/shared";

describe("staying-fit-while-traveling-amalfi-coast", () => {
  beforeEach(() => {
    resetCoverageState();
  });

  it("renders fitness content with metadata", async () => {
    await withCoverageGuide("stayingFitAmalfi", async ({ renderRoute, screen }) => {
      await renderRoute({ route: "/en/guides/staying-fit-while-traveling-amalfi-coast" });

      const articleNode = await screen.findByTestId("article-structured");
      expect(articleNode).toHaveAttribute("data-headline", "Staying fit on the Amalfi Coast");
      expect(articleNode).toHaveAttribute("data-description", "Simple workouts while traveling.");
      await screen.findByRole("heading", { name: "Staying fit on the Amalfi Coast" });
      expect(screen.getByRole("heading", { name: "Staying fit on the Amalfi Coast" })).toBeInTheDocument();

      await screen.findByTestId("tag-chips");
      expect(screen.getByTestId("tag-chips")).toBeInTheDocument();

      const breadcrumbNode = await screen.findByTestId("breadcrumb-structured");
      const breadcrumb = JSON.parse(breadcrumbNode.textContent ?? "{}");
      expect(breadcrumb.itemListElement[2].name).toBe("Staying fit on the Amalfi Coast");
    });
  });
});

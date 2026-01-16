import { render, screen } from "@testing-library/react";

import GuideEditorialPanel from "./GuideEditorialPanel";
import { createGuideManifestEntry } from "../../guide-manifest";

describe("GuideEditorialPanel", () => {
  it("renders status, publish areas, and checklist items", () => {
    const manifest = createGuideManifestEntry({
      key: "luggageStorage",
      slug: "test-guide",
      contentKey: "testGuide",
      status: "draft",
      areas: ["experience"],
      primaryArea: "experience",
      structuredData: [],
      relatedGuides: [],
      blocks: [],
      checklist: [
        { id: "translations", status: "missing", note: "Translate remaining locales" },
        { id: "jsonLd", status: "inProgress" },
        { id: "faqs", status: "complete" },
      ],
    });

    render(
      <GuideEditorialPanel
        manifest={manifest}
        status="draft"
        checklist={{
          status: "draft",
          items: [
            { id: "translations", status: "missing", note: "Translate remaining locales" },
            { id: "jsonLd", status: "inProgress" },
            { id: "faqs", status: "complete" },
          ],
        }}
        draftUrl="/en/draft/guides/test-guide"
        isDraftRoute
        dashboardUrl="/en/draft"
      />,
    );

    expect(screen.getByText("Editorial workflow")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Experiences")).toBeInTheDocument();
    expect(screen.getByText("Completion checklist")).toBeInTheDocument();
    expect(screen.getByText("Translations")).toBeInTheDocument();
    expect(screen.getByText("Missing")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open draft dashboard" })).toHaveAttribute("href", "/en/draft");
  });
});
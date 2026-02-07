import "@testing-library/jest-dom";

import React from "react";
import { screen } from "@testing-library/react";

import GenericContent from "@/components/guides/GenericContent";
import { renderWithProviders } from "@tests/renderers";

describe("GenericContent section images", () => {
  it("renders section images inline via ImageGallery", () => {
    const guideKey = "positanoMainBeach" as any;
    const t = ((key: string) => {
      if (key === `content.${guideKey}.intro`) return ["Intro paragraph."];
      if (key === `content.${guideKey}.sections`) {
        return [
          {
            id: "step-1",
            title: "Step 1",
            body: ["Do the thing."],
            images: [
              {
                src: "/img/guides/test.jpg",
                alt: "Test image alt text",
                caption: "Test image caption",
              },
            ],
          },
        ];
      }
      if (key === `content.${guideKey}.faqs`) return [];
      if (key === `content.${guideKey}.faq`) return [];
      if (key === `content.${guideKey}.toc`) return [];
      if (key === `content.${guideKey}.tips`) return [];
      if (key === `content.${guideKey}.warnings`) return [];
      return key;
    }) as any;

    renderWithProviders(
      <GenericContent t={t} guideKey={guideKey} showToc={false} />,
      { route: "/en/experiences/positano-main-beach" },
    );

    expect(screen.getByAltText("Test image alt text")).toBeInTheDocument();
    expect(screen.getByText("Test image caption")).toBeInTheDocument();
  });
});

import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";

import { AssistanceQuickLinksSection } from "../AssistanceQuickLinksSection";

describe("AssistanceQuickLinksSection", () => {
  it("renders a thumbnail image when provided", () => {
    render(
      <AssistanceQuickLinksSection
        heading="Quick help"
        readMoreLabel="Read more"
        items={[
          {
            href: "/en/help/hostel-faqs",
            label: "Hostel FAQs",
            description: "Quick answers",
            image: { src: "/img/example.webp", alt: "Example thumbnail" },
          },
        ]}
      />,
    );

    expect(screen.getByRole("img", { name: "Example thumbnail" })).toHaveAttribute("src", "/img/example.webp");
  });
});


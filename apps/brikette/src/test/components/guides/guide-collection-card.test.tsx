import "@testing-library/jest-dom";

import type { ReactNode } from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@tests/renderers";

import { GuideCollectionCard } from "@/components/guides/GuideCollectionCard";
import type { GuideMeta } from "@/data/guides.index";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

jest.mock("@/data/guideDirectionLinks", () => ({
  GUIDE_DIRECTION_LINKS: {
    positanoMainBeach: [
      {
        slug: "walk-down-to-positano-main-beach",
        labelKey: "positanoMainBeachWalkDown",
        type: "guide",
      },
    ],
  },
}));

jest.mock("@/guides/slugs/labels", () => ({
  getGuideLinkLabels: () => ({}),
}));

jest.mock("@/routes.guides-helpers", () => ({
  guideHref: (lang: string, key: string) => `/${lang}/experiences/${key}`,
}));

describe("GuideCollectionCard", () => {
  it("humanizes direction labels when localized labels are missing", () => {
    const guide: GuideMeta = {
      key: "positanoMainBeach",
      tags: ["beaches"],
      section: "experiences",
      status: "live",
    };

    renderWithProviders(
      <GuideCollectionCard
        lang="en"
        guide={guide}
        label="Positano Main Beach"
        directionsLabel="Directions"
      />,
    );

    expect(screen.getByRole("link", { name: "Positano Main Beach Walk Down" })).toBeInTheDocument();
    expect(screen.queryByText("positanoMainBeachWalkDown")).not.toBeInTheDocument();
  });
});

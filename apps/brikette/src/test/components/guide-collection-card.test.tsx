import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import type { ImgHTMLAttributes, ReactNode } from "react";

import type { GuideMeta } from "@/data/guides.index";
import { GuideCollectionCard } from "@/components/guides/GuideCollectionCard";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    prefetch: _prefetch,
    ...props
  }: {
    children: ReactNode;
    href: string;
    prefetch?: boolean;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@acme/ui/atoms/CfImage", () => ({
  CfImage: (props: ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

jest.mock("@/guides/slugs/labels", () => ({
  getGuideLinkLabels: () => ({}),
}));

jest.mock("@/routes.guides-helpers", () => ({
  guideHref: (_lang: string, key: string) => `/en/experiences/${key}`,
}));

jest.mock("@/data/guideDirectionLinks", () => ({
  GUIDE_DIRECTION_LINKS: {
    positanoMainBeach: [{ slug: "positano-main-beach-walk-down", labelKey: "positanoMainBeachWalkDown" }],
  },
}));

describe("GuideCollectionCard", () => {
  it("humanizes direction label keys when localized labels are unavailable", () => {
    const guide: GuideMeta = {
      key: "positanoMainBeach",
      section: "experiences",
      status: "published",
      tags: ["beaches"],
    };

    render(
      <GuideCollectionCard
        lang="en"
        guide={guide}
        label="Main Beach"
        directionsLabel="Directions"
      />,
    );

    expect(screen.getByRole("link", { name: "Positano Main Beach Walk Down" })).toBeInTheDocument();
    expect(screen.queryByText("positanoMainBeachWalkDown")).not.toBeInTheDocument();
  });
});

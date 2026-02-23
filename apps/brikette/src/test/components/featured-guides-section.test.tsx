import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";

const renderGuideLinkTokensSpy = jest.fn();

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("react-i18next", () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string, opts?: { defaultValue?: string }) => {
      if (namespace === "landingPage" && key === "quickLinksSection.guides") return "Guides";
      if (namespace === "landingPage" && key === "quickLinksSection.guidesHint") {
        return "Local tips for your trip";
      }
      return opts?.defaultValue ?? key;
    },
    i18n: {
      getFixedT: () => (key: string) => key,
    },
    ready: true,
  }),
}));

jest.mock("@/routes/guides/utils/linkTokens", () => {
  const actual = jest.requireActual("@/routes/guides/utils/linkTokens");
  return {
    ...actual,
    renderGuideLinkTokens: (...args: any[]) => {
      renderGuideLinkTokensSpy(...args);
      return actual.renderGuideLinkTokens(...args);
    },
  };
});

const FeaturedGuidesSection =
  require("@/components/landing/FeaturedGuidesSection").default as typeof import("@/components/landing/FeaturedGuidesSection").default;

describe("FeaturedGuidesSection", () => {
  beforeEach(() => {
    renderGuideLinkTokensSpy.mockClear();
  });

  it("renders 6-8 guide links and resolves them via %LINK tokens", () => {
    render(<FeaturedGuidesSection lang="en" />);

    expect(screen.getByRole("heading", { name: "Guides" })).toBeInTheDocument();

    const guideLinks = screen.getAllByRole("link");
    expect(guideLinks.length).toBeGreaterThanOrEqual(6);
    expect(guideLinks.length).toBeLessThanOrEqual(8);

    guideLinks.forEach((link) => {
      expect(link.getAttribute("href")).toMatch(/^\/en\//);
    });

    expect(renderGuideLinkTokensSpy).toHaveBeenCalledTimes(guideLinks.length);
    renderGuideLinkTokensSpy.mock.calls.forEach((call) => {
      expect(String(call[0])).toMatch(/^%LINK:[^|]+\\|.+%$/);
    });
  });
});

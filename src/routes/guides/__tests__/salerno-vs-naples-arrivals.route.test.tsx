import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@tests/renderers";
import { screen } from "@testing-library/react";
import i18n from "@/i18n";

const useTranslationMock = vi.fn();
const genericContentMock = vi.fn(({ guideKey }: { guideKey: string }) => (
  <div data-testid="generic-content">guide:{guideKey}</div>
));

vi.mock("@/hooks/useCurrentLanguage", () => ({
  useCurrentLanguage: () => "en",
}));

vi.mock("react-i18next", () => ({
  useTranslation: (...args: unknown[]) => useTranslationMock(...args),
  withTranslation:
    () =>
    (Component: React.ComponentType) =>
      Component,
}));

vi.mock("@/components/guides/GenericContent", () => ({
  __esModule: true,
  default: (props: Parameters<typeof genericContentMock>[0]) => genericContentMock(props),
}));

vi.mock("@/components/guides/TagChips", () => ({
  __esModule: true,
  default: () => <div data-testid="tag-chips" />,
}));

vi.mock("@/components/guides/RelatedGuides", () => ({
  __esModule: true,
  default: ({ items }: { items: { key: string }[] }) => (
    <div data-testid="related-guides">{items.map((item) => item.key).join(",")}</div>
  ),
}));

vi.mock("@/components/seo/BreadcrumbStructuredData", () => ({
  __esModule: true,
  default: ({ breadcrumb }: { breadcrumb: unknown }) => (
    <div data-testid="breadcrumb-json">{JSON.stringify(breadcrumb)}</div>
  ),
}));

vi.mock("@/components/seo/ArticleStructuredData", () => ({
  __esModule: true,
  default: ({ headline }: { headline: string }) => <div data-testid="article" data-headline={headline} />,
}));

vi.mock("@/components/seo/GuideFaqJsonLd", () => ({
  __esModule: true,
  default: ({ guideKey }: { guideKey: string }) => <div data-testid="faq-json" data-guide={guideKey} />,
}));

vi.mock("@/components/guides/TransportNotice", () => ({
  __esModule: true,
  default: () => <div data-testid="transport-notice" />,
}));

vi.mock("@/components/guides/PlanChoice", () => ({
  __esModule: true,
  default: () => <div data-testid="plan-choice" />,
}));

describe("salerno vs naples arrivals guide", () => {
  beforeEach(() => {
    useTranslationMock.mockReset();
    genericContentMock.mockClear();
    if (i18n.hasResourceBundle("en", "guides")) {
      i18n.removeResourceBundle("en", "guides");
    }
  });

  afterEach(() => {
    if (i18n.hasResourceBundle("en", "guides")) {
      i18n.removeResourceBundle("en", "guides");
    }
  });

  it("prefers arrivals-specific content when available", async () => {
    useTranslationMock.mockImplementation(() => ({
      t: (key: string, options?: Record<string, unknown>) => {
        if (key === "content.salernoVsNaples.seo.title") return "Arrivals";
        if (key === "content.salernoVsNaples.seo.description") return "Arrivals desc";
        if (key === "header:home") return "Home";
        if (key === "labels.indexTitle") return "Guides";
        if (options?.returnObjects) {
          if (key === "content.salernoVsNaplesArrivals.intro") return ["Intro"];
          if (key === "content.salernoVsNaplesArrivals.sections")
            return [{ id: "s1", title: "Section", body: ["Details"] }];
          if (key === "content.salernoVsNaplesArrivals.faqs") return [{ q: "Q?", a: ["A"] }];
          return [];
        }
        return key;
      },
    }));

    i18n.addResourceBundle(
      "en",
      "guides",
      {
        content: {
          salernoVsNaplesArrivals: {
            intro: ["Intro"],
            sections: [{ id: "s1", title: "Section", body: ["Details"] }],
            faqs: [{ q: "Q?", a: ["A"] }],
            seo: { title: "Arrivals", description: "Arrivals desc" },
          },
          salernoVsNaples: {
            intro: [],
            sections: [],
            faqs: [],
            seo: { title: "Arrivals", description: "Arrivals desc" },
          },
        },
        header: { home: "Home" },
        labels: { indexTitle: "Guides" },
      },
      true,
      true,
    );

    const { default: Route } = await import("@/routes/guides/salerno-vs-naples-arrivals");
    renderWithProviders(<Route />);

    expect(genericContentMock).toHaveBeenCalledWith(
      expect.objectContaining({ guideKey: "salernoVsNaplesArrivals" }),
    );
    expect(screen.getByTestId("faq-json")).toHaveAttribute("data-guide", "salernoVsNaplesArrivals");
  });

  it("falls back to legacy content when arrivals bundle is empty", async () => {
    useTranslationMock.mockImplementation(() => ({
      t: (key: string, options?: Record<string, unknown>) => {
        if (key === "content.salernoVsNaples.seo.title") return "Arrivals";
        if (key === "content.salernoVsNaples.seo.description") return "Arrivals desc";
        if (key === "header:home") return "";
        if (key === "labels.indexTitle") return "";
        if (options?.returnObjects) {
          if (key === "content.salernoVsNaples.intro") return ["Legacy intro"];
          if (key === "content.salernoVsNaples.sections")
            return [{ id: "legacy", title: "Legacy", body: ["Details"] }];
          if (key === "content.salernoVsNaples.faqs") return [{ q: "Q?", a: ["A"] }];
          return [];
        }
        return key;
      },
    }));

    i18n.addResourceBundle(
      "en",
      "guides",
      {
        content: {
          salernoVsNaplesArrivals: {
            intro: [],
            sections: [],
            faqs: [],
            seo: { title: "Arrivals", description: "Arrivals desc" },
          },
          salernoVsNaples: {
            intro: ["Legacy intro"],
            sections: [{ id: "legacy", title: "Legacy", body: ["Details"] }],
            faqs: [{ q: "Q?", a: ["A"] }],
            seo: { title: "Arrivals", description: "Arrivals desc" },
          },
        },
        header: { home: "" },
        labels: { indexTitle: "" },
      },
      true,
      true,
    );

    const { default: Route } = await import("@/routes/guides/salerno-vs-naples-arrivals");
    renderWithProviders(<Route />);

    expect(genericContentMock).toHaveBeenCalledWith(expect.objectContaining({ guideKey: "salernoVsNaples" }));
    const breadcrumb = screen.getByTestId("breadcrumb-json").textContent ?? "";
    expect(breadcrumb).toContain("Home");
    expect(breadcrumb).toContain("Guides");
  });

  it("renders minimal layout when neither arrivals nor legacy content exists", async () => {
    useTranslationMock.mockImplementation(() => ({
      t: (key: string, options?: Record<string, unknown>) => {
        if (key === "content.salernoVsNaples.seo.title") return "Arrivals";
        if (key === "content.salernoVsNaples.seo.description") return "Arrivals desc";
        if (key === "header:home") return "Home";
        if (key === "labels.indexTitle") return "Guides";
        if (options?.returnObjects) return [];
        return key;
      },
    }));

    i18n.addResourceBundle(
      "en",
      "guides",
      {
        content: {
          salernoVsNaplesArrivals: {
            intro: [],
            sections: [],
            faqs: [],
            seo: { title: "Arrivals", description: "Arrivals desc" },
          },
          salernoVsNaples: {
            intro: [],
            sections: [],
            faqs: [],
            seo: { title: "Arrivals", description: "Arrivals desc" },
          },
        },
        header: { home: "Home" },
        labels: { indexTitle: "Guides" },
      },
      true,
      true,
    );

    const { default: Route } = await import("@/routes/guides/salerno-vs-naples-arrivals");
    renderWithProviders(<Route />);

    expect(screen.queryByTestId("generic-content")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Arrivals");
    expect(screen.getByTestId("faq-json")).toHaveAttribute("data-guide", "salernoVsNaples");
  });

  it("re-exports the route shim for TypeScript consumers", async () => {
    const [{ default: shim, handle: shimHandle }, source] = await Promise.all([
      import("@/routes/guides/salerno-vs-naples-arrivals"),
      import("@/routes/guides/salerno-vs-naples-arrivals.tsx"),
    ]);

    expect(shim).toBe(source.default);
    expect(shimHandle.tags).toContain("transport");
  });
});
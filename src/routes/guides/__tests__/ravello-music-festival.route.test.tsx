import { beforeEach, describe, expect, it, vi } from "vitest";
import { within } from "@testing-library/react";

import { renderWithProviders } from "@tests/renderers";

const useTranslationMock = vi.fn();
const getFixedTMock = vi.fn();

const eventStructuredMock = vi.fn(
  ({
    name,
    startDate,
    endDate,
    locationName,
    addressLocality,
    description,
  }: {
    name?: string;
    startDate?: string;
    endDate?: string;
    locationName?: string;
    addressLocality?: string;
    description?: string;
  }) => (
    <div
      data-testid="event-structured"
      data-name={name}
      data-start={startDate}
      data-end={endDate}
      data-location={locationName}
      data-locality={addressLocality}
      data-description={description}
    />
  ),
);

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

vi.mock("@/i18n", () => ({
  __esModule: true,
  default: {
    getFixedT: (...args: unknown[]) => getFixedTMock(...args),
  },
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

vi.mock("@/components/guides/TableOfContents", () => ({
  __esModule: true,
  default: ({ items }: { items: { href: string; label: string }[] }) => (
    <nav aria-label="toc">
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  ),
}));

vi.mock("@/components/seo/BreadcrumbStructuredData", () => ({
  __esModule: true,
  default: ({ breadcrumb }: { breadcrumb: unknown }) => (
    <div data-testid="breadcrumb-json">{JSON.stringify(breadcrumb)}</div>
  ),
}));

vi.mock("@/components/seo/EventStructuredData", () => ({
  __esModule: true,
  default: (props: Parameters<typeof eventStructuredMock>[0]) => eventStructuredMock(props),
}));

vi.mock("@/components/guides/EventInfo", () => ({
  __esModule: true,
  default: ({ date, location, tips }: { date?: string; location?: string; tips: string[] }) => (
    <div data-testid="event-info" data-date={date} data-location={location} data-tips={tips.join("|")} />
  ),
}));

vi.mock("@/components/seo/ArticleStructuredData", () => ({
  __esModule: true,
  default: ({ headline }: { headline: string }) => <div data-testid="article" data-headline={headline} />,
}));

describe("ravello music festival guide", () => {
  beforeEach(() => {
    useTranslationMock.mockReset();
    getFixedTMock.mockReset();
    eventStructuredMock.mockClear();
  });

  it("normalises structured content, injects event info, and merges schema fallbacks", async () => {
    useTranslationMock.mockImplementation(() => {
      const translations: Record<string, unknown> = {
        "content.ravelloFestival.seo.title": "Ravello Festival",
        "content.ravelloFestival.seo.description": "Attend the concert",
        "content.ravelloFestival.intro": ["  Intro paragraph  "],
        "content.ravelloFestival.sections": [
          { id: "plan", title: "Planning", body: ["Buy tickets"] },
          { title: "Venue", body: ["Walk uphill"], id: "" },
        ],
        "content.ravelloFestival.toc": [
          { href: "plan", label: "Plan" },
          { href: "#venue", label: "Venue" },
          { href: null, label: "" },
        ],
        "content.ravelloFestival.faqs": [
          { q: "Dress code?", a: ["Smart casual", "  No shorts  "] },
          { q: "", a: ["skip"] },
        ],
        "content.ravelloFestival.faqsTitle": "FAQs",
        "content.ravelloFestival.eventInfo": {
          afterSectionId: "plan",
          date: "July 15",
          location: "Villa Rufolo",
          tips: ["  Arrive early  ", 123],
        },
        "content.ravelloFestival.eventSchema": {
          name: "",
          startDate: "2025-07-15",
          locationName: "",
          addressLocality: "Ravello",
        },
        "meta.index.title": "Guides",
      };

      return {
        t: (key: string, options?: Record<string, unknown>) => {
          const value = translations[key];
          if (options?.returnObjects) {
            return value ?? [];
          }
          if (typeof value === "string") return value;
          return key;
        },
      };
    });

    getFixedTMock.mockImplementation((lang: string) => {
      if (lang === "en") {
        return (key: string) => {
          if (key === "content.ravelloFestival.eventSchema") {
            return {
              name: "Ravello Festival",
              startDate: "2025-07-15",
              endDate: "2025-07-16",
              locationName: "Villa Rufolo",
              addressLocality: "Ravello",
              description: "Concert series",
            };
          }
          return [];
        };
      }
      return () => [];
    });

    const { default: Route } = await import("@/routes/guides/ravello-music-festival");
    const { getAllByRole, getAllByTestId, getByRole } = renderWithProviders(<Route />);

    expect(getByRole("heading", { level: 1 })).toHaveTextContent("Ravello Festival");

    const sectionHeadings = getAllByRole("heading", { level: 2 }).filter((node) => node.id !== "faqs");
    expect(sectionHeadings).toHaveLength(2);

    const firstSection = sectionHeadings[0].closest("section");
    expect(firstSection).not.toBeNull();
    if (!firstSection) throw new Error("Section not rendered");
    const embeddedInfo = within(firstSection).getByTestId("event-info");
    expect(embeddedInfo.dataset.date).toBe("July 15");
    expect(embeddedInfo.dataset.location).toBe("Villa Rufolo");
    expect(embeddedInfo.dataset.tips).toBe("Arrive early");

    expect(getAllByTestId("event-info")).toHaveLength(1);

    const tocLinks = getAllByRole("link");
    expect(tocLinks.some((link) => link.getAttribute("href") === "#plan")).toBe(true);
    expect(tocLinks.some((link) => link.getAttribute("href") === "#section-2")).toBe(true);

    expect(eventStructuredMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Ravello Festival",
        startDate: "2025-07-15",
        endDate: "2025-07-16",
        locationName: "Villa Rufolo",
        addressLocality: "Ravello",
        description: "Concert series",
      }),
    );
  });

  it("falls back to minimal layout when structure is missing", async () => {
    useTranslationMock.mockImplementation((namespace?: string) => {
      if (namespace === "header") {
        return { t: (key: string) => (key === "home" ? "Home" : key) };
      }
      return {
        t: (key: string, options?: Record<string, unknown>) => {
          if (key === "content.ravelloFestival.seo.title") return "Ravello Festival";
          if (key === "content.ravelloFestival.seo.description") return "Attend the concert";
          if (options?.returnObjects) return [];
          return key;
        },
      };
    });

    getFixedTMock.mockImplementation(() => () => ({}));

    const { default: Route } = await import("@/routes/guides/ravello-music-festival");
    const { container, getByRole } = renderWithProviders(<Route />);

    expect(getByRole("heading", { level: 1 })).toHaveTextContent("Ravello Festival");
    const nav = container.querySelector("nav[aria-label='toc']");
    expect(nav?.querySelectorAll("a").length ?? 0).toBe(0);
    expect(container.querySelectorAll("section#faqs details")).toHaveLength(0);
    expect(eventStructuredMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "",
        startDate: "",
      }),
    );
  });
});
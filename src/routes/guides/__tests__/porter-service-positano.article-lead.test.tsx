import { within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@tests/renderers";

vi.mock("@/components/guides/TableOfContents", () => ({
  __esModule: true,
  default: ({ title, items }: { title: string; items: { href: string; label: string }[] }) => (
    <nav data-testid="toc" aria-label={title}>
      <ul>
        {items.map((item) => (
          <li key={item.href}>{item.label}</li>
        ))}
      </ul>
    </nav>
  ),
}));

vi.mock("@/components/guides/ImageGallery", () => ({
  __esModule: true,
  default: ({ items, className }: { items: { src: string; alt: string }[]; className?: string }) => (
    <div data-testid={className ? `gallery-${className}` : "gallery"}>{items.map((item) => item.alt).join(",")}</div>
  ),
}));

vi.mock("@/components/guides/TagChips", () => ({
  __esModule: true,
  default: () => <div data-testid="tags" />,
}));

vi.mock("../utils/_linkTokens", () => ({
  __esModule: true,
  renderGuideLinkTokens: (text: string) => [text],
}));

import { createArticleLead } from "../porter-service-positano.article-lead";
import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";
import type { GuideExtras } from "../porter-service-positano.types";
import PorterServiceArticleLeadPreview from "../porter-service-positano.article-lead";
import * as serviceDataModule from "../porter-service-positano.service-data";

const structuredPreviewSpy = vi
  .spyOn(serviceDataModule, "PorterServiceStructuredDataPreview")
  .mockImplementation(() => <div data-testid="structured-preview" />);

describe("createArticleLead", () => {
  const mockTranslator = ((
    key: string,
    options?: { returnObjects?: boolean; defaultValue?: unknown },
  ) => (options?.defaultValue ?? (options?.returnObjects ? {} : key))) as unknown as GuideSeoTemplateContext["translator"];

  const context: GuideSeoTemplateContext = {
    lang: "en",
    guideKey: "porterServices",
    metaKey: "porterServices",
    hasLocalizedContent: true,
    translator: mockTranslator,
    translateGuides: mockTranslator,
    sections: [],
    intro: [],
    faqs: [],
    toc: [],
    ogImage: { url: "https://example.com/og.png", width: 1200, height: 630 },
    article: { title: "Porter service", description: "How to book" },
    canonicalUrl: "https://example.com/en/guides/porter-service",
  };

  it("renders every optional block when extras provide data", () => {
    const extras: GuideExtras = {
      introTitle: "Intro",
      intro: ["Book ahead"],
      sections: [
        { id: "overview", title: "Overview", body: ["Arrive early", "Bring cash"] },
      ],
      steps: ["Call the porter", "Meet at the dock"],
      howTitle: "How it works",
      resources: ["Visit PorterCo for details"],
      resourcesTitle: "Resources",
      resourceLinks: [{ label: "PorterCo", href: "https://porter.example" }],
      etiquette: ["Tip at least 10%"],
      etiquetteTitle: "Etiquette",
      faqs: [{ q: "Cost?", a: ["Around €10"] }],
      faqsTitle: "FAQs",
      galleryTitle: "Scenes",
      galleryItems: [{ src: "gallery.avif", alt: "Gallery alt" }],
      tocItems: [
        { href: "#intro", label: "Intro" },
        { href: "#overview", label: "Overview" },
      ],
      tocTitle: "On this page",
      heroImage: { src: "hero.avif", alt: "Hero", width: 1200, height: 630 },
    };

    const ArticleLead = createArticleLead(() => extras);
    const view = renderWithProviders(ArticleLead(context));

    expect(view.getByRole("heading", { level: 2, name: "Intro" })).toHaveClass("sr-only");
    expect(view.getByText("Book ahead")).toBeInTheDocument();
    expect(view.getByTestId("toc")).toBeInTheDocument();

    const gallery = view.getAllByTestId(/gallery/);
    expect(gallery).toHaveLength(2);
    expect(gallery[0]).toHaveTextContent("Hero");
    expect(gallery[1]).toHaveTextContent("Gallery alt");

    const overviewSection = view.getByRole("heading", { level: 2, name: "Overview" }).closest("section");
    expect(overviewSection).not.toBeNull();
    expect(within(overviewSection as HTMLElement).getByText("Arrive early")).toBeInTheDocument();

    const howSection = view.getByRole("heading", { level: 2, name: "How it works" }).closest("section");
    expect(howSection).not.toBeNull();
    const stepsList = within(howSection as HTMLElement).getByRole("list");
    expect(within(stepsList).getAllByRole("listitem")).toHaveLength(2);

    const resourcesSection = view.getByRole("heading", { level: 2, name: "Resources" }).closest("section");
    expect(resourcesSection).not.toBeNull();
    const resourceLink = within(resourcesSection as HTMLElement).getByRole("link", { name: "PorterCo" });
    expect(resourceLink).toHaveAttribute("href", "https://porter.example");
    expect(resourceLink).toHaveAttribute("target", "_blank");
    expect(resourceLink).toHaveAttribute("rel", "noreferrer");

    expect(view.getByRole("heading", { level: 2, name: "Etiquette" })).toBeInTheDocument();
    expect(view.getByText("Tip at least 10%")).toBeInTheDocument();
    expect(view.getByRole("heading", { level: 2, name: "FAQs" })).toBeInTheDocument();
    expect(view.getByText("Around €10")).toBeInTheDocument();
    expect(view.getByTestId("tags")).toBeInTheDocument();
  });

  it("omits optional sections when extras are empty", () => {
    const extras: GuideExtras = {
      introTitle: "Intro",
      intro: [],
      sections: [],
      steps: [],
      howTitle: "How it works",
      resources: ["Call ahead"],
      resourcesTitle: "Resources",
      resourceLinks: [{ label: "PorterCo", href: "https://porter.example" }],
      etiquette: [],
      etiquetteTitle: "Etiquette",
      faqs: [],
      faqsTitle: "FAQs",
      galleryTitle: "",
      galleryItems: [],
      tocItems: [],
      tocTitle: "On this page",
      heroImage: { src: "hero.avif", alt: "Hero" },
    };

    const ArticleLead = createArticleLead(() => extras);
    const view = renderWithProviders(ArticleLead(context));

    expect(view.queryByTestId("toc")).not.toBeInTheDocument();
    expect(view.queryByRole("heading", { name: "Resources" })).not.toBeNull();
    const resourcesSection = view.getByRole("heading", { name: "Resources" }).closest("section");
    expect(within(resourcesSection as HTMLElement).queryByRole("link", { name: "PorterCo" })).toBeNull();
    expect(view.queryByRole("heading", { name: "Etiquette" })).toBeNull();
    expect(view.queryByRole("heading", { name: "FAQs" })).toBeNull();
    expect(view.queryByTestId("gallery")).not.toBeInTheDocument();
  });

  it("renders plain text resources when no resource links are provided", () => {
    const extras: GuideExtras = {
      introTitle: "Intro",
      intro: [],
      sections: [],
      steps: [],
      howTitle: "How it works",
      resources: ["Contact PorterCo for updates"],
      resourcesTitle: "Resources",
      resourceLinks: [],
      etiquette: [],
      etiquetteTitle: "Etiquette",
      faqs: [],
      faqsTitle: "FAQs",
      galleryTitle: "",
      galleryItems: [],
      tocItems: [],
      tocTitle: "On this page",
      heroImage: { src: "hero.avif", alt: "Hero" },
    };

    const ArticleLead = createArticleLead(() => extras);
    const view = renderWithProviders(ArticleLead(context));

    const resourcesSection = view.getByRole("heading", { level: 2, name: "Resources" }).closest("section");
    expect(resourcesSection).not.toBeNull();
    const sectionQueries = within(resourcesSection as HTMLElement);
    expect(sectionQueries.queryByRole("link", { name: "PorterCo" })).toBeNull();
    expect(sectionQueries.getByText("Contact PorterCo for updates")).toBeInTheDocument();
  });
});

describe("PorterServiceArticleLeadPreview", () => {
  it("renders structured data preview output", () => {
    const view = renderWithProviders(<PorterServiceArticleLeadPreview />);
    expect(view.getByTestId("structured-preview")).toBeInTheDocument();
    expect(structuredPreviewSpy).toHaveBeenCalled();
  });
});
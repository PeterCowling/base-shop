import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";

import { withGuideMocks } from "./__tests__/guideTestHarness";
import { genericContentMock } from "./__tests__/guides.test-utils";

import { GUIDE_KEY, GUIDE_SLUG, handle } from "./positano-on-a-budget";

vi.mock("@/components/guides/TableOfContents", () => ({
  __esModule: true,
  default: ({ items, title }: { items: { href: string; label: string }[]; title?: string }) => (
    <nav data-testid="toc">
      {title ? <span>{title}</span> : null}
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

vi.mock("@/components/guides/ImageGallery", () => ({
  __esModule: true,
  default: ({ items }: { items: { src: string; alt: string; caption?: string }[] }) => (
    <div data-testid="image-gallery">
      {items.map((item) => (
        <figure key={item.src}>
          <img alt={item.alt} src={item.src} />
          {item.caption ? <figcaption>{item.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  ),
}));

vi.mock("@/components/guides/CostBreakdown", () => ({
  __esModule: true,
  default: ({ slices, title }: { slices: { label: string; value: number }[]; title?: string }) => (
    <section data-testid="cost-breakdown">
      {title ? <h3>{title}</h3> : null}
      <ul>
        {slices.map((slice) => (
          <li key={slice.label}>
            {slice.label}: {slice.value}
          </li>
        ))}
      </ul>
    </section>
  ),
}));

vi.mock("@/components/images/CfImage", () => ({
  __esModule: true,
  CfImage: ({ src, alt }: { src: string; alt: string }) => <img data-testid="hero-image" src={src} alt={alt} />,
}));

vi.mock("@/lib/buildCfImageUrl", () => ({
  __esModule: true,
  default: (path: string) => `https://cdn.test${path}`,
}));

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const EN_BASE_TRANSLATIONS = {
  [`content.${GUIDE_KEY}`]: {
    heroAlt: "English hero",
    intro: ["Fallback intro"],
    sections: [],
    faqs: [{ q: "English Q", a: ["Answer with %LINK:salernoPositano|Salerno%"] }],
    gallery: [{ alt: "English hero" }, { alt: "English hero" }],
    tocTitle: "English TOC",
    faqsTitle: "FAQs (EN)",
    costBreakdown: {
      slices: [{ label: "Lodging", value: 75 }],
      title: "English cost heading",
    },
  },
  ["labels.costBreakdownTitle"]: "English cost heading",
};

const IT_STRUCTURED_TRANSLATIONS = {
  [`content.${GUIDE_KEY}`]: {
    heroAlt: "",
    intro: [" Intro copy ", ""],
    sections: [
      { id: " Custom-ID ", title: " Custom Section ", body: [" Paragraph one ", ""] },
      { id: "", title: "", body: [] },
    ],
    faqs: [{ q: "  Local FAQ?  ", a: [" Use %LINK:naplesPositano|Naples%"] }],
    gallery: [
      { alt: " Scenic view ", caption: " Caption A " },
      { caption: " Caption B " },
    ],
    tocTitle: " Local TOC ",
    faqsTitle: " ",
    costBreakdown: {
      slices: [
        { label: " Lodging ", value: "50" },
        { label: "", value: 0 },
      ],
      title: " ",
    },
  },
  ["labels.costBreakdownTitle"]: " Local cost heading ",
};

const IT_EMPTY_TRANSLATIONS = {
  [`content.${GUIDE_KEY}`]: {
    heroAlt: " ",
    intro: [],
    sections: [],
    faqs: [],
    gallery: [],
    tocTitle: " ",
    faqsTitle: " ",
    costBreakdown: { slices: [], title: " " },
  },
};

const IT_INTRO_ONLY_TRANSLATIONS = {
  [`content.${GUIDE_KEY}`]: {
    heroAlt: " ",
    intro: ["Intro only"],
    sections: [],
    faqs: [],
    gallery: [],
    tocTitle: " ",
    faqsTitle: " ",
    costBreakdown: { slices: [], title: " " },
  },
};

describe("positano-on-a-budget integrations", () => {
  beforeEach(() => {
    genericContentMock.mockClear();
    capturedFaqFallbacks.clear();
  });

  it("renders structured sections, gallery, and FAQ fallbacks", () =>
    withGuideMocks(GUIDE_KEY, async ({ setTranslations, setCurrentLanguage, renderRoute }) => {
      setTranslations("en", "guides", clone(EN_BASE_TRANSLATIONS));
      setTranslations("it", "guides", clone(IT_STRUCTURED_TRANSLATIONS));
      setCurrentLanguage("it");

      await renderRoute({ route: "/it/guides/positano-on-a-budget" });

      expect(screen.getAllByText(/Intro copy/)).not.toHaveLength(0);
      const structuredToc = screen
        .getAllByTestId("toc")
        .find((nav) => within(nav).queryByRole("link", { name: "Custom Section" }));
      expect(structuredToc).toBeTruthy();
      if (structuredToc) {
        expect(within(structuredToc).getByRole("link", { name: "Custom Section" })).toHaveAttribute(
          "href",
          "#Custom-ID",
        );
      }
      expect(screen.getByTestId("hero-image")).toHaveAttribute("alt", "English hero");
      expect(screen.getByTestId("cost-breakdown")).toHaveTextContent("Lodging");
      expect(screen.getAllByRole("heading", { name: "FAQs (EN)" })).not.toHaveLength(0);
      expect(screen.getByTestId("image-gallery")).toBeInTheDocument();

      expect(readFaqFallback()).toEqual([{ q: "Local FAQ?", a: ["Use Naples"] }]);
    }));

  it("falls back to generic content, hides toc, and reuses English FAQs when structured data is missing", () =>
    withGuideMocks(GUIDE_KEY, async ({ setTranslations, setCurrentLanguage, renderRoute }) => {
      setTranslations("en", "guides", clone(EN_BASE_TRANSLATIONS));
      setTranslations("it", "guides", clone(IT_EMPTY_TRANSLATIONS));
      setCurrentLanguage("it");

      await renderRoute({ route: "/it/guides/positano-on-a-budget" });

      expect(genericContentMock).toHaveBeenCalledWith(expect.objectContaining({ guideKey: GUIDE_KEY }));
      const tocNavs = screen.queryAllByTestId("toc");
      expect(
        tocNavs.every((nav) => !within(nav).queryByRole("link", { name: "Custom Section" })),
      ).toBe(true);
      expect(screen.getByTestId("hero-image")).toHaveAttribute("alt", "English hero");
      expect(screen.getByTestId("image-gallery")).toBeInTheDocument();

      expect(readFaqFallback()).toEqual([{ q: "English Q", a: ["Answer with Salerno"] }]);
    }));

  it("omits the generated table of contents when only intro copy is available", () =>
    withGuideMocks(GUIDE_KEY, async ({ setTranslations, setCurrentLanguage, renderRoute }) => {
      setTranslations("en", "guides", clone(EN_BASE_TRANSLATIONS));
      setTranslations("it", "guides", clone(IT_INTRO_ONLY_TRANSLATIONS));
      setCurrentLanguage("it");

      await renderRoute({ route: "/it/guides/positano-on-a-budget" });

      expect(screen.getAllByText(/Intro only/)).not.toHaveLength(0);
      const tocNavs = screen.queryAllByTestId("toc");
      expect(
        tocNavs.every((nav) => !within(nav).queryByRole("link", { name: "Custom Section" })),
      ).toBe(true);
    }));

  it("exposes route metadata", () => {
    expect(handle.tags).toContain("travel-tips");
    expect(GUIDE_SLUG).toBe("positano-on-a-budget");
  });
});
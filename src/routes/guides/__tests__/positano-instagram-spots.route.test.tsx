import { beforeEach, describe, expect, it, vi } from "vitest";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";
import { renderWithProviders } from "@tests/renderers";
import { withGuideMocks } from "./guideTestHarness";

import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";
import type { GenericContentTranslator } from "@/components/guides/GenericContent";
import type { AppLanguage } from "@/i18n.config";

type TranslatorOptions = { defaultValue?: unknown; returnObjects?: boolean } | undefined;
type TranslatorValueMap = Record<string, unknown>;

function createTranslator(map: TranslatorValueMap): GenericContentTranslator {
  return ((key: string, options: TranslatorOptions = {}) => {
    const value = map[key];
    if (options?.returnObjects) {
      if (value !== undefined) return value;
      if (options?.defaultValue !== undefined) return options.defaultValue;
      return [];
    }
    if (value !== undefined) return value;
    if (options?.defaultValue !== undefined) return options.defaultValue;
    return "";
  }) as GenericContentTranslator;
}

const translationStore = vi.hoisted(() => ({} as Record<string, TranslatorValueMap>));

const getFixedTMock = vi.hoisted(() =>
  vi.fn<(locale: string) => GenericContentTranslator>((locale) =>
    createTranslator(translationStore[locale] ?? {}),
  ),
);

vi.mock("@/i18n", () => ({
  __esModule: true,
  default: {
    getFixedT: getFixedTMock,
  },
}));

vi.mock("@/routes.guides-helpers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/routes.guides-helpers")>();
  return {
    __esModule: true,
    ...actual,
    guideHref: (lang: AppLanguage, key: string) => `/${lang}/${key}`,
  };
});

vi.mock("@/components/guides/GenericContent", () => ({
  __esModule: true,
  default: ({ guideKey }: { guideKey: string }) => <div data-testid="generic-content">{guideKey}</div>,
}));

const imageGalleryState = vi.hoisted(() => ({
  lastItems: [] as Array<{ src: string; alt: string }>,
}));

vi.mock("@/components/guides/ImageGallery", () => ({
  __esModule: true,
  default: ({ items }: { items: { src: string; alt: string }[] }) => {
    imageGalleryState.lastItems = items;
    return <div data-testid="image-gallery">{items.map((item) => `${item.src}:${item.alt}`).join("|")}</div>;
  },
}));

vi.mock("@/components/guides/TableOfContents", () => ({
  __esModule: true,
  default: ({ items }: { items: { href: string; label: string }[] }) => (
    <nav data-testid="toc">
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

vi.mock("../utils/_linkTokens", () => ({
  __esModule: true,
  renderGuideLinkTokens: (value: string) => [value],
  stripGuideLinkTokens: (value: string) => value.replace(/%LINK:[^|]+\|([^%]+)%/g, "$1"),
}));

const GUIDE_KEY = "instagramSpots" as const;

function setGuideTranslations(locale: string, values: TranslatorValueMap): void {
  if (Object.keys(values).length === 0) {
    delete translationStore[locale];
    return;
  }
  translationStore[locale] = values;
}

function buildContext(lang: AppLanguage, overrides: Partial<GuideSeoTemplateContext> = {}): GuideSeoTemplateContext {
  const translator = createTranslator(translationStore[lang] ?? {});
  return {
    lang,
    guideKey: GUIDE_KEY,
    metaKey: GUIDE_KEY,
    hasLocalizedContent: false,
    translator,
    translateGuides: translator,
    sections: [],
    intro: [],
    faqs: [],
    toc: [],
    ogImage: { url: "https://example.test/image.png", width: 1200, height: 630 },
    article: { title: "", description: "" },
    canonicalUrl: "https://example.test",
    ...overrides,
  };
}

describe("positano-instagram-spots route", () => {
  beforeEach(() => {
    resetGuideTemplateSpy();
    getFixedTMock.mockClear();
    Object.keys(translationStore).forEach((key) => delete translationStore[key]);
    imageGalleryState.lastItems = [];
  });

  it("returns generic content when localized sections are available", async () => {
    setGuideTranslations("en", {});
    const props = await renderRoute();

    const context = buildContext("en", { hasLocalizedContent: true });
    const articleLead = props.articleLead as (ctx: GuideSeoTemplateContext) => JSX.Element;
    const view = render(<MemoryRouter>{articleLead(context)}</MemoryRouter>);
    expect(view.getByTestId("generic-content")).toHaveTextContent(GUIDE_KEY);
  });

  it("renders fallback article and normalises structured content", async () => {
    setGuideTranslations("en", {
      [`content.${GUIDE_KEY}.fallback`]: {
        intro: ["English intro"],
        toc: [{ href: "#classics", label: "Classics" }],
        classics: {
          heading: "English Classics",
          items: [
            { title: "Fallback Classic", description: "Fallback description", link: { guideKey: "positanoBudget" } },
          ],
        },
        alternatives: {
          heading: "Alternative picks",
          items: [
            { title: "Fallback Alternative", description: "Fallback alt" },
          ],
        },
        sunset: { heading: "Sunset fallback", paragraphs: ["Fallback sunset"] },
        etiquette: { heading: "Etiquette fallback", items: ["Fallback etiquette"] },
        faqs: {
          heading: "FAQ fallback",
          items: [{ summary: "Fallback summary", body: "Fallback body" }],
        },
        drone: { summary: "Fallback drone summary", body: "Fallback drone body" },
        galleryAlt: ["Fallback alt one", "Fallback alt two"],
        galleryFallbackAlt: "Fallback gallery alt",
      },
      "content.positanoBudget.linkLabel": "Budget guide",
      "content.sunsetViewpoints.linkLabel": "Sunset viewpoints",
      "content.beaches.linkLabel": "Best beaches",
      "content.cheapEats.linkLabel": "Cheap eats",
      "content.workCafes.linkLabel": "Work cafes",
    });

    setGuideTranslations("it", {
      [`content.${GUIDE_KEY}.fallback`]: {
        intro: [" Intro one ", "Second paragraph"],
        toc: [{ href: "#classics", label: " Classics " }, { href: " ", label: "" }],
        classics: {
          heading: " Classics Heading ",
          items: [
            { title: " Classic One ", description: " Description one ", link: { guideKey: "positanoBudget" } },
            { description: " Only description " },
            { title: " ", description: " " },
          ],
        },
        alternatives: {
          heading: " ",
          items: [
            { title: " Alt One ", description: " Alt desc ", link: { guideKey: "sunsetViewpoints" } },
            { description: "Only alt description" },
          ],
        },
        sunset: { heading: " ", paragraphs: ["  ", " Sunset tip %LINK:beaches|Beach% "] },
        etiquette: { heading: " Etiquette Heading ", items: [" Be polite ", " "] },
        faqs: {
          heading: " ",
          items: [
            { summary: " FAQ summary ", body: " FAQ body with %LINK:cheapEats|cheap eats% " },
            { body: " Body only " },
          ],
        },
        drone: { summary: " Drone summary ", body: " Drone body " },
        galleryAlt: ["Primaria", ""],
        galleryFallbackAlt: "Fallback alt",
      },
      "content.sunsetViewpoints.linkLabel": "Punti tramonto",
      "content.positanoBudget.linkLabel": "Budget Positano",
    });

    await withGuideMocks(GUIDE_KEY, async ({ renderRoute }) => {
      await renderRoute({
        route: "/it/guides/positano-instagram-spots",
      });

      const props = getGuideTemplateProps<Record<string, unknown>>();
      if (!props?.articleLead) {
        throw new Error("Guide template props missing articleLead");
      }
      const context = buildContext("it", { hasLocalizedContent: false });
      const articleLead = props.articleLead as (ctx: GuideSeoTemplateContext) => JSX.Element;
      const view = renderWithProviders(articleLead(context));
      expect(view.queryByTestId(`generic-${GUIDE_KEY}`)).toBeNull();
      expect(view.getByRole("heading", { name: "Classics Heading" })).toBeInTheDocument();
      expect(view.getByRole("heading", { name: "Alternative picks" })).toBeInTheDocument();
      expect(view.getByRole("heading", { name: "FAQ fallback" })).toBeInTheDocument();
      expect(view.getByTestId("toc").textContent).toContain("Classics");
      const galleryCall = imageGalleryMock.mock.calls.at(-1)?.[0] as { items?: Array<{ alt: string }> } | undefined;
      expect(galleryCall?.items?.length).toBe(2);
      galleryCall?.items?.forEach((item) => {
        expect(item.alt.trim().length).toBeGreaterThan(0);
      });
    });
  });
});
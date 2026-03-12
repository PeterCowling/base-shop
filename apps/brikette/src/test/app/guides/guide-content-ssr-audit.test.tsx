import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { detectRenderedI18nPlaceholders } from "@tests/utils/detectRenderedI18nPlaceholders";

import { loadGuideI18nBundle } from "@/app/_lib/guide-i18n-bundle";
import GuideContent from "@/app/[lang]/experiences/[slug]/GuideContent";
import { GUIDES_INDEX } from "@/data/guides.index";
import i18n from "@/i18n";
import type { GuideKey } from "@/routes.guides-helpers";

jest.mock("server-only", () => ({}));

jest.mock("react-i18next", () => ({
  useTranslation: (namespace: string, options?: { lng?: string }) => {
    const lang = options?.lng ?? "en";
    return {
      t: i18n.getFixedT(lang, namespace),
      i18n,
    };
  },
}));

jest.mock("@/components/cta/ContentStickyCta", () => ({
  ContentStickyCta: () => null,
}));

jest.mock("@/components/guides/GuideBoundary", () => ({
  GuideBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/guides/PlanChoiceAnalytics", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/routes/guides/_GuideSeoTemplate", () => {
  const { useTranslation } = require("react-i18next") as typeof import("react-i18next");
  const FooterWidgets = require("@/routes/guides/guide-seo/components/FooterWidgets")
    .default as typeof import("@/routes/guides/guide-seo/components/FooterWidgets").default;
  const {
    useDisplayH1Title: useDisplayH1TitleHook,
  } = require("@/routes/guides/guide-seo/useDisplayH1Title") as typeof import("@/routes/guides/guide-seo/useDisplayH1Title");

  function GuideSeoTemplateProbe({
    guideKey,
    metaKey,
  }: {
    guideKey: GuideKey;
    metaKey?: string;
  }) {
    const { t, i18n: runtimeI18n } = useTranslation("guides", {
      lng: "en",
      useSuspense: false,
    });
    const translateGuides = runtimeI18n.getFixedT("en", "guides");
    const displayTitle = useDisplayH1TitleHook({
      metaKey,
      effectiveTitle: undefined,
      guideKey,
      translations: {
        tGuides: t,
        guidesEn: translateGuides,
        translateGuides,
        lang: "en",
      },
      hasLocalizedContent: true,
    });

    return (
      <>
        <h1>{displayTitle}</h1>
        <FooterWidgets
          lang="en"
          guideKey={guideKey}
          showTagChips={false}
          showPlanChoice
          showTransportNotice
          tGuides={t}
        />
      </>
    );
  }

  return {
    __esModule: true,
    default: GuideSeoTemplateProbe,
  };
});

jest.mock("@/components/guides/RelatedGuides", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/guides/TagChips", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

type GuideSection = "experiences" | "assistance" | "howToGetHere";

type GuideSample = {
  guideKey: GuideKey;
  section: GuideSection;
};

const REPRESENTATIVE_SAMPLE_COUNT = 5;

const RAW_HTML_TOKENS = [
  "components.planChoice.title",
  "components.planChoice.options.ferry",
  "components.planChoice.options.trainBus",
  "components.planChoice.options.transfer",
  "transportNotice.title",
  "transportNotice.items.airlink",
] as const;

function getRepresentativeSamples(section: GuideSection): GuideSample[] {
  return GUIDES_INDEX
    .filter((guide) => guide.section === section && guide.status === "live")
    .slice(0, REPRESENTATIVE_SAMPLE_COUNT)
    .map((guide) => ({
      guideKey: guide.key,
      section,
    }));
}

const GUIDE_SAMPLES = [
  ...getRepresentativeSamples("experiences"),
  ...getRepresentativeSamples("assistance"),
  ...getRepresentativeSamples("howToGetHere"),
];

function getBundleString(
  bundle: Record<string, unknown> | undefined,
  path: readonly string[],
): string | undefined {
  let current: unknown = bundle;
  for (const segment of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === "string" && current.trim().length > 0 ? current : undefined;
}

function extractH1Text(html: string): string | undefined {
  const match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return match?.[1]?.trim();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function clearGuidesBundle(lang: string): void {
  if (i18n.hasResourceBundle(lang, "guides")) {
    i18n.removeResourceBundle(lang, "guides");
  }
}

function getEffectiveGuidesBundle(
  serverGuides: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (serverGuides) {
    return serverGuides;
  }

  try {
    return i18n.getResourceBundle("en", "guides") as Record<string, unknown> | undefined;
  } catch {
    return undefined;
  }
}

describe("GuideContent SSR translation audit", () => {
  beforeEach(() => {
    clearGuidesBundle("en");
  });

  afterEach(() => {
    clearGuidesBundle("en");
  });

  it("covers five representative guides per route family", () => {
    expect(getRepresentativeSamples("experiences")).toHaveLength(REPRESENTATIVE_SAMPLE_COUNT);
    expect(getRepresentativeSamples("assistance")).toHaveLength(REPRESENTATIVE_SAMPLE_COUNT);
    expect(getRepresentativeSamples("howToGetHere")).toHaveLength(REPRESENTATIVE_SAMPLE_COUNT);
  });

  it.each(GUIDE_SAMPLES)(
    "renders translated SSR HTML for $section guide $guideKey",
    async ({ guideKey }) => {
      const { serverGuides, serverGuidesEn } = await loadGuideI18nBundle("en", guideKey);
      const effectiveGuides = getEffectiveGuidesBundle(serverGuides);

      const html = renderToString(
        <GuideContent
          lang="en"
          guideKey={guideKey}
          serverGuides={serverGuides}
          serverGuidesEn={serverGuidesEn}
        />,
      );

      const renderedText = stripHtml(html);
      const h1Text = extractH1Text(html);

      expect(effectiveGuides).toBeDefined();
      expect(h1Text).toBeTruthy();
      expect(h1Text).not.toBe(guideKey);
      expect(html).not.toContain(guideKey);

      const expectedPlanChoiceTitle = getBundleString(effectiveGuides, [
        "components",
        "planChoice",
        "title",
      ]);
      const expectedPlanChoiceFerry = getBundleString(effectiveGuides, [
        "components",
        "planChoice",
        "options",
        "ferry",
      ]);
      const expectedPlanChoiceTrainBus = getBundleString(effectiveGuides, [
        "components",
        "planChoice",
        "options",
        "trainBus",
      ]);
      const expectedPlanChoiceTransfer = getBundleString(effectiveGuides, [
        "components",
        "planChoice",
        "options",
        "transfer",
      ]);
      const expectedTransportTitle = getBundleString(effectiveGuides, [
        "transportNotice",
        "title",
      ]);

      expect(expectedPlanChoiceTitle).toBeTruthy();
      expect(expectedPlanChoiceFerry).toBeTruthy();
      expect(expectedPlanChoiceTrainBus).toBeTruthy();
      expect(expectedPlanChoiceTransfer).toBeTruthy();
      expect(expectedTransportTitle).toBeTruthy();

      expect(renderedText).toContain(expectedPlanChoiceTitle as string);
      expect(renderedText).toContain(expectedPlanChoiceFerry as string);
      expect(renderedText).toContain(expectedPlanChoiceTrainBus as string);
      expect(renderedText).toContain(expectedPlanChoiceTransfer as string);
      expect(renderedText).toContain(expectedTransportTitle as string);

      for (const rawToken of RAW_HTML_TOKENS) {
        expect(html).not.toContain(rawToken);
      }

      expect(detectRenderedI18nPlaceholders(renderedText)).toEqual([]);
    },
  );
});

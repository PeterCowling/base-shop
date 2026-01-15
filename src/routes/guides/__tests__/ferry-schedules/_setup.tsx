import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";

import type { TFunction } from "i18next";
import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";
import type { AppLanguage } from "@/i18n.config";

type Namespace = "guides" | "guidesFallback";
type TranslatorOptions = { defaultValue?: unknown; returnObjects?: boolean } | undefined;

const translationStoreRef = vi.hoisted(
  () =>
    ({
      guides: new Map<string, Record<string, unknown>>(),
      guidesFallback: new Map<string, Record<string, unknown>>(),
    }) as Record<Namespace, Map<string, Record<string, unknown>>>,
);

export const translationStore = translationStoreRef;

export function createTranslator(namespace: Namespace, locale: string): TFunction {
  const values = translationStore[namespace].get(locale) ?? {};
  return ((key: string, options: TranslatorOptions = {}) => {
    const value = (values as Record<string, unknown>)[key];
    if (options?.returnObjects) {
      if (value !== undefined) return value;
      if (options.defaultValue !== undefined) return options.defaultValue;
      return [];
    }
    if (value !== undefined) return value;
    if (options?.defaultValue !== undefined) return options.defaultValue;
    return key;
  }) as unknown as TFunction;
}

const getFixedTMockRef = vi.hoisted(() =>
  vi.fn<(locale: string, namespace: Namespace) => TFunction>((locale, namespace) =>
    createTranslator(namespace, locale),
  ),
);

export const getFixedTMock = getFixedTMockRef;

const latestTemplatePropsRef = vi.hoisted(() => ({
  current: null as Record<string, unknown> | null,
}));

export const latestTemplateProps = latestTemplatePropsRef;

vi.mock("@/i18n", () => ({
  __esModule: true,
  default: {
    getFixedT: getFixedTMock,
  },
}));

vi.mock("@/components/guides/TableOfContents", () => ({
  __esModule: true,
  default: ({ title, items }: { title?: string; items: { href: string; label: string }[] }) => (
    <nav data-testid="toc" data-title={title ?? ""}>
      {items.map((item) => (
        <a key={item.href} href={item.href}>
          {item.label}
        </a>
      ))}
    </nav>
  ),
}));

vi.mock("@/components/guides/ImageGallery", () => ({
  __esModule: true,
  default: ({ items }: { items: { src: string; alt: string; caption?: string }[] }) => (
    <div data-testid="image-gallery">
      {items.map((item) => `${item.src}|${item.alt}|${item.caption ?? ""}`).join(";")}
    </div>
  ),
}));

vi.mock("@/components/images/CfImage", () => ({
  __esModule: true,
  CfImage: ({ src, alt }: { src: string; alt: string }) => (
    <img data-testid="cf-image" alt={alt} src={src} />
  ),
}));

vi.mock("@/lib/buildCfImageUrl", () => ({
  __esModule: true,
  default: (path: string, params: Record<string, unknown>) =>
    `${path}?w=${(params as { width: number }).width}&h=${(params as { height: number }).height}`,
}));

vi.mock("@/routes/guides/_GuideSeoTemplate", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    latestTemplatePropsRef.current = props;
    return <div data-testid="guide-template" />;
  },
}));


export function setTranslations(
  namespace: Namespace,
  locale: string,
  values: Record<string, unknown>,
): void {
  if (Object.keys(values).length === 0) {
    translationStore[namespace].delete(locale);
    return;
  }
  translationStore[namespace].set(locale, values);
}

export function clearTranslations(): void {
  translationStore.guides.clear();
  translationStore.guidesFallback.clear();
}

export function buildContext(
  lang: AppLanguage,
  overrides: Partial<GuideSeoTemplateContext> = {},
): GuideSeoTemplateContext {
  const translator = createTranslator("guides", lang) as GuideSeoTemplateContext["translateGuides"];
  return {
    lang,
    guideKey: "ferrySchedules",
    metaKey: "ferrySchedules",
    hasLocalizedContent: false,
    translator,
    translateGuides: translator,
    sections: [],
    intro: [],
    faqs: [],
    toc: [],
    ogImage: { url: "https://example.test/image.jpg", width: 1200, height: 630 },
    article: { title: "Ferry schedules", description: "" },
    canonicalUrl: `https://example.test/${lang}/guides/ferry-schedules`,
    ...overrides,
  } satisfies GuideSeoTemplateContext;
}

export function ensureTemplateProps() {
  if (!latestTemplatePropsRef.current) {
    throw new Error("GuideSeoTemplate props were not captured");
  }
  return latestTemplatePropsRef.current;
}

beforeEach(() => {
  latestTemplatePropsRef.current = null;
  getFixedTMock.mockClear();
  clearTranslations();
});

afterEach(() => {
  cleanup();
});
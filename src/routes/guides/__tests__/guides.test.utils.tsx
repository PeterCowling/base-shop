// src/routes/guides/__tests__/guides.test.utils.tsx
import type { ReactElement } from "react";
import { renderWithProviders } from "@tests/renderers";

// Shared i18n scaffolding and helpers used by the guides fallback tests.

export type NamespaceKey = "guides" | "guidesFallback" | "header" | "translation";
export type TranslationTree = Record<string, unknown>;
export type ResourceStore = Record<string, Record<NamespaceKey, TranslationTree>>;

export const SUPPORTED_NAMESPACES: NamespaceKey[] = [
  "guides",
  "guidesFallback",
  "header",
  "translation",
];

// Allow tests to hoist mocks that share state with these helpers by
// hydrating from a global container if present.
const __GUIDES_TEST__ = (globalThis as any).__GUIDES_TEST__ ??= {};

export const resources: ResourceStore = (__GUIDES_TEST__.resources ??=
  ({} as ResourceStore));
export const currentLanguageRef: { value: string } = (__GUIDES_TEST__.currentLanguageRef ??=
  { value: "en" });
export const guideFaqFallbackResults: Array<{ guideKey: string; result: unknown }> = (
  __GUIDES_TEST__.guideFaqFallbackResults ??= []
);

// Minimal fake i18n object used by mocked useTranslation
export const fakeI18n: Record<string, unknown> = (__GUIDES_TEST__.fakeI18n ??= {
  language: "en",
  languages: ["en", "fr", "it", "de", "es", "ru"],
  changeLanguage: async () => undefined,
  getFixedT: () => () => undefined,
  getResource: () => undefined,
  loadNamespaces: async () => {},
});

export const ensureLang = (lng: string) => {
  const existing = resources[lng];
  if (existing) return existing;
  const next: Record<NamespaceKey, TranslationTree> = {
    guides: {},
    guidesFallback: {},
    header: {},
    translation: {},
  };
  resources[lng] = next;
  return next;
};

export const ensureNamespace = (lng: string, ns: NamespaceKey) => {
  const langBucket = ensureLang(lng);
  return (langBucket[ns] ??= {});
};

export const setNested = (target: TranslationTree, key: string, value: unknown) => {
  const segments = key.split(".");
  let pointer: TranslationTree | unknown = target;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    if (typeof pointer !== "object" || pointer === null) return;
    const container = pointer as TranslationTree;
    pointer = container[segment] ?? (container[segment] = {});
  }
  if (typeof pointer === "object" && pointer !== null) {
    (pointer as TranslationTree)[segments[segments.length - 1]] = value;
  }
};

export const getNested = (target: TranslationTree | undefined, key: string): unknown => {
  if (!target) return undefined;
  const segments = key.split(".");
  let pointer: unknown = target;
  for (const segment of segments) {
    if (typeof pointer !== "object" || pointer === null) return undefined;
    pointer = (pointer as TranslationTree)[segment];
    if (pointer === undefined) return undefined;
  }
  return pointer;
};

export const defineTranslations = (
  lng: string,
  ns: NamespaceKey,
  entries: Record<string, unknown>
) => {
  const bucket = ensureNamespace(lng, ns);
  for (const [key, value] of Object.entries(entries)) {
    setNested(bucket, key, value);
  }
};

export const resolveOptions = (options: unknown): {
  defaultValue?: unknown;
  returnObjects?: boolean;
} => {
  if (typeof options === "string") return { defaultValue: options };
  if (options && typeof options === "object") {
    return options as { defaultValue?: unknown; returnObjects?: boolean };
  }
  return {};
};

export type Translator = (key: string, options?: unknown) => unknown;

export const translatorFactory = (lng: string, ns: NamespaceKey): Translator => {
  return (key, rawOptions) => {
    const options = resolveOptions(rawOptions);
    const source = ensureNamespace(lng, ns);
    const value = getNested(source, key);

    if (options.returnObjects) {
      if (value !== undefined) return value;
      if (options.defaultValue !== undefined) return options.defaultValue;
      return [];
    }

    if (value !== undefined) return value;
    if (options.defaultValue !== undefined) return options.defaultValue;
    return key;
  };
};

export function setLanguage(lng: string) {
  currentLanguageRef.value = lng;
  (fakeI18n as { language?: string }).language = lng;
}

export const resetTranslations = () => {
  for (const key of Object.keys(resources)) {
    delete resources[key as keyof ResourceStore];
  }
  setLanguage("en");
};

export const renderGuide = (ui: ReactElement, route: string) => {
  const [maybeLang] = route.split("/").filter(Boolean);
  if (maybeLang) setLanguage(maybeLang);
  return renderWithProviders(ui, { route });
};

export const commonBeforeEach = () => {
  resetTranslations();
  guideFaqFallbackResults.length = 0;
  defineTranslations("en", "guides", {
    "labels.homeBreadcrumb": "Home",
    "labels.guidesBreadcrumb": "Guides",
    "labels.faqsHeading": "FAQs",
    "breadcrumbs.home": "Home",
    "breadcrumbs.guides": "Guides",
  });
  defineTranslations("en", "header", { home: "Home" });
  defineTranslations("en", "translation", { "meta.twitterCard": "summary_large_image" });
};

// Mock module factories (for use with vi.mock in each test file)
export const mockReactI18next = () => ({
  Trans: ({ t, i18nKey }: { t: Translator; i18nKey: string }) => {
    const resolved = t(i18nKey, { defaultValue: i18nKey });
    return <>{resolved as string}</>;
  },
  useTranslation: (namespace?: string, opts?: { lng?: string }) => {
    const ns: NamespaceKey = SUPPORTED_NAMESPACES.includes(namespace as NamespaceKey)
      ? (namespace as NamespaceKey)
      : "guides";
    const lng = opts?.lng ?? currentLanguageRef.value;
    const t = translatorFactory(lng, ns);
    return { t, i18n: fakeI18n as Record<string, unknown> };
  },
  initReactI18next: { type: "3rdParty", init: () => {} },
});

export const mockI18nModule = () => {
  Object.assign(fakeI18n, {
    language: currentLanguageRef.value,
    languages: ["en", "fr", "it", "de", "es", "ru"],
    changeLanguage: async (lng: string) => {
      setLanguage(lng);
      return translatorFactory(lng, "guides");
    },
    getFixedT: (lng: string, namespace: NamespaceKey) => translatorFactory(lng, namespace),
    getResource: (lng: string, namespace: NamespaceKey, key: string) => {
      const bucket = resources[lng]?.[namespace];
      return getNested(bucket, key);
    },
    loadNamespaces: async () => undefined,
    // Undocumented helper used by buildStructuredFallback() to prefer a
    // direct guidesFallback translator when available. Point it at EN so the
    // compact fallback object shape can be resolved regardless of active lang.
    __tGuidesFallback: ((key: string, options?: unknown) =>
      translatorFactory("en", "guidesFallback")(key, options)) as unknown,
  });
  // Ensure test helpers that avoid importing the i18n module directly can still
  // access the mocked instance (e.g. tests/support/renderers.tsx).
  try {
    (globalThis as any).__VITEST_I18N__ = fakeI18n;
  } catch (error) {
    // Ignore assignment failures when the test environment locks globalThis.
    void error;
  }
  return { __esModule: true, default: fakeI18n };
};

export const mockGenericContent = () => ({
  __esModule: true,
  default: ({ guideKey }: { guideKey: string }) => (
    <div data-testid="generic-content">generic:{guideKey}</div>
  ),
});

export const mockTableOfContents = () => ({
  __esModule: true,
  default: ({ items, title }: { items: { href: string; label: string }[]; title?: string }) => (
    <nav data-testid="table-of-contents">
      {title ? <span data-testid="toc-title">{title}</span> : null}
      <ul>
        {items.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  ),
});

export const mockTagChips = () => ({ __esModule: true, default: () => <div data-testid="tag-chips" /> });
export const mockArticleStructuredData = () => ({ __esModule: true, default: () => null });
export const mockBreadcrumbStructuredData = () => ({ __esModule: true, default: () => null });

export const mockGuideFaqJsonLd = () => ({
  __esModule: true,
  default: ({
    guideKey,
    fallback,
  }: {
    guideKey: string;
    fallback?: (lang: string) => unknown;
  }) => {
    if (typeof fallback === "function") {
      const result = fallback(currentLanguageRef.value);
      guideFaqFallbackResults.push({ guideKey, result });
    }
    return <div data-testid={`guide-faq-json-${guideKey}`} />;
  },
});

export const mockTransportNotice = () => ({ __esModule: true, default: () => <div data-testid="transport-notice" /> });
export const mockAlsoHelpful = () => ({ __esModule: true, default: () => <div data-testid="also-helpful" /> });
export const mockRelatedGuides = () => ({ __esModule: true, default: () => <div data-testid="related-guides" /> });

export const mockImageGallery = () => ({
  __esModule: true,
  default: ({ items }: { items: Array<{ src: string; alt: string; caption?: string }> }) => (
    <div data-testid="image-gallery">
      {items.map((item) => (
        <figure key={item.src}>
          <img alt={item.alt} src={item.src} />
          {item.caption ? <figcaption>{item.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  ),
});
/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2470 authoring page labels are developer-facing */
import { notFound } from "next/navigation";

import { Section } from "@acme/design-system/atoms";

import { toAppLanguage } from "@/app/_lib/i18n-server";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import { isGuideAuthoringEnabled } from "@/routes/guides/guide-authoring/gate";
import { listGuideManifestEntries } from "@/routes/guides/guide-manifest";
import { isPreviewAllowed } from "@/routes/guides/guide-seo/utils/preview";

import GuideEditorWrapper from "./GuideEditorWrapper";

export const dynamic = process.env.OUTPUT_EXPORT ? "force-static" : "force-dynamic";

// Static export: no draft edit pages (they require the Worker for SSR)
export function generateStaticParams() {
  return [];
}

type Props = {
  params: Promise<{ lang: string; guideKey: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const resolvePreviewSearch = (preview: string | string[] | undefined): string | null => {
  if (!preview) return null;
  const value = Array.isArray(preview) ? preview[0] : preview;
  if (!value) return null;
  return `preview=${value}`;
};

const resolveLocaleParam = (
  locale: string | string[] | undefined,
  availableLocales: readonly string[],
): AppLanguage | undefined => {
  if (!locale) return undefined;
  const value = Array.isArray(locale) ? locale[0] : locale;
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return availableLocales.includes(normalized) ? (normalized as AppLanguage) : undefined;
};

export default async function GuideEditPage({ params, searchParams }: Props) {
  const { lang, guideKey } = await params;
  const validLang = toAppLanguage(lang);
  const resolvedSearch = await searchParams;
  const previewSearch = resolvePreviewSearch(resolvedSearch?.preview);

  if (!isGuideAuthoringEnabled() || !isPreviewAllowed(previewSearch)) {
    notFound();
  }

  const entry = listGuideManifestEntries().find((item) => item.key === guideKey);
  if (!entry) {
    notFound();
  }

  const availableLocales = i18nConfig.supportedLngs as AppLanguage[];
  const initialLocale = resolveLocaleParam(resolvedSearch?.locale, availableLocales);

  return (
    <Section
      as="main"
      className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"
    >
      <GuideEditorWrapper
        lang={validLang}
        guideKey={guideKey}
        contentKey={entry.contentKey}
        availableLocales={availableLocales}
        initialLocale={initialLocale}
      />
    </Section>
  );
}

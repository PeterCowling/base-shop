// src/routes/guides/bus-back-from-arienzo-beach.tsx
import { useMemo } from "react";

import { defineGuideRoute } from "./defineGuideRoute";
import { getGuideManifestEntry } from "./guide-manifest";
import { buildBlockTemplate } from "./blocks";
import GuideSeoTemplate from "./_GuideSeoTemplate";
import type { GuideSeoTemplateProps } from "./guide-seo/types";

import ImageGallery from "@/components/guides/ImageGallery";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { useTranslation } from "react-i18next";

import { BASE_URL } from "@/config/site";
import { OG_IMAGE as OG_DIMENSIONS } from "@/utils/headConstants";
import { buildRouteMeta } from "@/utils/routeHead";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";

export const handle = { tags: ["beaches", "bus", "positano"] };

export const GUIDE_KEY = "arienzoBeachBusBack" as const satisfies GuideKey;
export const GUIDE_SLUG = "bus-back-from-arienzo-beach" as const;

const OG_IMAGE = {
  path: "/img/positano-panorama.avif",
  width: 1200,
  height: 630,
  transform: {
    width: 1200,
    height: 630,
    quality: 85,
    format: "auto",
  },
} as const;

const GALLERY_IMAGE = "/img/directions/positano-bus-stop.png";

type GalleryEntry = { alt?: string; caption?: string } | null | undefined;

function mergeTemplateFragments(
  base: Partial<GuideSeoTemplateProps>,
  patch: Partial<GuideSeoTemplateProps>,
): Partial<GuideSeoTemplateProps> {
  if (!patch || Object.keys(patch).length === 0) return { ...base };
  const merged: Partial<GuideSeoTemplateProps> = { ...base, ...patch };
  if (base?.genericContentOptions || patch?.genericContentOptions) {
    merged.genericContentOptions = {
      ...(base?.genericContentOptions ?? {}),
      ...(patch?.genericContentOptions ?? {}),
    };
  }
  if (base?.relatedGuides || patch?.relatedGuides) {
    merged.relatedGuides = {
      ...(base?.relatedGuides ?? {}),
      ...(patch?.relatedGuides ?? {}),
    };
  }
  if (base?.alsoHelpful || patch?.alsoHelpful) {
    merged.alsoHelpful = {
      ...(base?.alsoHelpful ?? {}),
      ...(patch?.alsoHelpful ?? {}),
    };
  }
  return merged;
}

function buildOptionTemplate(entry: ReturnType<typeof getGuideManifestEntry>): Partial<GuideSeoTemplateProps> {
  if (!entry) return {};
  const opts = entry.options ?? {};
  const optionProps: Partial<GuideSeoTemplateProps> = {};
  if (opts.showPlanChoice != null) optionProps.showPlanChoice = opts.showPlanChoice;
  if (opts.showTransportNotice != null) optionProps.showTransportNotice = opts.showTransportNotice;
  if (opts.showTagChips != null) optionProps.showTagChips = opts.showTagChips;
  if (opts.showTocWhenUnlocalized != null) optionProps.showTocWhenUnlocalized = opts.showTocWhenUnlocalized;
  if (opts.suppressTocTitle != null) optionProps.suppressTocTitle = opts.suppressTocTitle;
  if (opts.suppressUnlocalizedFallback != null) optionProps.suppressUnlocalizedFallback = opts.suppressUnlocalizedFallback;
  if (opts.preferManualWhenUnlocalized != null) optionProps.preferManualWhenUnlocalized = opts.preferManualWhenUnlocalized;
  if (opts.renderGenericWhenEmpty != null) optionProps.renderGenericWhenEmpty = opts.renderGenericWhenEmpty;
  if (opts.preferGenericWhenFallback != null) optionProps.preferGenericWhenFallback = opts.preferGenericWhenFallback;
  return optionProps;
}

function normaliseString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function pickGalleryEntry(entries: GalleryEntry[] | undefined): { alt: string; caption: string } | null {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  const candidate = entries[0] ?? {};
  const alt = normaliseString(candidate?.alt);
  const caption = normaliseString(candidate?.caption);
  if (!alt || !caption) return null;
  return { alt, caption };
}

const manifestEntry = getGuideManifestEntry(GUIDE_KEY);
if (!manifestEntry) {
  throw new Error("guide manifest entry missing for arienzoBeachBusBack");
}

const blockTemplate = buildBlockTemplate(manifestEntry);

const nodeEnv = typeof process !== "undefined" ? process.env.NODE_ENV : undefined;
const shouldWarn = nodeEnv !== "production" && nodeEnv !== "test";
if (shouldWarn && blockTemplate.warnings.length > 0) {
  for (const warning of blockTemplate.warnings) {
    console.warn(`[arienzoBeachBusBack] ${warning}`);
  }
}

const optionTemplate = buildOptionTemplate(manifestEntry);
const baseTemplateProps = mergeTemplateFragments(blockTemplate.template, optionTemplate);

const artifacts = defineGuideRoute(manifestEntry, {
  template: () => ({}),
  meta: ({ data }) => {
    const payload = (data ?? {}) as { lang?: AppLanguage };
    const lang = payload.lang ?? (i18nConfig.fallbackLng as AppLanguage);
    const path = `/${lang}/${getSlug("experiences", lang)}/${guideSlug(lang, GUIDE_KEY)}`;
    const image = buildCfImageUrl(OG_IMAGE.path, {
      width: OG_DIMENSIONS.width,
      height: OG_DIMENSIONS.height,
      quality: 85,
      format: "auto",
    });
    const title = `guides.meta.${GUIDE_KEY}.title`;
    const description = `guides.meta.${GUIDE_KEY}.description`;
    return buildRouteMeta({
      lang,
      title,
      description,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: OG_DIMENSIONS.width, height: OG_DIMENSIONS.height },
      ogType: "article",
      includeTwitterUrl: true,
    });
  },
});

function BusBackFromArienzoBeach(): JSX.Element {
  const currentLang = (useCurrentLanguage() ?? i18nConfig.fallbackLng) as AppLanguage;
  const { t, i18n } = useTranslation("guides", { lng: currentLang, useSuspense: false });

  const englishT = useMemo(() => {
    const fixed = typeof i18n?.getFixedT === "function" ? i18n.getFixedT("en", "guides") : undefined;
    if (typeof fixed === "function") {
      return fixed;
    }
    return undefined;
  }, [i18n]);

  const gallery = useMemo(() => {
    const titleKey = `content.${GUIDE_KEY}.gallery.title`;
    const itemsKey = `content.${GUIDE_KEY}.gallery.items`;

    const localTitle = normaliseString(t(titleKey, { defaultValue: "" }) as string | undefined);
    const englishTitle = englishT ? normaliseString(englishT(titleKey, { defaultValue: "" }) as string | undefined) : undefined;
    const fallbackTitle = normaliseString(
      getGuideResource<string | null>(currentLang, titleKey, { includeFallback: true }) ?? undefined,
    );

    const localItems = (t(itemsKey, { returnObjects: true }) as GalleryEntry[] | undefined) ?? [];
    const englishItems = englishT
      ? ((englishT(itemsKey, { returnObjects: true }) as GalleryEntry[] | undefined) ?? [])
      : [];

    const resourceItems =
      englishItems.length === 0
        ? getGuideResource<GalleryEntry[]>(currentLang, itemsKey, { includeFallback: true }) ?? []
        : [];

    const localEntry = pickGalleryEntry(localItems);
    if (localEntry) {
      return {
        title: localTitle ?? englishTitle ?? fallbackTitle,
        item: localEntry,
      };
    }

    if (localItems.length > 0) {
      // Explicit empty values from the active locale – respect translator intent.
      return { title: localTitle ?? englishTitle ?? fallbackTitle, item: null };
    }

    const englishEntry = pickGalleryEntry(englishItems);
    if (englishEntry) {
      return {
        title: englishTitle ?? localTitle ?? fallbackTitle,
        item: englishEntry,
      };
    }

    if (englishItems.length > 0) {
      return { title: englishTitle ?? localTitle ?? fallbackTitle, item: null };
    }

    const fallbackEntry = pickGalleryEntry(resourceItems);
    return {
      title: fallbackTitle ?? localTitle ?? englishTitle,
      item: fallbackEntry,
    };
  }, [currentLang, englishT, t]);

  const articleExtras = useMemo<GuideSeoTemplateProps["articleExtras"]>(() => {
    return () => {
      if (!gallery.item) return null;
      return (
        <section id="gallery" className="space-y-4">
          {gallery.title ? <h2 className="text-xl font-semibold">{gallery.title}</h2> : null}
          <ImageGallery
            items={[
              {
                src: GALLERY_IMAGE,
                alt: gallery.item.alt,
                caption: gallery.item.caption,
              },
            ]}
          />
        </section>
      );
    };
  }, [gallery.item, gallery.title]);

  const templateProps = useMemo(() => {
    const override: Partial<GuideSeoTemplateProps> = {
      ogImage: OG_IMAGE,
      articleExtras,
    };
    return mergeTemplateFragments(baseTemplateProps, override);
  }, [articleExtras]);

  return (
    <GuideSeoTemplate
      guideKey={manifestEntry.key}
      metaKey={manifestEntry.metaKey ?? manifestEntry.key}
      {...templateProps}
    />
  );
}

export default BusBackFromArienzoBeach;
export const clientLoader = artifacts.clientLoader;
export const meta = artifacts.meta;
export const links = artifacts.links;
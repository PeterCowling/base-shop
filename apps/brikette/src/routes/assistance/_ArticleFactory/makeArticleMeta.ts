// src/routes/assistance/_ArticleFactory/makeArticleMeta.ts
import type { MetaFunction } from "react-router";
import { getSlug } from "@/utils/slug";
import { articleSlug, type HelpArticleKey } from "@/routes.assistance-helpers";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { i18nConfig } from "@/i18n.config";
import type { AppLanguage } from "@/i18n.config";
import { DEFAULT_TWITTER_CARD, OG_IMAGE_DIMENSIONS, OG_IMAGE_TRANSFORM } from "./constants";
import { resolveMeta } from "./metaUtils";
import { buildRouteMeta } from "@/utils/routeHead";
import { BASE_URL } from "@/config/site";
import { resolveCanonicalAssistancePath } from "../resolveCanonicalPath";

export function makeArticleMeta(namespace: string): MetaFunction {
  return ({ data, location }) => {
    const d = (data || {}) as { lang?: AppLanguage; title?: string; description?: string; desc?: string };
    const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
    const metaFromLoader = {
      title: (d.title ?? "").trim(),
      description: (d.description ?? d.desc ?? "").trim(),
    };
    const fallbackTitle = resolveMeta(lang, namespace, "meta.title");
    const fallbackDescription = resolveMeta(lang, namespace, "meta.description");
    const title = metaFromLoader.title || fallbackTitle;
    const description = metaFromLoader.description || fallbackDescription;
    const image = buildCfImageUrl("/img/positano-panorama.avif", OG_IMAGE_TRANSFORM);
    const fallbackPath = `/${lang}/${getSlug("assistance", lang)}/${articleSlug(lang, namespace as HelpArticleKey)}`;
    const path = resolveCanonicalAssistancePath({
      fallbackPath,
      locationPathname: location?.pathname ?? null,
    });
    const origin =
      typeof window !== "undefined" && window.location?.origin ? window.location.origin : BASE_URL;
    const url = `${origin}${path}`;
    return buildRouteMeta({
      lang,
      title,
      description,
      url,
      path,
      image: { src: image, width: OG_IMAGE_DIMENSIONS.width, height: OG_IMAGE_DIMENSIONS.height },
      twitterCard: String(DEFAULT_TWITTER_CARD),
      ogType: "article",
    }) as unknown as ReturnType<MetaFunction>;
  };
}

// src/routes/NotFound.tsx
import { type LinksFunction,type MetaFunction } from "react-router";
import { type LoaderFunctionArgs } from "react-router-dom";

import NotFoundView from "@/components/not-found/NotFoundView";
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { langParamSchema } from "@/types/loaderSchemas";
import { OG_IMAGE } from "@/utils/headConstants";
import { resolveI18nMeta } from "@/utils/i18nMeta";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { validateOrThrow } from "@/utils/validate";

const OG_IMAGE_SOURCE = "/img/positano-panorama.avif" as const;

export default NotFoundView;

/* ------------------------------------------------------------------ */
/* 🔌 clientLoader – allowed when ssr:false                            */
/* ------------------------------------------------------------------ */
export async function clientLoader({ request }: LoaderFunctionArgs) {
  const [, seg] = new URL(request.url).pathname.split("/");

  // Narrow to legal locale
  const lang = validateOrThrow(langParamSchema, { lang: seg }, 404).lang as AppLanguage;

  // Defer heavy i18n utilities until the loader runs to keep smoke tests fast.
  const [{ preloadNamespacesWithFallback }, { resolveI18nMeta }] = await Promise.all([
    import("@/utils/loadI18nNs"), // i18n-exempt -- TECH-000 [ttl=2026-12-31] dynamic module identifier; not user-facing copy
    import("@/utils/i18nMeta"), // i18n-exempt -- TECH-000 [ttl=2026-12-31] dynamic module identifier; not user-facing copy
  ]);

  const ns = "notFoundPage";
  await preloadNamespacesWithFallback(lang, [ns]);
  await i18n.changeLanguage(lang);

  const meta = resolveI18nMeta(lang, ns);
  return {
    lang,
    title: meta.title,
    desc: meta.description,
  };
}

/* Route head (meta/links) */
export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const d = (data || {}) as { lang?: AppLanguage; title?: string; desc?: string };
  const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
  const metaFromLoader = {
    title: (d.title ?? "").trim(),
    description: (d.desc ?? "").trim(),
  };
  const fallbackMeta = resolveI18nMeta(lang, "notFoundPage");
  const title = metaFromLoader.title || fallbackMeta.title;
  const description = metaFromLoader.description || fallbackMeta.description;
  const path = `/${lang}/404`;
  const url = `${BASE_URL}${path}`;
  const image = buildCfImageUrl(OG_IMAGE_SOURCE, {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });
  // 404 is not an indexable page
  return buildRouteMeta({
    lang,
    title,
    description,
    url,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
    isPublished: false,
  });
};

export const links: LinksFunction = () => buildRouteLinks();


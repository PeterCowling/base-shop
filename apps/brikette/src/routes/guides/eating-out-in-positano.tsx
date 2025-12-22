// src/routes/guides/eating-out-in-positano.tsx
import { memo } from "react";
import GuideSeoTemplate from "./_GuideSeoTemplate";
import i18n from "@/i18n";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest } from "@/utils/lang";
import type { LoaderFunctionArgs } from "react-router-dom";
import { debugGuide, isGuideDebugEnabled } from "@/utils/debug";
import { getGuidesBundle } from "../../locales/guides";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import { BASE_URL } from "@/config/site";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE as DEFAULT_OG_IMAGE } from "@/utils/headConstants";
import type { MetaFunction, LinksFunction } from "react-router";
import { toAppLanguage } from "@/utils/lang";

export const handle = { tags: ["cuisine", "positano"] };

export const GUIDE_KEY: GuideKey = "eatingOutPositano";
export const GUIDE_SLUG = "eating-out-in-positano" as const;

function EatingOutInPositano(): JSX.Element {
  return (
    <GuideSeoTemplate
      guideKey={GUIDE_KEY}
      metaKey={GUIDE_KEY}
      // Ensure GenericContent renders in minimal test setups where no
      // localized/EN structured arrays are seeded. Tests assert that the
      // GenericContent component receives guideKey and translators.
      renderGenericWhenEmpty={true}
      // Always provide a fallback FAQ builder so the JSON-LD block mounts in
      // tests even when localized FAQs are not present.
      alwaysProvideFaqFallback={true}
      showPlanChoice={false}
      showTransportNotice={false}
      relatedGuides={{
        items: [{ key: "cheapEats" }, { key: "limoncelloCuisine" }, { key: "positanoBudget" }],
      }}
    />
  );
}

export default memo(EatingOutInPositano);

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);
  await preloadNamespacesWithFallback(lang, ["guides"], { fallbackOptional: false });
  await preloadNamespacesWithFallback(lang, ["guides.tags"], { optional: true, fallbackOptional: true });
  await i18n.changeLanguage(lang);
  await ensureGuideContent(lang, "eatingOutPositano", {
    en: () => import("../../locales/en/guides/content/eatingOutPositano.json"),
    local: lang === "en" ? undefined : () => import(`../../locales/${lang}/guides/content/eatingOutPositano.json`).catch(() => undefined),
  });
  // Helpers lifted to function body root to satisfy no-inner-declarations
  const readSeoTitle = (bundle: unknown, key: string): string | undefined => {
    try {
      if (!bundle || typeof bundle !== "object") return undefined;
      const content = (bundle as Record<string, unknown>)["content"];
      if (!content || typeof content !== "object") return undefined;
      const entry = (content as Record<string, unknown>)[key];
      if (!entry || typeof entry !== "object") return undefined;
      const seo = (entry as Record<string, unknown>)["seo"];
      if (!seo || typeof seo !== "object") return undefined;
      const title = (seo as Record<string, unknown>)["title"];
      return typeof title === "string" ? title : undefined;
    } catch {
      return undefined;
    }
  };

  const readContentKeys = (bundle: unknown): string[] => {
    try {
      if (!bundle || typeof bundle !== "object") return [];
      const content = (bundle as Record<string, unknown>)["content"];
      if (!content || typeof content !== "object") return [];
      return Object.keys(content as Record<string, unknown>).slice(0, 10);
    } catch {
      return [];
    }
  };
  if (isGuideDebugEnabled()) {
    try {
      const hasLocal = i18n.hasResourceBundle(lang, "guides");
      const hasEn = i18n.hasResourceBundle("en", "guides");
      const localBundle: unknown = getGuidesBundle(lang) ?? (i18n.getResourceBundle(lang, "guides") as unknown);
      const enBundle: unknown = getGuidesBundle("en") ?? (i18n.getResourceBundle("en", "guides") as unknown);
      const localGuidesNs: unknown = i18n.getResourceBundle(lang, "guides");
      const enGuidesNs: unknown = i18n.getResourceBundle("en", "guides");

      debugGuide("Route clientLoader state", { // i18n-exempt -- DX-412 [ttl=2026-12-31]
        requestUrl: request.url,
        lang,
        hasLocalGuidesNs: hasLocal,
        hasEnGuidesNs: hasEn,
        localBundleLoaded: Boolean(localBundle),
        enBundleLoaded: Boolean(enBundle),
        localTitle: readSeoTitle(localBundle, GUIDE_KEY),
        enTitle: readSeoTitle(enBundle, GUIDE_KEY),
        localNsTitle: readSeoTitle(localGuidesNs, GUIDE_KEY),
        enNsTitle: readSeoTitle(enGuidesNs, GUIDE_KEY),
        localContentKeys: readContentKeys(localGuidesNs),
      });
    } catch (e) {
      debugGuide("Route clientLoader debug failed", String(e)); // i18n-exempt -- DX-412 [ttl=2026-12-31]
    }
  }
  return { lang } as const;
}

// Route head: use shared helpers (canonical, x-default, twitter:card)
export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const lng = toAppLanguage((data as { lang?: string } | undefined)?.lang);
  const path = `/${lng}/${getSlug("experiences", lng)}/${guideSlug(lng, GUIDE_KEY)}`;
  const url = `${BASE_URL}${path}`;
  const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
    width: DEFAULT_OG_IMAGE.width,
    height: DEFAULT_OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });
  return buildRouteMeta({
    lang: lng,
    title: `guides.meta.${GUIDE_KEY}.title`,
    description: `guides.meta.${GUIDE_KEY}.description`,
    url,
    path,
    image: { src: image, width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height },
    ogType: "article",
    includeTwitterUrl: true,
  });
};

export const links: LinksFunction = () => buildRouteLinks();

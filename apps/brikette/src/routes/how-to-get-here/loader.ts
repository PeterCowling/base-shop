import i18n from "@/i18n";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { getRouteDefinition, type RouteDefinition } from "@/lib/how-to-get-here/definitions";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { langFromRequest } from "@/utils/lang";
import { getSlug } from "@/utils/slug";
import type { LoaderFunctionArgs } from "react-router-dom";

import { getContentForRoute } from "./content";
import type { RouteLoaderData } from "./types";
import { ensureGuideContent } from "@/utils/ensureGuideContent";
import type { GuideKey } from "@/routes.guides-helpers";
import { IS_PROD, PREVIEW_TOKEN } from "@/config/env";

const CHIESA_NUOVA_BUS_SLUGS = new Set<string>([
  "amalfi-positano-bus",
  "naples-airport-positano-bus",
  "naples-center-train-bus",
  "ravello-positano-bus",
  "salerno-positano-bus",
  "sorrento-positano-bus",
]);

function shouldIncludeChiesaNuovaDetails(slug: string | undefined): boolean {
  if (!slug) return false;
  return CHIESA_NUOVA_BUS_SLUGS.has(slug);
}

export function resolveHowToRouteSlug(
  params: LoaderFunctionArgs["params"] | undefined,
  request: Request,
  lang: AppLanguage,
): string | undefined {
  const paramSlug = params?.["slug"];
  if (paramSlug) {
    return paramSlug;
  }

  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return undefined;
  }

  const lastSegment = segments[segments.length - 1];
  const howToSlug = getSlug("howToGetHere", lang);
  if (lastSegment === howToSlug) {
    return undefined;
  }

  return lastSegment;
}

export async function clientLoader({ params, request }: LoaderFunctionArgs) {
  const lang = (langFromRequest(request) as AppLanguage) ?? (i18nConfig.fallbackLng as AppLanguage);
  const slug = resolveHowToRouteSlug(params, request, lang);

  if (!slug) {
    // i18n-exempt -- TECH-000 [ttl=2026-12-31] developer error message
    throw new Response("Not Found", { status: 404 });
  }

  const definition = getRouteDefinition(slug);
  if (!definition) {
    // i18n-exempt -- TECH-000 [ttl=2026-12-31] developer error message
    throw new Response("Not Found", { status: 404 });
  }

  // Publication gate: block non-published routes in production unless a valid preview token is supplied
  const isProd = IS_PROD;
  const url = new URL(request.url);
  const previewParam = url.searchParams.get("preview");
  const token = PREVIEW_TOKEN ?? "";
  const isPreviewAllowed = token && previewParam === token;
  const status = (definition as { status?: string }).status ?? "published";
  if (isProd && status !== "published" && !isPreviewAllowed) {
    throw new Response("Not Found", { status: 404 });
  }

  const shouldAttachChiesaNuovaDetails = shouldIncludeChiesaNuovaDetails(slug);

  // Inspect route definition to see if it references any guide keys
  // so we can preload guide namespaces and ensure guide content availability.
  const referencedGuideKeys = collectReferencedGuideKeys(definition);

  const namespaces = new Set<string>(["howToGetHereRoutes"]);
  if (shouldAttachChiesaNuovaDetails || referencedGuideKeys.length > 0) {
    namespaces.add("guides");
    namespaces.add("guidesFallback");
  }

  await preloadNamespacesWithFallback(lang, Array.from(namespaces), { optional: true });
  // Dev-hardening: if the definition links to guides, ensure those per-key
  // content bundles are present so we never render raw i18n keys in
  // development when split bundles hydrate late.
  if (referencedGuideKeys.length > 0) {
    try {
      await Promise.all(
        referencedGuideKeys.map((key) =>
          ensureGuideContent(lang, key, {
            en: () => import(`@/locales/en/guides/content/${key}.json`),
            ...(lang === "en"
              ? {}
              : {
                  local: () =>
                    import(`@/locales/${lang}/guides/content/${key}.json`).catch(() => undefined),
                }),
          }),
        ),
      );
    } catch {
      // Non-fatal – continue; ensureGuideContent already guards internally
    }
  }
  if (typeof i18n.changeLanguage === "function") {
    await i18n.changeLanguage(lang);
  } else {
    (i18n as { language?: string }).language = lang;
  }

  const content = await getContentForRoute(lang, definition.contentKey);
  const howToSlug = getSlug("howToGetHere", lang);
  const guidesSlug = getSlug("guides", lang);

  return {
    lang,
    slug,
    definition,
    content,
    howToSlug,
    guidesSlug,
    showChiesaNuovaDetails: shouldAttachChiesaNuovaDetails,
  } satisfies RouteLoaderData;
}

// Extract any GuideKey references from a route definition (link bindings or lists)
function collectReferencedGuideKeys(definition: RouteDefinition): GuideKey[] {
  const keys = new Set<GuideKey>();

  const maybePush = (candidate: unknown) => {
    const obj = (candidate ?? null) as { type?: string; guideKey?: string } | null;
    if (obj && obj.type === "guide" && typeof obj.guideKey === "string") {
      keys.add(obj.guideKey as GuideKey);
    }
  };

  // Direct link bindings and their placeholders
  for (const binding of definition.linkBindings ?? []) {
    maybePush(binding.linkObject);
    const placeholders = binding.placeholders ?? {};
    for (const value of Object.values(placeholders)) {
      maybePush(value);
    }
  }

  // Link lists
  for (const list of definition.linkLists ?? []) {
    for (const item of list.items ?? []) {
      maybePush(item?.target);
    }
  }

  return Array.from(keys);
}

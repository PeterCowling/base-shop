/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Route manifest path literals are non-UI. */
/* src/routes.tsx */
/* ------------------------------------------------------------------ */
/* Route manifest – no per‑route “prerender” or “ssr” flags; those are */
/* now handled globally in react-router.config.ts above.               */
/* ------------------------------------------------------------------ */

import { index, prefix, route, type RouteConfig } from "@react-router/dev/routes";
import { i18nConfig, type AppLanguage } from "./i18n.config";
// Use namespace import for assistance helpers to tolerate partial test mocks
import * as assistance from "./routes.assistance-helpers";
type AssistanceModule = typeof import("./routes.assistance-helpers");
import type { HelpArticleKey } from "./routes.assistance-helpers";
import { listHowToSlugs } from "./lib/how-to-get-here/definitions";
import { getSlug } from "./utils/slug";
import { guideComponentPath, guideSlug, GUIDE_KEYS } from "./guides/slugs";
import type { GuideKey } from "./guides/slugs";
import { publishedGuideKeysByBase } from "./guides/slugs";
import { buildGuideStatusMap, listGuideManifestEntries, resolveDraftPathSegment } from "./routes/guides/guide-manifest";
import { IS_PROD } from "@/config/env";

/* Root path handled at the edge (functions/index.ts) */

// Derive assistance article file path from the key (kebab‑case filenames)
function articleFilePath(key: HelpArticleKey): string {
  const kebab = key
    // insert hyphen before capitals, then lowercase
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
  return `routes/assistance/${kebab}.tsx`;
}

/* One concrete subtree per supported locale */
const DATA_HOW_TO_ROUTE_SLUGS = listHowToSlugs();

const DEFAULT_LANG = i18nConfig.fallbackLng as AppLanguage;

const MANIFEST_ENTRIES = listGuideManifestEntries();
const MANIFEST_STATUS_MAP = buildGuideStatusMap(MANIFEST_ENTRIES);

const {
  howToGetHere: HOW_TO_GUIDE_KEYS,
  experiences: EXPERIENCE_ROUTE_KEYS,
  assistance: ASSISTANCE_ROUTE_KEYS,
} = publishedGuideKeysByBase(IS_PROD, MANIFEST_STATUS_MAP, MANIFEST_ENTRIES);
const LEGACY_GUIDE_KEYS = Array.from(
  new Set<GuideKey>([...HOW_TO_GUIDE_KEYS, ...EXPERIENCE_ROUTE_KEYS, ...ASSISTANCE_ROUTE_KEYS]),
);

// With template-first publication consolidated, we no longer publish a separate
// "/guides" section. Experience guides live under the locale-specific
// experiences slug, and how-to routes under the how-to-get-here slug.
// Consolidated guide sections; explicit section keys no longer required

// EXPERIENCE_ROUTE_KEYS and ASSISTANCE_ROUTE_KEYS derived via shared helper above

const STATIC_ROUTES = [
  ...DATA_HOW_TO_ROUTE_SLUGS.map((slug) =>
    route(`directions/${slug}`, "routes/how-to-get-here.$slug.tsx", { id: `directions-${slug}` })
  ),
  // API endpoints previously lived under the app router. With `ssr: false`
  // prerendering, route loaders are disallowed, so we exclude them here.
  ...HOW_TO_GUIDE_KEYS.map((key) => {
    const slug = guideSlug(DEFAULT_LANG, key);
    return route(`directions/${slug}`, guideComponentPath(key), {
      id: `directions-${slug}`,
    });
  }),
];

const LOCALISED = i18nConfig.supportedLngs.flatMap((lang) => {
  const roomsSlug = getSlug("rooms", lang);
  const experiencesSlug = getSlug("experiences", lang);
  const howToSlug = getSlug("howToGetHere", lang);
  const dealsSlug = getSlug("deals", lang);
  const careersSlug = getSlug("careers", lang);
  const apartmentSlug = getSlug("apartment", lang);
  const bookSlug = getSlug("book", lang);
  const aboutSlug = getSlug("about", lang);
  const termsSlug = getSlug("terms", lang);
  const breakfastMenuSlug = getSlug("breakfastMenu", lang);
  const barMenuSlug = getSlug("barMenu", lang);
  const assistanceSlug = getSlug("assistance", lang);
  const guidesSlug = getSlug("guides", lang);
  const guidesTagsSlug = getSlug("guidesTags", lang);
  const draftRoutes = MANIFEST_ENTRIES.map((entry) => {
    const draftSegment = resolveDraftPathSegment(entry);
    return route(`draft/${draftSegment}`, guideComponentPath(entry.key), {
      id: `${lang}-draft-${entry.key}`,
    });
  });
  const legacyGuideRoutes = LEGACY_GUIDE_KEYS.map((key) => {
    const slug = guideSlug(lang, key);
    return route(`${guidesSlug}/${slug}`, "routes/guides/legacy-redirect.tsx", {
      id: `${lang}-guides-legacy-${slug}`,
    });
  });

  return prefix(lang, [
    /* ---------- top‑level pages ---------- */
    index("routes/home.tsx", { id: `${lang}-home` }),
    route(roomsSlug, "routes/rooms.tsx", { id: `${lang}-rooms` }),
    route(`${roomsSlug}/:id`, "routes/rooms.$id.tsx", {
      id: `${lang}-room-detail`,
    }),
    route(experiencesSlug, "routes/experiences.tsx", { id: `${lang}-experiences` }),
    ...EXPERIENCE_ROUTE_KEYS.map((key) => {
      const slug = guideSlug(lang, key);
      return route(`${experiencesSlug}/${slug}`, guideComponentPath(key), {
        id: `${lang}-experiences-${slug}`,
      });
    }),
    route(howToSlug, "routes/how-to-get-here.tsx", {
      id: `${lang}-how-to-get-here`,
    }),
    // Place concrete how-to micro-guides before the dynamic $slug route so they shadow it.
    ...HOW_TO_GUIDE_KEYS.map((key) => {
      const slug = guideSlug(lang, key);
      return route(`${howToSlug}/${slug}`, guideComponentPath(key), {
        id: `${lang}-how-to-get-here-${slug}`,
      });
    }),
    // Dynamic catch-all for remaining how-to routes defined in data/how-to-get-here/routes.json
    ...DATA_HOW_TO_ROUTE_SLUGS.map((slug) =>
      route(`${howToSlug}/${slug}`, "routes/how-to-get-here.$slug.tsx", {
        id: `${lang}-how-to-get-here-${slug}`
      })
    ),
    route(dealsSlug, "routes/deals.tsx", { id: `${lang}-deals` }),
    route(careersSlug, "routes/careers.tsx", {
      id: `${lang}-careers`,
    }),
    route(apartmentSlug, "routes/apartment.tsx", { id: `${lang}-apartment` }),
    route(bookSlug, "routes/book.tsx", { id: `${lang}-book` }),
    route(aboutSlug, "routes/about.tsx", { id: `${lang}-about` }),
    route(termsSlug, "routes/terms.tsx", { id: `${lang}-terms` }),
    route("draft", "routes/guides/draft.index.tsx", {
      id: `${lang}-draft-dashboard`,
    }),
    ...draftRoutes,
    // Public breakfast menu (internal page; locale-specific slug)
    route(breakfastMenuSlug, "routes/breakfast-menu.tsx", {
      id: `${lang}-breakfast-menu`,
    }),
    // Public bar menu (internal page; locale-specific slug)
    route(barMenuSlug, "routes/bar-menu.tsx", {
      id: `${lang}-bar-menu`,
    }),

    /* (blog removed) */

    /* ---------- assistance knowledge‑base ---------- */
    // Map article keys → explicit file paths (filenames are kebab‑case)
    route(assistanceSlug, "routes/assistance/layout.tsx", { id: `${lang}-assist-root` }, [
      index("routes/assistance.tsx", { id: `${lang}-assist-ama` }),
      ...(((assistance as Partial<AssistanceModule>).ARTICLE_KEYS as readonly HelpArticleKey[]) ?? [])
        .map((k) =>
          route(
            (assistance as Partial<AssistanceModule>).articleSlug?.(lang, k) ?? String(k),
            articleFilePath(k),
            {
              id: `${lang}-assist-${k}`,
            },
          ),
        ),
      // Assistance guides live alongside articles under the help centre
      ...ASSISTANCE_ROUTE_KEYS.map((key) => {
        const slug = guideSlug(lang, key);
        return route(slug, guideComponentPath(key), { id: `${lang}-assist-${slug}` });
      }),
    ]),

    /* ---------- guides tags under experiences ---------- */
    route(`${experiencesSlug}/${guidesTagsSlug}`, "routes/guides/tags.index.tsx", {
      id: `${lang}-experiences-tags-index`,
    }),
    route(`${experiencesSlug}/${guidesTagsSlug}/:tag`, "routes/guides/tags.$tag.tsx", {
      id: `${lang}-experiences-tag`,
    }),
    ...legacyGuideRoutes,

    /* ---------- manifest-only guide ids (non-navigational) ---------- */
    // Expose a stable `${lang}-guide-${key}` id for every known guide key.
    // These entries intentionally live under an internal path to avoid
    // creating duplicate public routes. They point to a noop component.
    ...((GUIDE_KEYS as readonly GuideKey[]) as GuideKey[]).map((key) =>
      route(`__guides-manifest__/${guideSlug(lang, key)}`, "routes/_manifest-sentinel.tsx", {
        id: `${lang}-guide-${key}`,
      }),
    ),

    /* ---------- locale‑specific 404 ---------- */
    // Explicit 404 path for linking + prerendering
    route("404", "routes/not-found.tsx", { id: `${lang}-404` }),
    // Catch‑all remains to render the same view for unknown paths
    route("*", "routes/not-found.tsx", { id: `${lang}-404-catchall` }),
  ]);
}) satisfies RouteConfig;


export default [...STATIC_ROUTES, ...LOCALISED] satisfies RouteConfig;

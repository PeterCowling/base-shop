// src/middleware.ts
// URL rewriting for localized slugs to canonical paths
import { type NextRequest,NextResponse } from "next/server";

import type { AppLanguage } from "./i18n.config";

// Map of slug-map key -> canonical English path segment
// Used to rewrite localized URLs to canonical paths for App Router
const SLUG_KEY_TO_CANONICAL: Record<string, string> = {
  terms: "terms",
  houseRules: "house-rules",
  privacyPolicy: "privacy-policy",
  cookiePolicy: "cookie-policy",
  about: "about",
  careers: "careers",
  breakfastMenu: "breakfast-menu",
  barMenu: "bar-menu",
};

// Reverse lookup: localized slug -> slug key
// Built dynamically at runtime from SLUGS
function buildLocalizedSlugMap(): Map<string, { key: string; lang: AppLanguage }> {
  const map = new Map<string, { key: string; lang: AppLanguage }>();

  // Import SLUGS inline to avoid bundling issues at edge runtime
  // Note: For edge middleware, we need to inline this data or use a simpler approach
  const SLUGS: Record<string, Record<string, string>> = {
    terms: {
      de: "bedingungen",
      en: "terms",
      es: "terminos-condiciones",
      fr: "conditions-generales",
      it: "termini-condizioni",
      ja: "riyokiyaku",
      ko: "yagwan",
      pt: "termos-condicoes",
      ru: "pravila-usloviya",
      zh: "tiaokuan",
      ar: "shorout",
      hi: "niyam-sharten",
      vi: "dieu-khoan",
      pl: "regulamin",
      sv: "villkor",
      no: "vilkar",
      da: "vilkar",
      hu: "feltetelek",
    },
    houseRules: {
      de: "hausordnung",
      en: "house-rules",
      es: "normas-de-la-casa",
      fr: "reglement-interieur",
      it: "regole-della-casa",
      ja: "house-rules",
      ko: "house-rules",
      pt: "regras-da-casa",
      ru: "pravila-doma",
      zh: "house-rules",
      ar: "qawa3d-almanzil",
      hi: "ghar-ke-niyam",
      vi: "quy-tac-nha",
      pl: "regulamin-domu",
      sv: "husregler",
      no: "husregler",
      da: "husregler",
      hu: "hazirend",
    },
    privacyPolicy: {
      de: "datenschutz",
      en: "privacy-policy",
      es: "politica-privacidad",
      fr: "politique-confidentialite",
      it: "privacy-policy",
      ja: "privacy-policy",
      ko: "privacy-policy",
      pt: "politica-privacidade",
      ru: "politika-konfidentsialnosti",
      zh: "privacy-policy",
      ar: "siyasat-alkhususiya",
      hi: "gopaniyata-niti",
      vi: "chinh-sach-bao-mat",
      pl: "polityka-prywatnosci",
      sv: "integritetspolicy",
      no: "personvernpolicy",
      da: "privatlivspolitik",
      hu: "adatvedelmi-iranyelvek",
    },
    cookiePolicy: {
      de: "cookie-richtlinie",
      en: "cookie-policy",
      es: "politica-cookies",
      fr: "politique-cookies",
      it: "cookie-policy",
      ja: "cookie-policy",
      ko: "cookie-policy",
      pt: "politica-cookies",
      ru: "politika-cookie",
      zh: "cookie-policy",
      ar: "siyasat-cookies",
      hi: "cookie-niti",
      vi: "chinh-sach-cookie",
      pl: "polityka-cookies",
      sv: "cookiepolicy",
      no: "cookie-policy",
      da: "cookiepolitik",
      hu: "cookie-szabalyzat",
    },
    about: {
      de: "uber-uns",
      en: "about",
      es: "sobre-nosotros",
      fr: "a-propos",
      it: "chi-siamo",
      ja: "about",
      ko: "about",
      pt: "sobre-nos",
      ru: "o-nas",
      zh: "about",
      ar: "hawlana",
      hi: "hamare-baare-mein",
      vi: "ve-chung-toi",
      pl: "o-nas",
      sv: "om-oss",
      no: "om-oss",
      da: "om-os",
      hu: "rolunk",
    },
    careers: {
      de: "karriere",
      en: "careers",
      es: "empleo",
      fr: "carrieres",
      it: "lavora-con-noi",
      ja: "careers",
      ko: "careers",
      pt: "carreiras",
      ru: "kariera",
      zh: "careers",
      ar: "wazaif",
      hi: "careers",
      vi: "tuyen-dung",
      pl: "kariera",
      sv: "karriar",
      no: "karriere",
      da: "karriere",
      hu: "karrier",
    },
    breakfastMenu: {
      de: "fruhstuckskarte",
      en: "breakfast-menu",
      es: "menu-desayuno",
      fr: "menu-petit-dejeuner",
      it: "menu-colazione",
      ja: "breakfast-menu",
      ko: "breakfast-menu",
      pt: "menu-cafe-da-manha",
      ru: "menu-zavtrak",
      zh: "breakfast-menu",
      ar: "qaayimat-aliftar",
      hi: "naashta-menu",
      vi: "thuc-don-sang",
      pl: "menu-sniadaniowe",
      sv: "frukostmeny",
      no: "frokostmeny",
      da: "morgenmadsmenu",
      hu: "reggeli-menu",
    },
    barMenu: {
      de: "barkarte",
      en: "bar-menu",
      es: "menu-bar",
      fr: "menu-bar",
      it: "menu-bar",
      ja: "bar-menu",
      ko: "bar-menu",
      pt: "menu-bar",
      ru: "menu-bara",
      zh: "bar-menu",
      ar: "qaayimat-albar",
      hi: "bar-menu",
      vi: "thuc-don-bar",
      pl: "menu-barowe",
      sv: "barmeny",
      no: "barmeny",
      da: "barmenu",
      hu: "bar-menu",
    },
  };

  for (const [key, slugsByLang] of Object.entries(SLUGS)) {
    for (const [lang, slug] of Object.entries(slugsByLang)) {
      // Key is "lang:slug" to handle same slug in different languages
      map.set(`${lang}:${slug}`, { key, lang: lang as AppLanguage });
    }
  }

  return map;
}

// Build map once
const localizedSlugMap = buildLocalizedSlugMap();

// Set of routes that should be handled by App Router (after migration)
// Phase 1 migrations completed - all 8 routes enabled
const APP_ROUTER_ROUTES = new Set<string>([
  "terms",
  "house-rules",
  "privacy-policy",
  "cookie-policy",
  "about",
  "careers",
  "breakfast-menu",
  "bar-menu",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only process paths that look like /lang/slug
  const match = pathname.match(/^\/([a-z]{2})\/([^/]+)\/?$/);
  if (!match) {
    return NextResponse.next();
  }

  const [, lang, slug] = match;

  // Check if this is a localized slug that needs rewriting
  const resolved = localizedSlugMap.get(`${lang}:${slug}`);
  if (!resolved) {
    return NextResponse.next();
  }

  const canonicalPath = SLUG_KEY_TO_CANONICAL[resolved.key];
  if (!canonicalPath) {
    return NextResponse.next();
  }

  // Only rewrite if the canonical path is different AND the route is migrated
  if (slug !== canonicalPath && APP_ROUTER_ROUTES.has(canonicalPath)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${lang}/${canonicalPath}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Match paths that look like /:lang/:slug
  matcher: "/:lang([a-z]{2})/:slug([^/]+)",
};

// src/middleware.ts
// Rewrite localized slugs (e.g. /fr/chambres) to canonical App Router segments
// (e.g. /fr/rooms) while keeping the user-visible URL localized.
//
// This repo intentionally generates localized URLs via `getSlug(...)`, but the
// App Router file structure uses canonical segment names. Middleware is the
// bridge between the two.
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { type AppLanguage,i18nConfig } from "./i18n.config";
import { INTERNAL_SEGMENT_BY_KEY, TOP_LEVEL_SEGMENT_KEYS } from "./routing/sectionSegments";
import { SLUGS } from "./slug-map";

type SlugKey = keyof typeof SLUGS;

const SUPPORTED_LANGS = new Set(
  (i18nConfig.supportedLngs as readonly string[]).map((l) => l.toLowerCase()),
);

// TASK-SEO-3: Build reverse lookup maps for detecting wrong-locale slugs
// These maps allow us to identify English slugs and internal segments that
// should be redirected to the correct localized slug for the current locale.
const ENGLISH_SLUG_TO_KEY = new Map<string, SlugKey>();
const INTERNAL_SEGMENT_TO_KEY = new Map<string, SlugKey>();
const ANY_TOP_LEVEL_SLUG_TO_KEY = new Map<string, SlugKey>();
const AMBIGUOUS_TOP_LEVEL_SLUGS = new Set<string>();
const ASSISTANCE_ROOT_ALIASES = new Set(["hilfezentrum", "pomosh"]);
const EXPLICIT_LEGACY_ROOT_REDIRECTS: Readonly<Record<string, string>> = {
  "de/da": "/de/",
};

for (const key of Object.keys(SLUGS) as SlugKey[]) {
  const englishSlug = SLUGS[key].en.toLowerCase();
  ENGLISH_SLUG_TO_KEY.set(englishSlug, key);

  const internalSegment = INTERNAL_SEGMENT_BY_KEY[key].toLowerCase();
  INTERNAL_SEGMENT_TO_KEY.set(internalSegment, key);
}

for (const key of TOP_LEVEL_SEGMENT_KEYS) {
  const localizedValues = Object.values(SLUGS[key]);
  for (const localizedSlug of localizedValues) {
    const normalized = localizedSlug.toLowerCase();
    const existing = ANY_TOP_LEVEL_SLUG_TO_KEY.get(normalized);
    if (!existing) {
      ANY_TOP_LEVEL_SLUG_TO_KEY.set(normalized, key);
      continue;
    }
    if (existing !== key) {
      AMBIGUOUS_TOP_LEVEL_SLUGS.add(normalized);
    }
  }
}

for (const ambiguousSlug of AMBIGUOUS_TOP_LEVEL_SLUGS) {
  ANY_TOP_LEVEL_SLUG_TO_KEY.delete(ambiguousSlug);
}

function resolveTopLevelKey(lang: AppLanguage, segment: string): SlugKey | null {
  const normalized = segment.toLowerCase();
  // Only check keys that represent the first path segment after /:lang.
  for (const key of TOP_LEVEL_SEGMENT_KEYS) {
    const expected = SLUGS[key][lang];
    if (expected.toLowerCase() === normalized) return key;
  }
  return null;
}

function resolveAnyTopLevelKey(segment: string): SlugKey | undefined {
  return ANY_TOP_LEVEL_SLUG_TO_KEY.get(segment.toLowerCase());
}

type SegmentWithSuffix = {
  core: string;
  suffix: "" | ".txt";
};

function splitSegmentSuffix(segment: string): SegmentWithSuffix {
  if (segment.toLowerCase().endsWith(".txt")) {
    return { core: segment.slice(0, -4), suffix: ".txt" };
  }
  return { core: segment, suffix: "" };
}

function isIgnoredPath(pathname: string): boolean {
  return pathname.startsWith("/_next/") || pathname === "/favicon.ico";
}

function parseLocalizedPath(pathname: string): { appLang: AppLanguage; parts: string[] } | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const lang = parts[0]?.toLowerCase();
  if (!lang || !SUPPORTED_LANGS.has(lang)) return null;
  return { appLang: lang as AppLanguage, parts };
}

function buildRedirectResponse(request: NextRequest, path: string): NextResponse {
  const redirectUrl = new URL(`${path}${request.nextUrl.search}${request.nextUrl.hash}`, request.url);
  return NextResponse.redirect(redirectUrl, 301);
}

function detectWrongTopLevelKey(normalizedTopSegment: string): {
  wrongKey: SlugKey | undefined;
  wrongKeySource: "english" | "internal" | "cross-locale" | null;
} {
  const englishKey = ENGLISH_SLUG_TO_KEY.get(normalizedTopSegment);
  if (englishKey) return { wrongKey: englishKey, wrongKeySource: "english" };

  const internalKey = INTERNAL_SEGMENT_TO_KEY.get(normalizedTopSegment);
  if (internalKey) return { wrongKey: internalKey, wrongKeySource: "internal" };

  const crossLocaleKey = resolveAnyTopLevelKey(normalizedTopSegment);
  if (crossLocaleKey) return { wrongKey: crossLocaleKey, wrongKeySource: "cross-locale" };

  return { wrongKey: undefined, wrongKeySource: null };
}

function handleWrongTopLevelRedirect(params: {
  request: NextRequest;
  appLang: AppLanguage;
  normalizedTopSegment: string;
  topSegmentSuffix: SegmentWithSuffix["suffix"];
  nextParts: string[];
}): NextResponse | null {
  const { request, appLang, normalizedTopSegment, topSegmentSuffix, nextParts } = params;
  const localizedAssistanceSlug = SLUGS.assistance[appLang].toLowerCase();
  if (
    ASSISTANCE_ROOT_ALIASES.has(normalizedTopSegment) &&
    normalizedTopSegment !== localizedAssistanceSlug
  ) {
    const correctedSegment = `${SLUGS.assistance[appLang]}${topSegmentSuffix}`;
    const trailingSlash = topSegmentSuffix ? "" : "/";
    return buildRedirectResponse(request, `/${appLang}/${correctedSegment}${trailingSlash}`);
  }

  const { wrongKey, wrongKeySource } = detectWrongTopLevelKey(normalizedTopSegment);
  if (!wrongKey || !wrongKeySource) return null;

  const correctSlug = SLUGS[wrongKey][appLang];
  if (correctSlug.toLowerCase() === normalizedTopSegment) return null;

  const correctedSegment = `${correctSlug}${topSegmentSuffix}`;
  const trailingSlash = topSegmentSuffix ? "" : "/";
  const shouldDropRemainingPath =
    wrongKey === "assistance" && wrongKeySource === "cross-locale";
  const remainingPath = shouldDropRemainingPath ? "" : nextParts.slice(2).join("/");
  const redirectPath = `/${appLang}/${correctedSegment}${remainingPath ? `/${remainingPath}` : ""}${trailingSlash}`;
  return buildRedirectResponse(request, redirectPath);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore Next internals and obvious static assets.
  if (isIgnoredPath(pathname)) return NextResponse.next();
  const parsedPath = parseLocalizedPath(pathname);
  if (!parsedPath) return NextResponse.next();
  const { appLang, parts } = parsedPath;

  const nextParts = [...parts];
  const originalTopSegment = nextParts[1] ?? "";
  const { core: topSegmentCore, suffix: topSegmentSuffix } = splitSegmentSuffix(originalTopSegment);
  const normalizedTopSegment = topSegmentCore.toLowerCase();

  const explicitLegacyRedirect =
    EXPLICIT_LEGACY_ROOT_REDIRECTS[`${appLang}/${normalizedTopSegment}`];
  if (explicitLegacyRedirect) {
    return buildRedirectResponse(request, explicitLegacyRedirect);
  }

  // Rewrite the first segment (after lang) if it's a localized slug.
  const key = resolveTopLevelKey(appLang, topSegmentCore);
  if (key) {
    // RSC probe requests may include a `.txt` suffix (e.g. /en/help.txt?_rsc=...).
    // App Router routes are segment-based, so we must rewrite to the canonical
    // internal segment without the suffix to avoid deterministic 404 noise.
    nextParts[1] = INTERNAL_SEGMENT_BY_KEY[key];
  } else {
    const redirectResponse = handleWrongTopLevelRedirect({
      request,
      appLang,
      normalizedTopSegment,
      topSegmentSuffix,
      nextParts,
    });
    if (redirectResponse) return redirectResponse;
  }

  // Special-case nested localized segments.
  // Experiences tag pages are generated as /:lang/:experiencesSlug/:tagsSlug/:tag
  // but the App Router route is /:lang/experiences/tags/:tag
  const isExperiences = nextParts[1] === INTERNAL_SEGMENT_BY_KEY.experiences;
  if (isExperiences && nextParts.length >= 3) {
    const tagsSlug = SLUGS.guidesTags[appLang];
    if ((nextParts[2] ?? "").toLowerCase() === tagsSlug.toLowerCase()) {
      nextParts[2] = INTERNAL_SEGMENT_BY_KEY.guidesTags;
    }
  }

  const nextPathname = `/${nextParts.join("/")}`;
  if (nextPathname === pathname) return NextResponse.next();

  const url = new URL(
    nextPathname + request.nextUrl.search + request.nextUrl.hash,
    request.url,
  );
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/:lang([a-z]{2})/:path*"],
};

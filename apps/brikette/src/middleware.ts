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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore Next internals and obvious static assets.
  if (pathname.startsWith("/_next/")) return NextResponse.next();
  if (pathname === "/favicon.ico") return NextResponse.next();

  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return NextResponse.next();

  const lang = parts[0]?.toLowerCase();
  if (!lang || !SUPPORTED_LANGS.has(lang)) return NextResponse.next();

  const appLang = lang as AppLanguage;

  const nextParts = [...parts];
  const originalTopSegment = nextParts[1] ?? "";
  const { core: topSegmentCore, suffix: topSegmentSuffix } = splitSegmentSuffix(originalTopSegment);
  const normalizedTopSegment = topSegmentCore.toLowerCase();

  const explicitLegacyRedirect =
    EXPLICIT_LEGACY_ROOT_REDIRECTS[`${appLang}/${normalizedTopSegment}`];
  if (explicitLegacyRedirect) {
    const redirectUrl = new URL(
      `${explicitLegacyRedirect}${request.nextUrl.search}${request.nextUrl.hash}`,
      request.url,
    );
    return NextResponse.redirect(redirectUrl, 301);
  }

  // Rewrite the first segment (after lang) if it's a localized slug.
  const key = resolveTopLevelKey(appLang, topSegmentCore);
  if (key) {
    // RSC probe requests may include a `.txt` suffix (e.g. /en/help.txt?_rsc=...).
    // App Router routes are segment-based, so we must rewrite to the canonical
    // internal segment without the suffix to avoid deterministic 404 noise.
    nextParts[1] = INTERNAL_SEGMENT_BY_KEY[key];
  } else {
    // TASK-SEO-3: Detect English slug or internal segment in wrong locale
    // If the first segment is NOT a localized slug for this language, check if
    // it's an English slug or internal segment that should be redirected.
    const localizedAssistanceSlug = SLUGS.assistance[appLang].toLowerCase();

    // Legacy assistance roots are normalized to locale assistance index and
    // intentionally drop trailing segments to avoid redirecting to unknown 404 detail paths.
    if (
      ASSISTANCE_ROOT_ALIASES.has(normalizedTopSegment) &&
      normalizedTopSegment !== localizedAssistanceSlug
    ) {
      const correctedSegment = `${SLUGS.assistance[appLang]}${topSegmentSuffix}`;
      const trailingSlash = topSegmentSuffix ? "" : "/";
      const redirectUrl = new URL(
        `/${appLang}/${correctedSegment}${trailingSlash}${request.nextUrl.search}${request.nextUrl.hash}`,
        request.url,
      );
      return NextResponse.redirect(redirectUrl, 301);
    }

    // Check if this is an English slug (e.g., /de/rooms should redirect to /de/zimmer)
    let wrongKey: SlugKey | undefined = ENGLISH_SLUG_TO_KEY.get(normalizedTopSegment);
    let wrongKeySource: "english" | "internal" | "cross-locale" | null = wrongKey
      ? "english"
      : null;

    // Check if this is an internal segment (e.g., /fr/assistance should redirect to /fr/aide)
    if (!wrongKey) {
      wrongKey = INTERNAL_SEGMENT_TO_KEY.get(normalizedTopSegment);
      if (wrongKey) wrongKeySource = "internal";
    }

    // Check if this is a localized slug for another locale (e.g., /it/aide, /ja/zimmer).
    if (!wrongKey) {
      wrongKey = resolveAnyTopLevelKey(normalizedTopSegment);
      if (wrongKey) wrongKeySource = "cross-locale";
    }

    // If found, check if it's different from the current locale's slug
    if (wrongKey) {
      const correctSlug = SLUGS[wrongKey][appLang];
      if (correctSlug.toLowerCase() !== normalizedTopSegment) {
        // Build redirect URL with correct localized slug. Preserve .txt suffixes
        // used by framework prefetch probes (e.g. /en/help.txt).
        const correctedSegment = `${correctSlug}${topSegmentSuffix}`;
        const trailingSlash = topSegmentSuffix ? "" : "/";
        const shouldDropRemainingPath =
          wrongKey === "assistance" && wrongKeySource === "cross-locale";
        const remainingPath = shouldDropRemainingPath ? "" : nextParts.slice(2).join("/");
        const redirectPath = `/${appLang}/${correctedSegment}${remainingPath ? `/${remainingPath}` : ""}${trailingSlash}`;

        // Construct redirect URL preserving query params and hash
        const redirectUrl = new URL(
          redirectPath + request.nextUrl.search + request.nextUrl.hash,
          request.url,
        );

        return NextResponse.redirect(redirectUrl, 301);
      }
    }
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

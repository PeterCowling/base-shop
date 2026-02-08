// src/context/modal/global-modals/LanguageModal.tsx
/* -------------------------------------------------------------------------- */
/*  Language modal container                                                  */
/* -------------------------------------------------------------------------- */

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { LanguageModalCopy, LanguageOption } from "@acme/ui/organisms/modals";

import { IS_DEV } from "@/config/env";
import { useTheme } from "@/hooks/useTheme";
import { guideSlug, resolveGuideKeyFromSlug, type GuideKey } from "@/routes.guides-helpers";
import { INTERNAL_SEGMENT_BY_KEY } from "@/routing/sectionSegments";
import { SLUG_KEYS, SLUGS, type SlugMap } from "@/slug-map";
import { preloadI18nNamespaces } from "@/utils/loadI18nNs";
import { translatePath } from "@/utils/translate-path";

import { CORE_LAYOUT_NAMESPACES, i18nConfig, type AppLanguage } from "../constants";
import { useModal } from "../hooks";
import { LanguageModal } from "../lazy-modals";

type SlugMapKey = keyof SlugMap;

function resolveSlugKeyFromSegment(segment: string | undefined, currentLang: AppLanguage): SlugMapKey | null {
  if (!segment) return null;
  const normalized = segment.toLowerCase();

  const currentLangKey =
    SLUG_KEYS.find((key) => SLUGS[key][currentLang].toLowerCase() === normalized) ?? null;
  if (currentLangKey) return currentLangKey;

  const anyLocalizedKey =
    SLUG_KEYS.find((key) =>
      i18nConfig.supportedLngs.some((lng) => SLUGS[key][lng].toLowerCase() === normalized),
    ) ?? null;
  if (anyLocalizedKey) return anyLocalizedKey;

  const internalEntry =
    (Object.entries(INTERNAL_SEGMENT_BY_KEY) as Array<[SlugMapKey, string]>).find(
      ([, internalSegment]) => internalSegment.toLowerCase() === normalized,
    ) ?? null;

  return internalEntry?.[0] ?? null;
}

function resolveGuideKeyFromPathSegment(
  segment: string | undefined,
  preferredLang: AppLanguage,
): GuideKey | null {
  if (!segment) return null;
  const candidateLangs = [
    preferredLang,
    i18nConfig.fallbackLng as AppLanguage,
    ...((i18nConfig.supportedLngs ?? []) as AppLanguage[]),
  ];
  const visited = new Set<AppLanguage>();

  for (const candidateLang of candidateLangs) {
    if (visited.has(candidateLang)) continue;
    visited.add(candidateLang);
    const key = resolveGuideKeyFromSlug(segment, candidateLang);
    if (key) return key;
  }

  return null;
}

function isGuidesTagSegment(segment: string | undefined): boolean {
  if (!segment) return false;
  const normalized = segment.toLowerCase();
  if (normalized === INTERNAL_SEGMENT_BY_KEY.guidesTags.toLowerCase()) {
    return true;
  }
  return i18nConfig.supportedLngs.some(
    (lng) => SLUGS.guidesTags[lng].toLowerCase() === normalized,
  );
}

function resolveAlternatePathForLanguage(nextLang: AppLanguage): string | null {
  if (typeof document === "undefined") return null;

  const selectors = [
    `link[rel="alternate"][hreflang="${nextLang}"]`,
    `link[rel="alternate"][hreflang="${nextLang.toLowerCase()}"]`,
  ];

  for (const selector of selectors) {
    const candidate = document.head.querySelector(selector) as HTMLLinkElement | null;
    const href = candidate?.getAttribute("href");
    if (!href) continue;
    try {
      const parsed = new URL(href, window.location.origin);
      const path = parsed.pathname;
      const normalizedPath = path === "/" ? path : path.replace(/\/+$/, "");
      if (normalizedPath === `/${nextLang}` || normalizedPath.startsWith(`/${nextLang}/`)) {
        return normalizedPath;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function LanguageGlobalModal(): JSX.Element | null {
  const { closeModal } = useModal();
  const { isDark } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Build a location-like object for compatibility
  const search = searchParams?.toString();
  const location = {
    pathname: pathname ?? "/",
    search: search ? `?${search}` : "",
    hash: typeof window !== "undefined" ? window.location.hash : "",
  };
  const navigate = useCallback((path: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  }, [router]);

  const { t: tModals, i18n } = useTranslation("modals");

  const pathSegments = location.pathname.split("/").filter(Boolean);

  const curLang: AppLanguage = (() => {
    const first = pathSegments[0];
    return i18nConfig.supportedLngs.includes(first as AppLanguage)
      ? (first as AppLanguage)
      : (i18nConfig.fallbackLng as AppLanguage);
  })();

  const slugKey = resolveSlugKeyFromSegment(pathSegments[1], curLang);

  const candidates = [
    i18nConfig.fallbackLng as AppLanguage,
    ...((i18nConfig.supportedLngs ?? []) as AppLanguage[]),
  ];
  if (!candidates.includes(curLang)) {
    candidates.unshift(curLang);
  }
  const languageOptions: LanguageOption[] = Array.from(new Set(candidates)).map((lng) => {
    let label = lng.toUpperCase();
    if (typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function") {
      try {
        const display = new Intl.DisplayNames([lng], { type: "language" });
        const resolved = display.of(lng);
        if (resolved) {
          const [firstGrapheme, ...rest] = Array.from(resolved);
          if (firstGrapheme) {
            label = `${firstGrapheme.toLocaleUpperCase(lng)}${rest.join("")}`;
          }
        }
      } catch {
        label = lng.toUpperCase();
      }
    }
    return { code: lng, label };
  });

  const languageCopy: LanguageModalCopy = {
    title: tModals("language.title"),
    closeLabel: tModals("language.close"),
  };

  const warmLayoutNamespaces = useCallback(async (target: AppLanguage): Promise<void> => {
    try {
      await preloadI18nNamespaces(target, CORE_LAYOUT_NAMESPACES);
    } catch (error) {
      if (IS_DEV) {
        console.error({ scope: "LanguageModal", event: "preloadLayoutNamespacesFailure", error });
      }
    }
  }, []);

  const changeLanguage = useCallback(
    async (nextLang: AppLanguage): Promise<void> => {
      await Promise.all([i18n.changeLanguage(nextLang), warmLayoutNamespaces(nextLang)]);
      if (nextLang === curLang) {
        closeModal();
        return;
      }

      const basePath = (() => {
        const alternatePath = resolveAlternatePathForLanguage(nextLang);
        if (alternatePath) {
          return alternatePath;
        }

        const rawSegments = location.pathname.split("/").filter(Boolean);
        const hasLangPrefix = i18nConfig.supportedLngs.includes(rawSegments[0] as AppLanguage);
        const remainder = hasLangPrefix ? rawSegments.slice(1) : rawSegments;

        const nextSegments: string[] = [nextLang];

        if (slugKey) {
          const translatedSlug = translatePath(slugKey, nextLang);
          nextSegments.push(translatedSlug);

          const trailingSegments = remainder.slice(1);

          if (slugKey === "experiences" && trailingSegments.length > 0) {
            const currentSecond = trailingSegments[0] ?? "";
            if (isGuidesTagSegment(currentSecond)) {
              nextSegments.push(translatePath("guidesTags", nextLang));
              nextSegments.push(...trailingSegments.slice(1));
              return nextSegments.length > 0 ? `/${nextSegments.filter(Boolean).join("/")}` : "/";
            }
            const matchedGuideKey = resolveGuideKeyFromPathSegment(currentSecond, curLang);
            if (matchedGuideKey) {
              nextSegments.push(guideSlug(nextLang, matchedGuideKey));
              nextSegments.push(...trailingSegments.slice(1));
            } else {
              nextSegments.push(...trailingSegments);
            }
          } else if (
            (slugKey === "assistance" || slugKey === "guides" || slugKey === "howToGetHere") &&
            trailingSegments.length > 0
          ) {
            const currentSecond = trailingSegments[0] ?? "";
            const matchedGuideKey = resolveGuideKeyFromPathSegment(currentSecond, curLang);
            if (matchedGuideKey) {
              nextSegments.push(guideSlug(nextLang, matchedGuideKey));
              nextSegments.push(...trailingSegments.slice(1));
            } else {
              nextSegments.push(...trailingSegments);
            }
          } else {
            // Assistance index or other pages — keep trailing segments as-is
            nextSegments.push(...trailingSegments);
          }
        } else {
          nextSegments.push(...remainder);
        }

        return nextSegments.length > 0 ? `/${nextSegments.filter(Boolean).join("/")}` : "/";
      })();

      navigate(`${basePath}${location.search}${location.hash}`, { replace: true });
      closeModal();
    },
    [closeModal, curLang, i18n, location, navigate, slugKey, warmLayoutNamespaces],
  );

  return (
    <LanguageModal
      isOpen
      onClose={closeModal}
      options={languageOptions}
      currentCode={curLang}
      onSelect={(code) => changeLanguage(code as AppLanguage)}
      copy={languageCopy}
      theme={isDark ? "dark" : "light"}
    />
  );
}

// src/context/modal/global-modals/LanguageModal.tsx
/* -------------------------------------------------------------------------- */
/*  Language modal container                                                  */
/* -------------------------------------------------------------------------- */

import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/hooks/useTheme";
import { preloadI18nNamespaces } from "@/utils/loadI18nNs";
import { translatePath } from "@/utils/translate-path";
import { articleSlug, type HelpArticleKey } from "@/routes.assistance-helpers";
import { GUIDE_KEYS, guideSlug } from "@/routes.guides-helpers";
import { HELP_ARTICLE_KEYS } from "@/components/assistance/HelpCentreNav";
import { SLUGS, SLUG_KEYS, type SlugMap } from "@/slug-map";
import { IS_DEV } from "@/config/env";

import { LanguageModal } from "../lazy-modals";
import { useModal } from "../hooks";
import { useSafeLocation, useSafeNavigate } from "../navigation";
import { CORE_LAYOUT_NAMESPACES, LANGUAGE_ORDER, i18nConfig, type AppLanguage } from "../constants";
import type { LanguageModalCopy, LanguageOption } from "@acme/ui/organisms/modals";

export function LanguageGlobalModal(): JSX.Element | null {
  const { closeModal } = useModal();
  const { theme } = useTheme();
  const navigate = useSafeNavigate();
  const location = useSafeLocation();

  const { t: tModals, i18n, ready: modalsReady } = useTranslation("modals");

  const pathSegments = useMemo(() => location.pathname.split("/").filter(Boolean), [location.pathname]);

  const curLang = useMemo<AppLanguage>(() => {
    const first = pathSegments[0];
    return i18nConfig.supportedLngs.includes(first as AppLanguage)
      ? (first as AppLanguage)
      : (i18nConfig.fallbackLng as AppLanguage);
  }, [pathSegments]);

  const slugKey = useMemo<keyof SlugMap | null>(() => {
    const maybe = pathSegments[1];
    return (
      SLUG_KEYS.find((key) => i18nConfig.supportedLngs.some((lng) => SLUGS[key][lng] === maybe)) ?? null
    );
  }, [pathSegments]);

  const articleKey = useMemo<HelpArticleKey | null>(() => {
    if (slugKey !== "assistance") return null;
    const slugSegment = pathSegments[2];
    if (!slugSegment) {
      return HELP_ARTICLE_KEYS[0] ?? null;
    }
    return HELP_ARTICLE_KEYS.find((key) => articleSlug(curLang, key) === slugSegment) ?? null;
  }, [slugKey, pathSegments, curLang]);

  const languageOptions = useMemo<LanguageOption[]>(() => {
    return LANGUAGE_ORDER.map((lng) => {
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
  }, []);

  const languageCopy = useMemo<LanguageModalCopy>(() => {
    const base: LanguageModalCopy = {
      title: tModals("language.title"),
      closeLabel: tModals("language.close"),
    };
    if (!modalsReady) return { ...base };
    return base;
  }, [modalsReady, tModals]);

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
        const rawSegments = location.pathname.split("/").filter(Boolean);
        const hasLangPrefix = i18nConfig.supportedLngs.includes(rawSegments[0] as AppLanguage);
        const remainder = hasLangPrefix ? rawSegments.slice(1) : rawSegments;

        const nextSegments: string[] = [nextLang];

        if (slugKey) {
          const translatedSlug = translatePath(slugKey, nextLang);
          nextSegments.push(translatedSlug);

          const trailingSegments = remainder.slice(1);

          if (slugKey === "assistance" && articleKey) {
            nextSegments.push(articleSlug(nextLang, articleKey));
            nextSegments.push(...trailingSegments.slice(1));
          } else if (
            (slugKey === "guides" || slugKey === "experiences" || slugKey === "howToGetHere") &&
            trailingSegments.length > 0
          ) {
            const currentSecond = trailingSegments[0] ?? "";
            const matchedGuideKey = GUIDE_KEYS.find((k) => guideSlug(curLang, k) === currentSecond);
            if (matchedGuideKey) {
              nextSegments.push(guideSlug(nextLang, matchedGuideKey));
              nextSegments.push(...trailingSegments.slice(1));
            } else {
              nextSegments.push(...trailingSegments);
            }
          } else {
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
    [articleKey, closeModal, curLang, i18n, location, navigate, slugKey, warmLayoutNamespaces],
  );

  return (
    <LanguageModal
      isOpen
      onClose={closeModal}
      options={languageOptions}
      currentCode={curLang}
      onSelect={(code) => changeLanguage(code as AppLanguage)}
      copy={languageCopy}
      theme={theme}
    />
  );
}

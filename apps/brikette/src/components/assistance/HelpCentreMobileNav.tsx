/* file path: src/components/assistance/HelpCentreMobileNav.tsx */
/* Mobile drawer – visible below lg (1024 px) */

import { memo, type ReactNode, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import HelpCentreMobileNavUI, {
  type AssistanceMobileNavItem,
  type HelpCentreMobileNavCopy,
} from "@acme/ui/organisms/HelpCentreMobileNav";

import { useBannerHeightOrZero } from "@/context/NotificationBannerContext";
import { ASSISTANCE_GUIDE_KEYS } from "@/data/assistanceGuideKeys";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { useHelpDrawer } from "@/hooks/useHelpDrawer";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import assistanceFallback from "@/locales/en/assistanceCommon.json";
import { type GuideKey,guideSlug } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";

/* ── helpers ─────────────────────────────────────────────────── */
type CurrentKey = GuideKey;

const FALLBACK_LANGUAGE: AppLanguage = (() => {
  const raw = i18nConfig.fallbackLng;
  if (typeof raw === "string") return raw as AppLanguage;
  if (Array.isArray(raw)) return (raw[0] ?? "en") as AppLanguage;
  if (raw && typeof raw === "object") {
    const value = (raw as Record<string, unknown>)["default"];
    if (typeof value === "string") return value as AppLanguage;
    if (Array.isArray(value)) return (value[0] ?? "en") as AppLanguage;
  }
  return "en" as AppLanguage;
})();

const getDictionaryValue = (rawKey: string): string | undefined => {
  const segments = rawKey.split(".").filter(Boolean);
  let cursor: unknown = assistanceFallback;

  for (const segment of segments) {
    if (typeof cursor !== "object" || cursor === null) {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[segment];
  }

  return typeof cursor === "string" ? cursor : undefined;
};

const humanizeKey = (key: string): string => {
  const segment = key.split(".").pop() ?? key;
  const withSpaces = segment
    .replace(/[_-]+/g, " ")
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  if (!withSpaces) return segment;
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
};

interface Props {
  currentKey: CurrentKey;
  className?: string;
  lang?: AppLanguage;
}

function HelpCentreMobileNav({ currentKey, className = "", lang: explicitLang }: Props) {
  const { open, toggle } = useHelpDrawer();
  const fallbackLang = useCurrentLanguage();
  const lang = explicitLang ?? fallbackLang;
  const pathname = usePathname() ?? "";
  const { t, i18n } = useTranslation("assistanceCommon", { lng: lang });
  const bannerHeight = useBannerHeightOrZero();

  const fallbackT = (() => {
    try {
      return i18n.getFixedT(FALLBACK_LANGUAGE, "assistanceCommon");
    } catch {
      return null;
    }
  })();

  const translate = useCallback(
    (key: string, fallbackFactory?: (rawKey: string) => string): string => {
      const primary = (t(key) as string) ?? "";
      if (primary && primary !== key) return primary;

      const fallbackValue = fallbackT ? ((fallbackT(key) as string) ?? "") : "";
      if (fallbackValue && fallbackValue !== key) return fallbackValue;

      const dictionaryFallback = getDictionaryValue(key);
      if (dictionaryFallback) return dictionaryFallback;

      const derived = fallbackFactory ? fallbackFactory(key) : humanizeKey(key);
      return derived;
    },
    [fallbackT, t],
  );

  const copy: HelpCentreMobileNavCopy = {
    openLabel: translate("openSidebar"),
    closeLabel: translate("closeSidebar"),
    navLabel: translate("mobileSidebarLabel"),
    hintLabel: translate("mobileHint"),
  };

  const root = `/${lang}/${getSlug("assistance", lang)}`;

  const items: AssistanceMobileNavItem[] = ASSISTANCE_GUIDE_KEYS.map((key) => {
    const slug = guideSlug(lang, key);
    const href = `${root}/${slug}`;
    return {
      key,
      label: translate(`nav.${key}`, humanizeKey),
      href,
      isActive: currentKey === key || pathname === href,
    } satisfies AssistanceMobileNavItem;
  });

  const renderLink = useCallback(
    ({ item, highlighted: _highlighted, children }: {
      item: AssistanceMobileNavItem;
      highlighted: boolean;
      children: ReactNode;
    }) => (
      <Link
        href={item.href}
        aria-current={item.isActive ? "page" : undefined}
        className={clsx(
          "flex",
          "items-center",
          "justify-between",
          "rounded-lg",
          "px-4",
          "py-3",
          "text-brand-text",
          "transition-colors",
          {
            "bg-brand-primary/10": item.isActive,
            "font-semibold": item.isActive,
            "bg-transparent": !item.isActive,
          },
          "hover:bg-brand-primary/15",
        )}
      >
        {children}
      </Link>
    ),
    [],
  );

  return (
    <HelpCentreMobileNavUI
      items={items}
      isOpen={open}
      onToggle={toggle}
      copy={copy}
      className={className}
      bannerHeight={bannerHeight}
      renderLink={({ item, highlighted, children }) => renderLink({ item, highlighted, children })}
    />
  );
}

export default memo(HelpCentreMobileNav);

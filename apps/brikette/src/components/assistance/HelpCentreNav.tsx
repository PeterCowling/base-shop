/* file path: src/components/assistance/HelpCentreNav.tsx */
/* Desktop drawer – visible from ≥ lg (1024 px) */

import { memo, type ReactNode, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Bus, CalendarDays, Clock, CreditCard, FileText, IdCard, Info, MapPin, Scale, ShieldCheck, Undo2, Wrench } from "lucide-react";

import HelpCentreNavUI, { type AssistanceNavItem } from "@acme/ui/organisms/HelpCentreNav";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { useHelpDrawer } from "@/hooks/useHelpDrawer";
import type { AppLanguage } from "@/i18n.config";
import type { HelpArticleKey } from "@/routes.assistance-helpers";
// Namespace import to tolerate partial mocks
import * as assistance from "@/routes.assistance-helpers";
import { getSlug } from "@/utils/slug";

/* ── static helpers ─────────────────────────────────────────── */
type IconComponent = typeof IdCard;

const ICONS: Record<HelpArticleKey, IconComponent> = {
  ageAccessibility: IdCard,
  bookingBasics: CalendarDays,
  changingCancelling: Undo2,
  checkinCheckout: Clock,
  defectsDamages: Wrench,
  depositsPayments: CreditCard,
  rules: FileText,
  security: ShieldCheck,
  legal: Scale,
  arrivingByFerry: Info,
  naplesAirportBus: Bus,
  travelHelp: MapPin,
};

const defaultLabel = (key: string): string =>
  key
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/^./, (s) => s.toUpperCase());

// Note: Avoid hardcoded UI copy here. Keys must exist in
// src/locales/<lang>/assistanceCommon.json and are resolved via i18n.

interface Props {
  currentKey: HelpArticleKey;
  className?: string;
  lang?: AppLanguage;
}

function HelpCentreNav({ currentKey, className = "lg:w-80", lang: explicitLang }: Props) {
  const { open, toggle } = useHelpDrawer();
  const fallbackLang = useCurrentLanguage();
  const lang = explicitLang ?? fallbackLang;
  const pathname = usePathname();
  const { t, i18n } = useTranslation("assistanceCommon", { lng: lang });

  const fallbackT = (() => {
    try {
      return i18n.getFixedT("en", "assistanceCommon");
    } catch {
      return null;
    }
  })();

  const translate = useCallback(
    (key: string, fallback: () => string): string => {
      const primary = (t(key) as string) ?? "";
      if (primary && primary !== key) {
        return primary;
      }

      const english = fallbackT ? ((fallbackT(key) as string) ?? "") : "";
      if (english && english !== key) {
        return english;
      }

      return fallback();
    },
    [fallbackT, t],
  );

  const openLabel = translate("openSidebar", () => defaultLabel("openSidebar"));
  const closeLabel = translate("closeSidebar", () => defaultLabel("closeSidebar"));
  const sidebarLabel = translate("sidebarLabel", () => defaultLabel("sidebarLabel"));

  const root = `/${lang}/${getSlug("assistance", lang)}`;

  type AssistanceModule = typeof assistance;
  const keys: readonly HelpArticleKey[] =
    ((assistance as Partial<AssistanceModule>).ARTICLE_KEYS ?? []) as readonly HelpArticleKey[];
  const toSlug = (assistance as Partial<AssistanceModule>).articleSlug;
  const items = keys.map((key) => ({
    key,
    label: translate(`nav.${key}`, () => defaultLabel(key)),
    href: `${root}/${toSlug ? toSlug(lang, key) : String(key)}`,
    icon: ICONS[key],
    isActive: currentKey === key,
  }));

  const linkClasses = useCallback(
    (highlighted: boolean): string =>
      clsx(
        "group",
        "flex",
        "items-center",
        "gap-3",
        "rounded-md",
        "px-3",
        "py-2",
        "pr-[40px]",
        highlighted
          ? ["font-semibold", "text-brand-primary", "dark:text-brand-secondary"]
          : ["text-brand-text", "dark:text-brand-text"],
        "hover:bg-brand-surface/60",
        "dark:hover:bg-brand-text/60",
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-brand-primary",
        "transition-colors",
      ),
    [],
  );

  const renderLink = useCallback(
    ({ item, highlighted, defaultClassName: _defaultClassName, children }: {
      item: AssistanceNavItem;
      highlighted: boolean;
      defaultClassName: string;
      children: ReactNode;
    }) => {
      const isActive = pathname === item.href || (pathname?.startsWith(`${item.href}/`) ?? false);
      return (
        <Link
          href={item.href}
          prefetch={true}
          className={linkClasses(highlighted || isActive)}
          aria-current={isActive ? "page" : undefined}
        >
          {children}
        </Link>
      );
    },
    [linkClasses, pathname],
  );

  return (
    <HelpCentreNavUI
      items={items}
      isOpen={open}
      onToggle={toggle}
      sidebarLabel={sidebarLabel}
      openLabel={openLabel}
      closeLabel={closeLabel}
      className={className}
      renderLink={({ item, highlighted, defaultClassName, children }) =>
        renderLink({ item, highlighted, defaultClassName, children })
      }
    />
  );
}

type AssistanceModule = typeof assistance;
export const HELP_ARTICLE_KEYS: readonly HelpArticleKey[] =
  ((assistance as Partial<AssistanceModule>).ARTICLE_KEYS ?? []) as readonly HelpArticleKey[];
export type { HelpArticleKey };
export default memo(HelpCentreNav);

// src: packages/ui/src/organisms/MobileNav.tsx
// Fixed top bar – burger button toggles MobileMenu (visible below lg)
import { Menu, X } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useModal } from "@ui/context/ModalContext";
import { useCurrentLanguage } from "@ui/hooks/useCurrentLanguage";
import { useTheme } from "@ui/hooks/useTheme";
import { i18nConfig, type AppLanguage } from "@ui/i18n.config";
import { resolvePrimaryCtaLabel } from "../shared";

const logoIcon = "/img/hostel_brikette_icon.png"; // original raster – small icon
const FALLBACK_PRIMARY_CTA_LABEL =
  /* i18n-exempt -- UI-1000 ttl=2026-12-31 fallback copy until tokens are wired. */
  "Check availability";
const FALLBACK_TOGGLE_LABEL =
  /* i18n-exempt -- UI-1000 ttl=2026-12-31 fallback aria label. */
  "Toggle menu";

interface Props {
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  lang?: AppLanguage;
  bannerHeight?: number;
}

function MobileNav({ menuOpen, setMenuOpen, lang: explicitLang, bannerHeight = 0 }: Props): JSX.Element {
  const fallbackLang = useCurrentLanguage();
  const { i18n: i18nextInstance } = useTranslation();
  const i18nLanguage = i18nextInstance?.language;
  const normalizedI18nLang = useMemo(() => {
    const raw = i18nLanguage?.toLowerCase();
    if (!raw) return undefined;
    const base = raw.split("-")[0] as AppLanguage | undefined;
    return base && i18nConfig.supportedLngs.includes(base) ? base : undefined;
  }, [i18nLanguage]);
  const lang = normalizedI18nLang ?? explicitLang ?? fallbackLang;
  const { t, ready } = useTranslation("header", { lng: lang });
  const { t: tTokens, ready: tokensReady } = useTranslation("_tokens", { lng: lang });
  const { openModal } = useModal();
  const { theme } = useTheme();

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), [setMenuOpen]);
  const openBooking = useCallback(() => openModal("booking"), [openModal]);
  const ctaClass = useMemo(() => (theme === "dark" ? "cta-dark" : "cta-light"), [theme]);
  const primaryCtaLabel = useMemo(() => {
    if (!ready && !tokensReady) {
      return FALLBACK_PRIMARY_CTA_LABEL;
    }
    return resolvePrimaryCtaLabel(tTokens, { fallback: FALLBACK_PRIMARY_CTA_LABEL }) ?? FALLBACK_PRIMARY_CTA_LABEL;
  }, [tTokens, ready, tokensReady]);

  return (
    <nav
      data-testid="mobile-nav"
      className="fixed inset-x-0 z-50 h-16 bg-header-gradient px-3 py-3 shadow lg:hidden sm:px-4"
      // eslint-disable-next-line react/forbid-dom-props -- UI-1000 ttl=2026-12-31 banner offset is runtime-calculated.
      style={{ top: bannerHeight }}
    >
      <div className="flex h-full w-full items-center gap-2">
        {/* Logo → home */}
        <Link
          to={`/${lang}`}
          prefetch="intent"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- UI-1000 [ttl=2026-12-31] UI package is not Next-only; icon is a local static asset */}
          <img
            src={logoIcon}
            alt={t("logoAlt")}
            className="size-10"
            width={40}
            height={40}
            loading="eager"
            decoding="async"
          />
          <span className="hidden text-lg font-bold text-brand-heading sm:inline">
            {t("title")}
          </span>
        </Link>

        {/* Reserve CTA */}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={openBooking}
            className={`min-h-10 min-w-10 whitespace-nowrap px-3 py-2 text-xs font-semibold ${ctaClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary sm:px-4 sm:text-sm`}
          >
            {primaryCtaLabel}
          </button>
        </div>

        {/* Burger / X toggler */}
        <button
          type="button"
          aria-label={(() => {
            const toggle = t("toggleMenu") as string;
            if (toggle && toggle !== "toggleMenu") return toggle;
            const menu = t("siteMenu") as string;
            if (menu && menu !== "siteMenu") return menu;
            return FALLBACK_TOGGLE_LABEL;
          })()}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          data-testid="menu-toggle"
          onClick={toggleMenu}
          className="justify-self-end size-10 rounded p-2 transition hover:bg-brand-bg/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          {menuOpen ? (
            <X className="size-6 text-brand-heading" data-testid="lucide-x" aria-hidden />
          ) : (
            <Menu className="size-6 text-brand-heading" data-testid="lucide-menu" aria-hidden />
          )}
        </button>
      </div>

      {/* subtle bottom divider */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-brand-surface/60 dark:bg-white/5" />
    </nav>
  );
}

export default memo(MobileNav);
export { MobileNav };

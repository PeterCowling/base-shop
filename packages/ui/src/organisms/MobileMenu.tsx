// src: packages/ui/src/organisms/MobileMenu.tsx
import { memo, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import clsx from "clsx";
import FocusTrap, { type FocusTrapProps } from "focus-trap-react";

import { useCurrentLanguage } from "../hooks/useCurrentLanguage";
import type { AppLanguage } from "../i18n.config";
import { i18nConfig } from "../i18n.config";
import { LanguageSwitcher } from "../molecules/LanguageSwitcher";
import { ThemeToggle } from "../molecules/ThemeToggle";
import { buildNavLinks, type TranslateFn } from "../utils/buildNavLinks";

interface Props {
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  lang?: AppLanguage;
  bannerHeight?: number;
}

const MOBILE_NAV_HEIGHT = 64;

function MobileMenu({ menuOpen, setMenuOpen, lang: explicitLang, bannerHeight = 0 }: Props): JSX.Element {
  const fallbackLang = useCurrentLanguage();
  const { i18n } = useTranslation();
  const normalizedI18nLang = useMemo(() => {
    const raw = i18n?.language?.toLowerCase();
    if (!raw) return undefined;
    const base = raw.split("-")[0] as AppLanguage | undefined;
    return base && i18nConfig.supportedLngs.includes(base) ? base : undefined;
  }, [i18n?.language]);
  const lang = explicitLang ?? normalizedI18nLang ?? fallbackLang;
  const { t } = useTranslation("header", { lng: lang });

  /* Focus management --------------------------------------------------- */
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (menuOpen && firstLinkRef.current) firstLinkRef.current.focus();
  }, [menuOpen]);

  const close = (): void => setMenuOpen(false);

  /* Paths & links ------------------------------------------------------ */
  // Build links on each render so labels reflect the active language
  // as soon as namespaces load.
  const { navLinks } = buildNavLinks(lang, t as unknown as TranslateFn);

  /* Render ------------------------------------------------------------- */
  const menuOffset = MOBILE_NAV_HEIGHT + bannerHeight;

  return (
    <FocusTrap
      {...({
        active: menuOpen,
        onDeactivate: close,
        focusTrapOptions: { allowOutsideClick: true, escapeDeactivates: true },
      } as Partial<FocusTrapProps> & { onDeactivate: () => void })}
    >
      <div
        id="mobile-menu"
        data-testid="mobile-menu"
        role="dialog"
        aria-modal={menuOpen ? "true" : undefined}
        aria-hidden={!menuOpen}
        aria-labelledby="mobile-menu-title"
        className={clsx(
          /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
          "fixed inset-x-0 z-40 overflow-y-auto overscroll-contain will-change-transform " +
            /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
            "transform transition-transform duration-300 ease-out lg:hidden bg-brand-bg dark:bg-brand-bg",
          menuOpen ? "translate-y-0 visible pointer-events-auto" : "translate-y-full invisible pointer-events-none"
        )}
        // eslint-disable-next-line react/forbid-dom-props -- UI-1000 ttl=2026-12-31 menu offset is runtime-calculated.
        style={{
          top: menuOffset,
          height: `calc(100dvh - ${menuOffset}px)`,
          transform: `translate3d(0, ${menuOpen ? "0%" : "100%"}, 0)`,
        }}
      >
        <h2
          id={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] id attribute */ "mobile-menu-title"}
          className={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */ "sr-only"}
        >
          {t("siteMenu")}
        </h2>
        <ul className="flex flex-col items-center space-y-6 pt-6 pb-10">
          {navLinks.map(({ key, to, label, prefetch }, idx) => (
            <li key={key}>
              <Link
                ref={idx === 0 ? firstLinkRef : undefined}
                href={`/${lang}${to}`}
                prefetch={prefetch}
                tabIndex={menuOpen ? 0 : -1}
                className="block min-h-11 min-w-11 px-2 py-2 text-xl font-medium underline-offset-4 text-brand-heading dark:text-brand-heading hover:underline focus-visible:underline"
                onClick={close}
              >
                {label}
              </Link>
            </li>
          ))}

          {/* footer row — theme toggle + language chips */}
          <li className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <ThemeToggle />
            <LanguageSwitcher closeMenu={close} />
          </li>
        </ul>
        {/* Next.js handles prefetching automatically via Link prefetch prop */}
      </div>
    </FocusTrap>
  );
}

export default memo(MobileMenu);
export { MobileMenu };

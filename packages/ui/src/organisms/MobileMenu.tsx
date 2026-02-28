// src: packages/ui/src/organisms/MobileMenu.tsx
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import FocusTrap, { type FocusTrapProps } from "focus-trap-react";

import { useCurrentLanguage } from "../hooks/useCurrentLanguage";
import type { AppLanguage } from "../i18n.config";
import { i18nConfig } from "../i18n.config";
import { LanguageSwitcher } from "../molecules/LanguageSwitcher";
import { ThemeToggle } from "../molecules/ThemeToggle";
import { buildNavLinks, type TranslateFn } from "../utils/buildNavLinks";
import { translatePath } from "../utils/translate-path";

interface Props {
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  lang?: AppLanguage;
  bannerHeight?: number;
}

const MOBILE_NAV_HEIGHT = 64;
const FALLBACK_SITE_MENU_LABEL =
  /* i18n-exempt -- UI-1000 ttl=2026-12-31 fallback heading copy. */
  "Site menu";

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
  const pathname = usePathname();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  /* Focus management --------------------------------------------------- */
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (menuOpen && firstLinkRef.current) firstLinkRef.current.focus();
  }, [menuOpen]);

  useEffect(() => {
    const roomsPath = `/${lang}/${translatePath("rooms", lang)}`;
    if (pathname.startsWith(roomsPath)) {
      setExpandedKey("rooms");
    }
  }, [pathname, lang]);

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
            "transform transition-transform duration-300 ease-out lg:hidden bg-brand-bg dark:bg-brand-surface",
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
          {(() => {
            const label = t("siteMenu") as string;
            if (label && label !== "siteMenu") return label;
            return FALLBACK_SITE_MENU_LABEL;
          })()}
        </h2>
        <ul className="flex flex-col items-center space-y-6 pt-6 pb-10">
          {navLinks.map(({ key, to, label, prefetch, children }, idx) => {
            const isCurrent = children ? pathname.startsWith(`/${lang}${to}`) : pathname === `/${lang}${to}`;
            return (
              <li key={key}>
                {children ? (
                  <>
                    <button
                      aria-expanded={expandedKey === key}
                      aria-controls={`mobile-subnav-${key}`}
                      tabIndex={menuOpen ? 0 : -1}
                      onClick={() => setExpandedKey((k) => (k === key ? null : key))}
                      className={clsx(
                        "flex min-h-11 w-full items-center gap-1 px-2 py-2 text-xl text-brand-heading dark:text-brand-heading hover:underline focus-visible:outline-none focus-visible:underline",
                        isCurrent ? "font-semibold text-brand-secondary underline" : "font-medium"
                      )}
                    >
                      {label}
                      <svg
                        aria-hidden="true"
                        className={clsx("size-4 transition-transform", expandedKey === key ? "rotate-180" : "")}
                        fill="none"
                        viewBox="0 0 10 6"
                      >
                        <path
                          d="M1 1l4 4 4-4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {expandedKey === key && (
                      <ul id={`mobile-subnav-${key}`} className="pl-4 pt-2 space-y-2">
                        {children.map((child) => (
                          <li key={child.key}>
                            <Link
                              href={`/${lang}${child.to}`}
                              tabIndex={menuOpen ? 0 : -1}
                              className="block min-h-11 min-w-11 px-2 py-2 text-lg text-brand-heading dark:text-brand-heading hover:underline focus-visible:underline font-medium"
                              onClick={close}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    ref={idx === 0 ? firstLinkRef : undefined}
                    href={`/${lang}${to}`}
                    prefetch={prefetch}
                    tabIndex={menuOpen ? 0 : -1}
                    aria-current={isCurrent ? "page" : undefined}
                    className={clsx(
                      "block min-h-11 min-w-11 px-2 py-2 text-xl underline-offset-4 text-brand-heading dark:text-brand-heading hover:underline focus-visible:underline",
                      isCurrent ? "font-semibold text-brand-secondary underline" : "font-medium"
                    )}
                    onClick={close}
                  >
                    {label}
                  </Link>
                )}
              </li>
            );
          })}

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

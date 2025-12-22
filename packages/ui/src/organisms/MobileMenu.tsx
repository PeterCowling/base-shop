// src: packages/ui/src/organisms/MobileMenu.tsx
import { LanguageSwitcher } from "../molecules/LanguageSwitcher";
import { ThemeToggle } from "../molecules/ThemeToggle";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { buildNavLinks, type TranslateFn } from "@/utils/buildNavLinks";
import { translatePath } from "@/utils/translate-path";
import clsx from "clsx";
import FocusTrap, { type FocusTrapProps } from "focus-trap-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, PrefetchPageLinks } from "react-router-dom";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";

interface Props {
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  lang?: AppLanguage;
}

function MobileMenu({ menuOpen, setMenuOpen, lang: explicitLang }: Props): JSX.Element {
  const fallbackLang = useCurrentLanguage();
  const { i18n } = useTranslation();
  const normalizedI18nLang = useMemo(() => {
    const raw = i18n?.language?.toLowerCase();
    if (!raw) return undefined;
    const base = raw.split("-")[0] as AppLanguage | undefined;
    return base && i18nConfig.supportedLngs.includes(base) ? base : undefined;
  }, [i18n?.language]);
  const lang = normalizedI18nLang ?? explicitLang ?? fallbackLang;
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
  const { slugs, navLinks } = buildNavLinks(lang, t as unknown as TranslateFn);
  /* Silent pre-warm for Assistance and Apartment pages ---------------- */
  const [prefetched, setPrefetched] = useState(false);
  useEffect(() => {
    if (menuOpen && !prefetched) setPrefetched(true);
  }, [menuOpen, prefetched]);

  /* Render ------------------------------------------------------------- */
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
        aria-modal="true"
        aria-labelledby="mobile-menu-title"
        className={clsx(
          /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
          "fixed inset-x-0 top-16 z-40 h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain will-change-transform " +
            /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
            "transform transition-transform duration-300 ease-out lg:hidden bg-brand-bg dark:bg-brand-bg",
          menuOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <h2
          id={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] id attribute */ "mobile-menu-title"}
          className={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */ "sr-only"}
        >
          {t("siteMenu")}
        </h2>
        <ul className="flex flex-col items-center space-y-6 pt-6 pb-10">
          {navLinks.map(({ key, to, label }, idx) => (
            <li key={key}>
              <Link
                ref={idx === 0 ? firstLinkRef : undefined}
                to={`/${lang}${to}`}
                prefetch="intent"
                className="block py-2 text-xl font-medium underline-offset-4 text-brand-heading dark:text-brand-heading hover:underline focus-visible:underline"
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
        {prefetched && (
          <>
            <PrefetchPageLinks page={`/${lang}${slugs.assistance}`} />
            <PrefetchPageLinks page={`/${lang}/${translatePath("apartment", lang)}`} />
          </>
        )}
      </div>
    </FocusTrap>
  );
}

export default memo(MobileMenu);
export { MobileMenu };

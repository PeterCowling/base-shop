// src: packages/ui/src/organisms/DesktopHeader.tsx
import { memo, type MouseEvent, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Section } from "../atoms/Section";
import { Inline } from "../components/atoms/primitives/Inline";
import { useCurrentLanguage } from "../hooks/useCurrentLanguage";
import { useTheme } from "../hooks/useTheme";
import type { AppLanguage } from "../i18n.config";
import { i18nConfig } from "../i18n.config";
import { LanguageSwitcher } from "../molecules/LanguageSwitcher";
import { ThemeToggle } from "../molecules/ThemeToggle";
import { resolvePrimaryCtaLabel } from "../shared";
import type { SlugMap } from "../slug-map";
import { buildNavLinks, type TranslateFn } from "../utils/buildNavLinks";
import { translatePath } from "../utils/translate-path";

/*  Public assets are referenced by absolute URL paths.
    “?url” lets Vite keep the file name stable in development
    while permitting hashing in production. */
const logoIcon = "/img/hostel_brikette_icon.png"; // original raster – small icon
const BRAND_NAME = "hostel-brikette";
const FALLBACK_PRIMARY_CTA_LABEL =
  /* i18n-exempt -- UI-1000 ttl=2026-12-31 fallback copy until tokens are wired. */
  "Check availability";
const FALLBACK_BRAND_TITLE =
  /* i18n-exempt -- UI-1000 ttl=2026-12-31 fallback brand name. */
  "Hostel Brikette";
const FALLBACK_LOGO_ALT =
  /* i18n-exempt -- UI-1000 ttl=2026-12-31 fallback logo alt text. */
  "Hostel Brikette logo";

function DesktopHeader({
  lang: explicitLang,
  onPrimaryCtaClick,
}: {
  lang?: AppLanguage;
  onPrimaryCtaClick?: () => void;
}): React.JSX.Element {
  const fallbackLang = useCurrentLanguage();
  const { i18n } = useTranslation();
  const normalizedI18nLang = useMemo(() => {
    const raw = i18n.language?.toLowerCase();
    if (!raw) return undefined;
    const base = raw.split("-")[0] as AppLanguage | undefined;
    return base && i18nConfig.supportedLngs.includes(base) ? base : undefined;
  }, [i18n.language]);
  const lang = explicitLang ?? normalizedI18nLang ?? fallbackLang;
  useTranslation("header", { lng: lang });
  const { t: tTokens, ready: tokensReady } = useTranslation("_tokens", { lng: lang });
  const headerT = useMemo(() => i18n.getFixedT(lang, "header"), [i18n, lang]);
  const hasHeaderBundle = i18n.hasResourceBundle(lang, "header");
  const pathname = usePathname();
  const { theme } = useTheme();

  // Apartment-aware CTA routing (TASK-07): on apartment routes, link directly to apartment
  // booking page instead of opening the hostel booking modal.
  const apartmentPath = `/${translatePath("apartment", lang)}`;
  const isApartmentRoute = pathname.startsWith(`/${lang}${apartmentPath}`);
  const bookHref = isApartmentRoute
    ? `/${lang}${apartmentPath}/book`
    : `/${lang}/${translatePath("book", lang)}`;
  const onBookClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      // On apartment routes let normal navigation handle the link — no modal.
      if (isApartmentRoute) return;
      // Keep a semantic link fallback for no-JS while preserving modal UX when hydrated.
      onPrimaryCtaClick?.();
      event.preventDefault();
    },
    [onPrimaryCtaClick, isApartmentRoute]
  );

  const navTranslate = useCallback<TranslateFn>(
    (key, defaultValue) => {
      const translated = headerT(key, defaultValue ? { defaultValue } : undefined) as string;
      if (translated && translated !== key && translated !== defaultValue) {
        return translated;
      }

      if (!hasHeaderBundle && lang !== i18nConfig.fallbackLng) {
        if (key === "home") {
          return key;
        }
        try {
          const slug = translatePath(key as keyof SlugMap, lang);
          if (slug) {
            return slug
              .split("-")
              .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
              .join(" ");
          }
        } catch {
          /* fallback below */
        }
        return key;
      }

      if (defaultValue !== undefined && defaultValue !== key) {
        return defaultValue;
      }

      return key.charAt(0).toUpperCase() + key.slice(1);
    },
    [headerT, hasHeaderBundle, lang]
  );

  const { navLinks } = buildNavLinks(lang, navTranslate);
  const ctaClass = "cta-dark";
  const primaryCtaLabel = useMemo(() => {
    if (!tokensReady) return FALLBACK_PRIMARY_CTA_LABEL;
    return resolvePrimaryCtaLabel(tTokens, { fallback: FALLBACK_PRIMARY_CTA_LABEL }) ?? FALLBACK_PRIMARY_CTA_LABEL;
  }, [tTokens, tokensReady]);

  return (
    <div className="hidden lg:block bg-header-gradient">
      <Section as="div" padding="none" className="max-w-7xl px-8 text-brand-heading">
        {/* Row 1 – logo • CTA • toggles */}
        <div className="header-row-1 flex items-center justify-between">
          <Link
            href={`/${lang}`}
            className="flex min-h-11 min-w-48 items-center gap-3 whitespace-nowrap rounded transition hover:text-brand-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary/70"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- UI-1000 [ttl=2026-12-31] UI package is not Next-only; icon is a local static asset */}
            <img
              src={logoIcon}
              alt={(() => {
                const logoAlt = headerT("logoAlt", { defaultValue: FALLBACK_LOGO_ALT }) as string;
                if (logoAlt && logoAlt !== "logoAlt") return logoAlt;
                return FALLBACK_LOGO_ALT;
              })()}
              className="size-10"
              width={40}
              height={40}
              loading="eager"
              decoding="async"
            />
            <span
              className="text-lg font-bold text-white notranslate"
              translate="no"
              data-brand-name={BRAND_NAME}
            >
              {(() => {
                const title = headerT("title") as string;
                if (title && title !== "title") return title;
                return FALLBACK_BRAND_TITLE;
              })()}
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href={bookHref}
              onClick={onBookClick}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-6 py-2.5 text-sm font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cta ${ctaClass}`}
            >
              {primaryCtaLabel}
            </Link>

            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Row 2 – primary navigation */}
        <nav aria-label="Primary navigation" className="header-row-2">
          <Inline asChild gap={8} className="justify-end text-sm font-medium">
            <ul>
              {navLinks.map(({ key, to, label, prefetch }) => {
                const current = pathname === `/${lang}${to}`;
                const highlight = current
                  ? theme === "dark"
                    ? /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
                      "font-semibold text-brand-primary underline"
                    : /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
                      "font-semibold text-brand-secondary underline"
                  : "";

                return (
                  <li key={key}>
                    <Link
                      href={`/${lang}${to}`}
                      aria-current={current ? "page" : undefined}
                      aria-label={label}
                      prefetch={to === apartmentPath ? true : prefetch}
                      className={`inline-flex min-h-11 items-center px-2 underline-offset-4 transition hover:underline hover:decoration-brand-bougainvillea focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary/70 ${highlight}`}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Inline>
        </nav>
      </Section>
    </div>
  );
}

export default memo(DesktopHeader);
export { DesktopHeader };

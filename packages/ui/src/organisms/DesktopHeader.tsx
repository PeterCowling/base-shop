// src: packages/ui/src/organisms/DesktopHeader.tsx
import { LanguageSwitcher } from "../molecules/LanguageSwitcher";
import { ThemeToggle } from "../molecules/ThemeToggle";
import { Button } from "../atoms/Button";
import { Section } from "../atoms/Section";
import { useModal } from "@/context/ModalContext";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { useTheme } from "@/hooks/useTheme";
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { buildNavLinks, type TranslateFn } from "@/utils/buildNavLinks";
import { translatePath } from "@/utils/translate-path";
import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import type { SlugMap } from "@/slug-map";
import { resolveBookingCtaLabel } from "@acme/ui/shared";
import { Inline } from "@/components/atoms/primitives/Inline";

/*  Public assets are referenced by absolute URL paths.
    “?url” lets Vite keep the file name stable in development
    while permitting hashing in production. */
const logoIcon = "/img/hostel_brikette_icon.png"; // original raster – small icon
const BRAND_NAME = "hostel-brikette";

function DesktopHeader({ lang: explicitLang }: { lang?: AppLanguage }): React.JSX.Element {
  const fallbackLang = useCurrentLanguage();
  const { i18n } = useTranslation();
  const normalizedI18nLang = useMemo(() => {
    const raw = i18n.language?.toLowerCase();
    if (!raw) return undefined;
    const base = raw.split("-")[0] as AppLanguage | undefined;
    return base && i18nConfig.supportedLngs.includes(base) ? base : undefined;
  }, [i18n.language]);
  const lang = normalizedI18nLang ?? explicitLang ?? fallbackLang;
  useTranslation("header", { lng: lang });
  useTranslation("_tokens", { lng: lang });
  const headerT = useMemo(() => i18n.getFixedT(lang, "header"), [i18n, lang]);
  const tokensT = useMemo(() => i18n.getFixedT(lang, "_tokens"), [i18n, lang]);
  const hasHeaderBundle = i18n.hasResourceBundle(lang, "header");
  const hasTokensBundle = i18n.hasResourceBundle(lang, "_tokens");
  const { theme } = useTheme();
  const { openModal } = useModal();
  const location = useLocation();

  const book = useCallback(() => openModal("booking"), [openModal]);

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
  const ctaClass = theme === "dark" ? "cta-dark" : "cta-light";
  const apartmentPath = `/${translatePath("apartment", lang)}`;
  const reserveLabel = useMemo(() => {
    const fallbackHeaderT = i18n.getFixedT(i18nConfig.fallbackLng, "header");
    return (
      resolveBookingCtaLabel(tokensT, {
        fallback: () => {
          if (!hasTokensBundle && lang !== i18nConfig.fallbackLng) {
            const alt = headerT("reserve") as string;
            if (alt && alt.trim() && alt !== "reserve") {
              return alt;
            }
          }
          const direct = headerT("reserve") as string;
          if (direct && direct.trim() && direct !== "reserve") {
            return direct;
          }
          const fallback = fallbackHeaderT("reserve") as string;
          if (fallback && fallback.trim() && fallback !== "reserve") {
            return fallback;
          }
          return "Reserve Now";
        },
      }) ?? "Reserve Now"
    );
  }, [tokensT, headerT, hasTokensBundle, i18n, lang]);

  return (
    <div className="hidden lg:block bg-header-gradient">
      <Section as="div" padding="none" className="max-w-7xl px-8 text-brand-heading">
        {/* Row 1 – logo • CTA • toggles */}
        <div className="header-row-1 flex items-center justify-between">
          <Link
            to={`/${lang}`}
            className="flex min-w-48 items-center gap-3 whitespace-nowrap transition hover:text-brand-secondary"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- UI-1000 [ttl=2026-12-31] UI package is not Next-only; icon is a local static asset */}
            <img
              src={logoIcon}
              alt={headerT("logoAlt")}
              className="size-10"
              width={40}
              height={40}
              loading="eager"
              decoding="async"
            />
            <span
              className="text-lg font-bold notranslate"
              translate="no"
              data-brand-name={BRAND_NAME}
            >
              {headerT("title")}
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Button
              onClick={book}
              className={`cta ${ctaClass} rounded-md px-10 py-3 font-bold tracking-wide focus-visible:ring-2 focus-visible:ring-offset-2`}
            >
              {reserveLabel}
            </Button>

            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Row 2 – primary navigation */}
        <nav aria-label="Primary navigation" className="header-row-2">
          <Inline asChild gap={8} className="justify-end text-sm font-medium">
            <ul>
              {navLinks.map(({ key, to, label }) => {
                const current = location.pathname === `/${lang}${to}`;
                const highlight = current
                  ? theme === "dark"
                    ? /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
                      "font-semibold text-brand-primary"
                    : /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
                      "font-semibold text-brand-secondary"
                  : "";

                return (
                  <li key={key}>
                    <Link
                      to={`/${lang}${to}`}
                      aria-current={current ? "page" : undefined}
                      aria-label={label}
                      prefetch={to === apartmentPath ? "intent" : undefined}
                      data-prefetch={to === apartmentPath ? "intent" : undefined}
                      className={`underline-offset-4 transition hover:underline hover:decoration-brand-bougainvillea ${highlight}`}
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

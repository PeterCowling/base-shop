// packages/ui/src/organisms/Footer.tsx
import { CONTACT_EMAIL } from "@ui/config/hotel";
import { useCurrentLanguage } from "@ui/hooks/useCurrentLanguage";
import { buildNavLinks, type TranslateFn } from "@ui/utils/buildNavLinks";
import { Section } from "@ui/atoms/Section";
import { Inline } from "@ui/components/atoms/primitives/Inline";
import { Facebook, Instagram } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { SLUGS } from "@ui/slug-map";
import type { AppLanguage } from "@ui/i18n.config";
import { i18nConfig } from "@ui/i18n.config";
import { translatePath } from "@ui/utils/translate-path";

const CURRENT_YEAR = new Date().getFullYear();

function FooterComponent({ lang: explicitLang }: { lang?: AppLanguage }): JSX.Element {
  const fallbackLang = useCurrentLanguage();
  const { i18n } = useTranslation();
  const normalizedI18nLang = useMemo(() => {
    const raw = i18n.language?.toLowerCase();
    if (!raw) return undefined;
    const base = raw.split("-")[0] as AppLanguage | undefined;
    return base && i18nConfig.supportedLngs.includes(base) ? base : undefined;
  }, [i18n.language]);
  const lang = normalizedI18nLang ?? explicitLang ?? fallbackLang;
  // Use explicit namespaces: footer copy from `footer`, nav labels from `header`.
  const { t: tFooter } = useTranslation("footer", { lng: lang });
  const { t: tHeader } = useTranslation("header", { lng: lang });

  // Prefer footer labels if present, then fall back to header, then to a humanized key
  const tNav: TranslateFn = (key: string, defaultValue?: string): string => {
    const fv = tFooter(key, { lng: lang }) as string;
    if (fv && fv !== key) return fv;
    const hv =
      defaultValue !== undefined
        ? (tHeader(key, { lng: lang, defaultValue }) as string)
        : (tHeader(key, { lng: lang }) as string);
    if (hv && hv !== key) return hv;
    return defaultValue ?? key.charAt(0).toUpperCase() + key.slice(1);
  };

  // Build links on each render so labels update when i18n
  // resources are loaded for the current language.
  const { navLinks } = buildNavLinks(lang, tNav);
  const apartmentPath = `/${translatePath("apartment", lang)}`;

  const linkClasses = useCallback((small = false): string => {
    const sizeClass = small
      ? /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
        "text-sm md:text-base"
      : /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
        "text-base md:text-lg";
    return [
      "block",
      "py-2",
      "font-medium",
      sizeClass,
      "min-h-[44px]",
      "leading-[44px]",
      "underline",
      "whitespace-nowrap",
      "decoration-2",
      "underline-offset-4",
      "decoration-brand-secondary",
      "transition-colors",
      "text-brand-bg",
      "hover:text-brand-bougainvillea",
      "hover:decoration-brand-bougainvillea",
      "focus-visible:outline-none",
      "focus-visible:ring-2",
      "focus-visible:ring-brand-bougainvillea/60",
      "dark:text-brand-text",
      "dark:hover:text-brand-secondary",
    ].join(" ");
  }, []);

  const backToTopLabel = tFooter("backToTop", { lng: lang, defaultValue: "Back to top" }) as string;
  const noPhoneNotice = tFooter("noPhoneNotice", { lng: lang }) as string;

  return (
    <footer
      id="footer"
      className="bg-brand-primary dark:bg-brand-surface text-brand-bg dark:text-brand-text selection:bg-brand-bg/20"
    >
      <Section as="div" padding="none" width="full" className="mx-auto max-w-screen-xl px-4 py-4 md:py-6">
        <nav aria-label="Footer navigation">
          <Inline
            asChild
            wrap={false}
            gap={3}
            className="flex-col items-stretch sm:flex-row sm:items-center sm:gap-4 lg:gap-6 divide-y divide-brand-bg/20 sm:divide-y-0 sm:divide-x dark:divide-brand-text/20"
          >
            <ul>
              {navLinks.map(({ key, to, label }) => (
                <li key={key} className="text-center sm:flex-1 sm:px-4 lg:px-6">
                  <Link
                    to={`/${lang}${to}`}
                    prefetch={to === apartmentPath ? "intent" : "viewport"}
                    data-prefetch={to === apartmentPath ? "intent" : undefined}
                    className={`${linkClasses(false)} text-center`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </Inline>
        </nav>
      </Section>

      <Section as="div" padding="none" width="full" className="mx-auto max-w-screen-xl px-4 pb-4 md:pb-6">
        <h2 className="sr-only">{tFooter("contactHeading", { lng: lang })}</h2>
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <address className="not-italic text-center sm:text-start">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className={linkClasses(true)}
              aria-label={tFooter("email", { lng: lang })}
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-2 text-sm text-brand-bg/80 dark:text-brand-text/80 sm:text-start">
              {noPhoneNotice}
            </p>
          </address>
          <ul className="flex gap-4" aria-label={tFooter("follow", { lng: lang })}>
            <li>
              <a
                href="https://www.instagram.com/brikettepositano"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={tFooter("instagram", { lng: lang })}
                className={linkClasses(true)}
              >
                <Instagram className="size-5" aria-hidden />
              </a>
            </li>
            <li>
              <a
                href="https://www.facebook.com/hostelbrikette"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={tFooter("facebook", { lng: lang })}
                className={linkClasses(true)}
              >
                <Facebook className="size-5" aria-hidden />
              </a>
            </li>
          </ul>
        </div>
      </Section>

      <div className="bg-gradient-to-b from-brand-gradient-start to-brand-gradient-end py-6 md:py-8">
        <Section as="div" padding="none" width="full" className="mx-auto max-w-screen-xl px-4">
          <div className="flex w-full flex-row flex-wrap items-center justify-between gap-3">
            <Link to={`/${lang}/${SLUGS.terms[lang]}`} className={linkClasses(true)}>
              {tFooter("terms", { lng: lang })}
            </Link>
            <Link to={`/${lang}`} className={linkClasses(true)}>
              {tFooter("copyright", { lng: lang, year: CURRENT_YEAR })}
            </Link>
            <a href="#top" aria-label={backToTopLabel} className={`${linkClasses(true)} font-semibold ml-2`}>
              {backToTopLabel}
            </a>
          </div>
        </Section>
      </div>
    </footer>
  );
}

const Footer = memo(FooterComponent);
export default Footer;
export { Footer };

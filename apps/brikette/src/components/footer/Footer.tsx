// src/components/footer/Footer.tsx
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin } from "lucide-react";

import { Section } from "@acme/design-system/atoms";

import { Cluster } from "@/components/ui/flex";
import hotel, { CONTACT_EMAIL } from "@/config/hotel";
import { isGuideLive } from "@/data/guides.index";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { type AppLanguage, i18nConfig } from "@/i18n.config";
import { Facebook, Instagram } from "@/icons";
import { guideHref } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";

import FooterLegalRow from "./FooterLegalRow";
import { FooterIconLink, FooterTextLink } from "./FooterLinks";
import type { FooterLink } from "./footerTypes";

const CURRENT_YEAR = new Date().getFullYear();
const FOOTER_PREFETCH = false;
const SAFE_BOTTOM_PADDING_STYLE = {
  paddingBottom: "calc(var(--safe-bottom) + var(--space-3))",
} as const;

// eslint-disable-next-line max-lines-per-function -- BRIK-DS-001: large component pending refactor
const FooterComponent = memo(function FooterComponent({ lang: explicitLang }: { lang?: AppLanguage }): JSX.Element {
  const fallbackLang = useCurrentLanguage();
  const { i18n } = useTranslation();
  const normalizedI18nLang = (() => {
    const raw = i18n.language?.toLowerCase();
    if (!raw) return undefined;
    const base = raw.split("-")[0] as AppLanguage | undefined;
    return base && i18nConfig.supportedLngs.includes(base) ? base : undefined;
  })();
  const lang = explicitLang ?? normalizedI18nLang ?? fallbackLang;
  const { t: tFooter } = useTranslation("footer", { lng: lang });
  const { t: tDeals } = useTranslation("dealsPage", { lng: lang });
  const rawPathname = usePathname();
  const pathname = rawPathname ?? "";

  const mapUrl = (() => {
    const googleMaps = hotel.sameAs.find((link) => link.includes("maps.google.com"));
    if (googleMaps) return googleMaps;
    const query = encodeURIComponent(`${hotel.name.en} ${hotel.address.streetAddress}`);
    return `https://maps.google.com/?q=${query}`;
  })();

  const brandName = hotel.name[lang] ?? hotel.name.en;
  const brandDescription = hotel.description[lang] ?? hotel.description.en;

  const isActiveLink = useCallback(
    (href: string): boolean => {
      if (!pathname) return false;
      const normalize = (value: string) => value.replace(/\/+$/, "") || "/";
      const current = normalize(pathname);
      const target = normalize(href);
      if (!target) return false;
      if (target === `/${lang}`) return current === target;
      return current === target || current.startsWith(`${target}/`);
    },
    [pathname, lang],
  );

  const addressLines = [
    hotel.address.streetAddress,
    `${hotel.address.postalCode} ${hotel.address.addressLocality}`,
    tFooter("addressCountry", { lng: lang }) as string,
  ];

  const legalLinks: FooterLink[] = [
    {
      key: "terms",
      label: tFooter("terms", { lng: lang }) as string,
      href: `/${lang}/${getSlug("terms", lang)}`,
    },
    {
      key: "houseRules",
      label: tFooter("houseRules", { lng: lang }) as string,
      href: `/${lang}/${getSlug("houseRules", lang)}`,
    },
    {
      key: "privacy",
      label: tFooter("privacy", { lng: lang }) as string,
      href: `/${lang}/${getSlug("privacyPolicy", lang)}`,
    },
    {
      key: "cookies",
      label: tFooter("cookies", { lng: lang }) as string,
      href: `/${lang}/${getSlug("cookiePolicy", lang)}`,
    },
  ];

  const exploreLinks: FooterLink[] = [
    {
      key: "rooms",
      label: tFooter("rooms", { lng: lang }) as string,
      href: `/${lang}/${getSlug("rooms", lang)}`,
    },
    {
      key: "experiences",
      label: tFooter("experiences", { lng: lang }) as string,
      href: `/${lang}/${getSlug("experiences", lang)}`,
    },
    {
      key: "deals",
      label: tFooter("deals", { lng: lang }) as string,
      href: `/${lang}/${getSlug("deals", lang)}`,
    },
  ];

  const infoLinks: FooterLink[] = [
    {
      key: "howToGetHere",
      label: tFooter("howToGetHere", { lng: lang }) as string,
      href: `/${lang}/${getSlug("howToGetHere", lang)}`,
    },
    {
      key: "assistance",
      label: tFooter("assistance", { lng: lang }) as string,
      href: `/${lang}/${getSlug("assistance", lang)}`,
    },
    ...(isGuideLive("travelFaqsAmalfi")
      ? [
          {
            key: "faq",
            label: tFooter("faq", { lng: lang }) as string,
            href: guideHref(lang, "travelFaqsAmalfi"),
          },
        ]
      : []),
    ...(isGuideLive("checkinCheckout")
      ? [
          {
            key: "checkinCheckout",
            label: tFooter("checkinCheckout", { lng: lang }) as string,
            href: guideHref(lang, "checkinCheckout"),
          },
        ]
      : []),
    ...(isGuideLive("rules")
      ? [
          {
            key: "houseRules",
            label: tFooter("houseRules", { lng: lang }) as string,
            href: guideHref(lang, "rules"),
          },
        ]
      : []),
    ...(isGuideLive("changingCancelling")
      ? [
          {
            key: "cancellationPolicy",
            label: tFooter("cancellationPolicy", { lng: lang }) as string,
            href: guideHref(lang, "changingCancelling"),
          },
        ]
      : []),
  ];

  const socialLinks: FooterLink[] = [
    {
      key: "instagram",
      label: tFooter("instagram", { lng: lang }) as string,
      href: "https://www.instagram.com/brikettepositano",
      external: true,
      newTab: true,
    },
    {
      key: "facebook",
      label: tFooter("facebook", { lng: lang }) as string,
      href: "https://www.facebook.com/hostelbrikette",
      external: true,
      newTab: true,
    },
  ];

  const backToTopLabel = tFooter("backToTop", { lng: lang }) as string;
  const copyright = tFooter("copyright", { lng: lang, year: CURRENT_YEAR }) as string;
  const noPhoneNotice = tFooter("noPhoneNotice", { lng: lang }) as string;
  const emailLinkLabel = `${tFooter("email", { lng: lang })}: ${CONTACT_EMAIL}`;
  const bookDirectCtaLabel = tDeals("dealCard.cta.bookDirect", { lng: lang, defaultValue: "Book direct" }) as string;
  const navAriaLabel = tFooter("navAriaLabel", { lng: lang }) as string;

  return (
    <footer className="bg-brand-primary text-brand-bg dark:bg-brand-surface dark:text-brand-text">
      <Section as="div" padding="none" width="full" className="mx-auto max-w-6xl px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">

          {/* Column 1: Brand + address */}
          <div className="flex flex-col gap-4 sm:col-span-2 xl:col-span-1">
            <p className="text-xl font-semibold tracking-tight">{brandName}</p>
            <p className="text-sm text-brand-bg/80 dark:text-brand-text/80">{brandDescription}</p>
            <Link
              href={`/${lang}/book`}
              className="self-start text-sm font-medium text-brand-secondary hover:underline"
            >
              {bookDirectCtaLabel} →
            </Link>
            <div className="flex flex-col gap-2 pt-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-bg/75 dark:text-brand-text/75">
                {tFooter("locationHeading", { lng: lang })}
              </p>
              <address className="flex items-start gap-2 text-sm not-italic">
                <MapPin className="mt-0.5 size-4 shrink-0 opacity-60" aria-hidden />
                <span>
                  {addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </address>
              <FooterTextLink href={mapUrl} external newTab size="sm">
                {tFooter("mapLink", { lng: lang })}
              </FooterTextLink>
            </div>
          </div>

          {/* Columns 2: Explore + Info nav (nested 2-col grid) */}
          <nav
            aria-label={navAriaLabel}
            className="sm:col-span-1 xl:col-span-1"
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-8">
              {/* Explore */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-brand-bg/90 dark:text-brand-text/90">
                  {tFooter("exploreHeading", { lng: lang })}
                </p>
                <ul className="space-y-1">
                  {exploreLinks.map((link) => (
                    <li key={link.key}>
                      <FooterTextLink
                        href={link.href}
                        prefetch={FOOTER_PREFETCH}
                        isActive={isActiveLink(link.href)}
                        size="sm"
                      >
                        {link.label}
                      </FooterTextLink>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Info */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-brand-bg/90 dark:text-brand-text/90">
                  {tFooter("infoHeading", { lng: lang })}
                </p>
                <ul className="space-y-1">
                  {infoLinks.map((link) => (
                    <li key={link.key}>
                      <FooterTextLink
                        href={link.href}
                        external={link.external}
                        newTab={link.newTab}
                        prefetch={FOOTER_PREFETCH}
                        isActive={!link.external && isActiveLink(link.href)}
                        size="sm"
                      >
                        {link.label}
                      </FooterTextLink>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </nav>

          {/* Column 3: Contact + Social */}
          <div className="flex flex-col gap-6 sm:col-span-1 xl:col-span-1">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-bg/75 dark:text-brand-text/75">
                {tFooter("contactHeading", { lng: lang })}
              </p>
              <FooterTextLink
                href={`mailto:${CONTACT_EMAIL}`}
                size="sm"
                ariaLabel={emailLinkLabel}
              >
                {CONTACT_EMAIL}
              </FooterTextLink>
              <p className="text-sm text-brand-bg/80 dark:text-brand-text/80">{noPhoneNotice}</p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-bg/75 dark:text-brand-text/75">
                {tFooter("follow", { lng: lang })}
              </p>
              <Cluster as="ul" className="items-center">
                {socialLinks.map((link) => (
                  <li key={link.key}>
                    <FooterIconLink
                      href={link.href}
                      external
                      newTab={link.newTab}
                      ariaLabel={link.label}
                    >
                      {link.key === "instagram" ? <Instagram className="size-5" aria-hidden /> : null}
                      {link.key === "facebook" ? <Facebook className="size-5" aria-hidden /> : null}
                    </FooterIconLink>
                  </li>
                ))}
              </Cluster>
            </div>
          </div>

        </div>
      </Section>

      <div className="border-t border-brand-bg/20 bg-gradient-to-b from-brand-gradient-start to-brand-gradient-end dark:border-brand-text/20">
        <Section
          as="div"
          padding="none"
          width="full"
          className="mx-auto max-w-6xl px-6 py-4 md:py-5"
          style={SAFE_BOTTOM_PADDING_STYLE}
        >
          <FooterLegalRow
            legalLinks={legalLinks}
            isActiveLink={isActiveLink}
            prefetch={FOOTER_PREFETCH}
            copyright={copyright}
            backToTopLabel={backToTopLabel}
          />
        </Section>
      </div>
    </footer>
  );
});

export default FooterComponent;
export { FooterComponent as Footer };

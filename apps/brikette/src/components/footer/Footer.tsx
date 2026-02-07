// src/components/footer/Footer.tsx
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";

import { Section } from "@acme/design-system/atoms";

import { Cluster } from "@/components/ui/flex";
import hotel, { CONTACT_EMAIL } from "@/config/hotel";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { Facebook, Instagram } from "@/icons";
import { guideHref, guideSlug } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";

import FooterLegalRow from "./FooterLegalRow";
import { FooterIconLink, FooterTextLink } from "./FooterLinks";
import FooterNav from "./FooterNav";
import type { FooterGroup, FooterLink } from "./footerTypes";

const CURRENT_YEAR = new Date().getFullYear();
const FOOTER_PREFETCH = true;
const SAFE_BOTTOM_PADDING_STYLE = {
  paddingBottom: "calc(var(--safe-bottom) + var(--space-3))",
} as const;
const FooterComponent = memo(function FooterComponent({ lang: explicitLang }: { lang?: AppLanguage }): JSX.Element {
  const fallbackLang = useCurrentLanguage();
  const { i18n } = useTranslation();
  const normalizedI18nLang = (() => {
    const raw = i18n.language?.toLowerCase();
    if (!raw) return undefined;
    const base = raw.split("-")[0] as AppLanguage | undefined;
    return base && i18nConfig.supportedLngs.includes(base) ? base : undefined;
  })();
  // Prefer the route-provided language so footer copy tracks URL changes,
  // even if the i18n instance hasn't updated yet.
  const lang = explicitLang ?? normalizedI18nLang ?? fallbackLang;
  const { t: tFooter } = useTranslation("footer", { lng: lang });
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

  const navGroups: FooterGroup[] = [
    {
      key: "explore",
      heading: tFooter("exploreHeading", { lng: lang }) as string,
      links: [
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
      ],
    },
    {
      key: "info",
      heading: tFooter("infoHeading", { lng: lang }) as string,
      links: [
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
        {
          key: "faq",
          label: tFooter("faq", { lng: lang }) as string,
          href: guideHref(lang, "travelFaqsAmalfi"),
        },
        {
          key: "checkinCheckout",
          label: tFooter("checkinCheckout", { lng: lang }) as string,
          href: `/${lang}/${getSlug("assistance", lang)}/${guideSlug(lang, "checkinCheckout")}`,
        },
        {
          key: "houseRules",
          label: tFooter("houseRules", { lng: lang }) as string,
          href: `/${lang}/${getSlug("assistance", lang)}/${guideSlug(lang, "rules")}`,
        },
        {
          key: "cancellationPolicy",
          label: tFooter("cancellationPolicy", { lng: lang }) as string,
          href: `/${lang}/${getSlug("assistance", lang)}/${guideSlug(lang, "changingCancelling")}`,
        },
      ],
    },
    {
      key: "legal",
      heading: tFooter("legalHeading", { lng: lang }) as string,
      links: legalLinks,
    },
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

  return (
    <footer className="bg-brand-primary text-brand-bg dark:bg-brand-surface dark:text-brand-text">
      <Section as="div" padding="none" width="full" className="mx-auto max-w-6xl px-6 py-6 md:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 lg:basis-96 lg:flex-none">
            <p className="text-lg font-semibold tracking-tight">{brandName}</p>
            <p className="text-sm text-brand-bg/80 dark:text-brand-text/80">{brandDescription}</p>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-bg/70 dark:text-brand-text/70">
                {tFooter("locationHeading", { lng: lang })}
              </p>
              <address className="space-y-1 text-sm not-italic">
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <FooterTextLink href={mapUrl} external newTab size="sm">
                {tFooter("mapLink", { lng: lang })}
              </FooterTextLink>
            </div>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-bg/70 dark:text-brand-text/70">
                {tFooter("contactHeading", { lng: lang })}
              </p>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-bg/70 dark:text-brand-text/70">
                  {tFooter("email", { lng: lang })}
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
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-bg/70 dark:text-brand-text/70">
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

      <div className="border-t border-brand-bg/20 dark:border-brand-text/20">
        <Section as="div" padding="none" width="full" className="mx-auto max-w-6xl px-6 py-6 md:py-7">
          <FooterNav
            navGroups={navGroups}
            isActiveLink={isActiveLink}
            prefetch={FOOTER_PREFETCH}
            lang={lang}
          />
        </Section>
      </div>

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

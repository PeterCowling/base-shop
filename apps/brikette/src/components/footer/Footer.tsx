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
import { useEntryAttribution } from "@/hooks/useEntryAttribution";
import { type AppLanguage, i18nConfig } from "@/i18n.config";
import { Facebook, Instagram } from "@/icons";
import footerEn from "@/locales/en/footer.json";
import { type GuideKey,guideNamespace, guideSlug } from "@/routes.guides-helpers";
import { buildIntentAwareBookingCopy } from "@/utils/intentAwareBookingCopy";
import { resolveSharedBookingSurface, shouldUseIntentAwareSharedBookingSurface } from "@/utils/sharedBookingSurface";
import { getSlug } from "@/utils/slug";

import FooterLegalRow from "./FooterLegalRow";
import { FooterIconLink, FooterTextLink } from "./FooterLinks";
import type { FooterLink } from "./footerTypes";

const CURRENT_YEAR = new Date().getFullYear();
const FOOTER_PREFETCH = false;
const SAFE_BOTTOM_PADDING_STYLE = {
  paddingBottom: "calc(var(--safe-bottom) + var(--space-3))",
} as const;
const PRIVATE_BOOKING_FALLBACK =
  /* i18n-exempt -- BRIK-2145 [ttl=2026-12-31] English fallback when footer locale is missing the private booking label. */
  "Book private accommodations";

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
  const rawPathname = usePathname();
  const pathname = rawPathname ?? "";
  const currentAttribution = useEntryAttribution();

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

  function resolveFooterLabel(key: string, fallback?: string): string {
    const englishFallback =
      fallback ??
      (Object.prototype.hasOwnProperty.call(footerEn, key)
        ? (footerEn as Record<string, string>)[key]
        : undefined) ??
      key;
    const value = tFooter(key, { lng: lang, defaultValue: englishFallback }) as string;
    if (typeof value !== "string") return englishFallback;
    const trimmed = value.trim();
    if (!trimmed || trimmed === key) return englishFallback;
    return trimmed;
  }

  const resolveCanonicalGuideHref = useCallback(
    (guideKey: GuideKey): string => {
      const baseKey = guideNamespace(lang, guideKey).baseKey;
      return `/${lang}/${getSlug(baseKey, lang)}/${guideSlug(lang, guideKey)}`;
    },
    [lang],
  );

  const addressLines = [
    hotel.address.streetAddress,
    `${hotel.address.postalCode} ${hotel.address.addressLocality}`,
    resolveFooterLabel("addressCountry"),
  ];

  const legalLinks: FooterLink[] = [
    {
      key: "terms",
      label: resolveFooterLabel("terms"),
      href: `/${lang}/${getSlug("terms", lang)}`,
    },
    {
      key: "houseRules",
      label: resolveFooterLabel("houseRules"),
      href: `/${lang}/${getSlug("houseRules", lang)}`,
    },
    {
      key: "privacy",
      label: resolveFooterLabel("privacy"),
      href: `/${lang}/${getSlug("privacyPolicy", lang)}`,
    },
    {
      key: "cookies",
      label: resolveFooterLabel("cookies"),
      href: `/${lang}/${getSlug("cookiePolicy", lang)}`,
    },
  ];

  const exploreLinks: FooterLink[] = [
    {
      key: "rooms",
      label: resolveFooterLabel("rooms"),
      href: `/${lang}/${getSlug("book", lang)}`,
    },
    {
      key: "experiences",
      label: resolveFooterLabel("experiences"),
      href: `/${lang}/${getSlug("experiences", lang)}`,
    },
    {
      key: "deals",
      label: resolveFooterLabel("deals"),
      href: `/${lang}/${getSlug("deals", lang)}`,
    },
  ];

  const infoLinks: FooterLink[] = [
    {
      key: "howToGetHere",
      label: resolveFooterLabel("howToGetHere"),
      href: `/${lang}/${getSlug("howToGetHere", lang)}`,
    },
    {
      key: "assistance",
      label: resolveFooterLabel("assistance"),
      href: `/${lang}/${getSlug("assistance", lang)}`,
    },
    ...(isGuideLive("travelFaqsAmalfi")
      ? [
          {
            key: "faq",
            label: resolveFooterLabel("faq"),
            href: resolveCanonicalGuideHref("travelFaqsAmalfi"),
          },
        ]
      : []),
    ...(isGuideLive("checkinCheckout")
      ? [
          {
            key: "checkinCheckout",
            label: resolveFooterLabel("checkinCheckout"),
            href: resolveCanonicalGuideHref("checkinCheckout"),
          },
        ]
      : []),
    ...(isGuideLive("rules")
      ? [
          {
            key: "houseRules",
            label: resolveFooterLabel("houseRules"),
            href: resolveCanonicalGuideHref("rules"),
          },
        ]
      : []),
    ...(isGuideLive("changingCancelling")
      ? [
          {
            key: "cancellationPolicy",
            label: resolveFooterLabel("cancellationPolicy"),
            href: resolveCanonicalGuideHref("changingCancelling"),
          },
        ]
      : []),
  ];

  const socialLinks: FooterLink[] = [
    {
      key: "instagram",
      label: resolveFooterLabel("instagram"),
      href: "https://www.instagram.com/brikettepositano",
      external: true,
      newTab: true,
    },
    {
      key: "facebook",
      label: resolveFooterLabel("facebook"),
      href: "https://www.facebook.com/hostelbrikette",
      external: true,
      newTab: true,
    },
  ];

  const backToTopLabel = resolveFooterLabel("backToTop");
  const copyright = (tFooter("copyright", {
    lng: lang,
    year: CURRENT_YEAR,
    defaultValue: resolveFooterLabel("copyright"),
  }) as string) || resolveFooterLabel("copyright");
  const noPhoneNotice = resolveFooterLabel("noPhoneNotice");
  const emailLabel = resolveFooterLabel("email");
  const emailLinkLabel = `${emailLabel}: ${CONTACT_EMAIL}`;
  const bookDirectCtaLabel = resolveFooterLabel("bookDirect", "Book direct");
  const dormsLabel = resolveFooterLabel("rooms");
  const privateBookingLabel = resolveFooterLabel("bookPrivate", PRIVATE_BOOKING_FALLBACK);
  const bookingCopy = buildIntentAwareBookingCopy({ dormsLabel, privateBookingLabel });
  const useIntentAwareBooking = shouldUseIntentAwareSharedBookingSurface(pathname, lang, currentAttribution);
  const bookingSurface = useIntentAwareBooking
    ? resolveSharedBookingSurface(lang, pathname, currentAttribution)
    : null;
  const navAriaLabel = resolveFooterLabel("navAriaLabel");

  return (
    <footer className="bg-brand-primary text-brand-bg dark:bg-brand-surface dark:text-brand-text">
      <Section as="div" padding="none" width="full" className="mx-auto max-w-6xl px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">

          {/* Column 1: Brand + address */}
          <div className="flex flex-col gap-4 sm:col-span-2 xl:col-span-1">
            <p className="text-xl font-semibold tracking-tight">{brandName}</p>
            <p className="text-sm text-brand-bg/80 dark:text-brand-text/80">{brandDescription}</p>
            {bookingSurface?.mode === "chooser" ? (
              <div className="flex flex-wrap gap-3">
                <Link
                  href={bookingSurface.hostel.href}
                  className="self-start text-sm font-medium text-brand-secondary hover:underline"
                >
                  {bookingCopy.chooser.primaryLabel} →
                </Link>
                <Link
                  href={bookingSurface.private.href}
                  className="self-start text-sm font-medium text-brand-secondary hover:underline"
                >
                  {bookingCopy.chooser.secondaryLabel} →
                </Link>
              </div>
            ) : (
              <Link
                href={bookingSurface?.mode === "direct" ? bookingSurface.primary.href : `/${lang}/${getSlug("book", lang)}`}
                className="self-start text-sm font-medium text-brand-secondary hover:underline"
              >
                {bookingSurface?.mode === "direct" && bookingSurface.primary.resolvedIntent === "private"
                  ? privateBookingLabel
                  : bookDirectCtaLabel}{" "}
                →
              </Link>
            )}
            <div className="flex flex-col gap-2 pt-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-bg/75 dark:text-brand-text/75">
                {resolveFooterLabel("locationHeading")}
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
                {resolveFooterLabel("mapLink")}
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
                  {resolveFooterLabel("exploreHeading")}
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
                  {resolveFooterLabel("infoHeading")}
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
                {resolveFooterLabel("contactHeading")}
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
                {resolveFooterLabel("follow")}
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

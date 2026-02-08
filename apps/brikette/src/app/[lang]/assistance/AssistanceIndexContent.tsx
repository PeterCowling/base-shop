"use client";

/* eslint-disable ds/no-hardcoded-copy -- PUB-05 pre-existing */
// src/app/[lang]/assistance/AssistanceIndexContent.tsx
// Client component for assistance landing page
import { type ComponentProps, memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import clsx from "clsx";
import type { TFunction } from "i18next";

import { Button } from "@acme/design-system/primitives";
import type { AssistanceQuickLinkRenderProps } from "@acme/ui/organisms/AssistanceQuickLinksSection";
import { AssistanceQuickLinksSection as AssistanceQuickLinksSectionUi } from "@acme/ui/organisms/AssistanceQuickLinksSection";

import AssistanceQuickLinksSection from "@/components/assistance/quick-links-section";
import FaqStructuredData from "@/components/seo/FaqStructuredData";
import { isGuideLive } from "@/data/guides.index";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { resolveGuideCardImage } from "@/lib/guides/guideCardImage";
import { guideHref, type GuideKey } from "@/routes.guides-helpers";
import { getGuideManifestEntry } from "@/routes/guides/guide-manifest";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

type Props = {
  lang: AppLanguage;
};

const BOOKING_LINKS = {
  googleBusiness: "https://maps.google.com/maps?cid=17733313080460471781",
  bookingCom: "https://www.booking.com/hotel/it/positano-hostel.en-gb.html",
  hostelWorld: "https://www.hostelworld.com/hostels/p/7763/hostel-brikette/",
  instagram: "https://www.instagram.com/brikettepositano",
} as const;
type BookingLinkKey = keyof typeof BOOKING_LINKS;

const BOOKING_OPTION_LABEL_FALLBACK: Record<BookingLinkKey, string> = {
  googleBusiness: "Google Business",
  bookingCom: "Booking.com",
  hostelWorld: "Hostelworld",
  instagram: "Instagram",
};

type SectionProps = ComponentProps<"section">;
const Section = ({ className, ...props }: SectionProps) => (
  <section
    className={clsx("mx-auto", "w-full", "max-w-5xl", "px-4", "sm:px-6", "lg:px-8", className)}
    {...props}
  />
);

type ContainerProps = ComponentProps<"div">;
const Container = ({ className, ...props }: ContainerProps) => <div className={clsx(className)} {...props} />;

const Stack = ({ className, ...props }: ContainerProps) => (
  <div className={clsx("flex", "flex-col", className)} {...props} />
);

const Cluster = ({ className, ...props }: ContainerProps) => (
  <div className={clsx("flex", "flex-wrap", "gap-2", className)} {...props} />
);

const BOOKING_BUTTON_CLASSNAME = clsx(
  "rounded-full",
  "border-brand-outline/50",
  "text-brand-heading",
  "hover:bg-brand-primary/10",
  "hover:text-brand-heading",
  "focus-visible:ring-brand-primary/40",
  "dark:border-brand-outline/60",
  "dark:text-brand-text",
  "dark:hover:bg-brand-primary/25",
  "dark:hover:text-brand-text",
);

const HELPFUL_GUIDE_KEYS: readonly GuideKey[] = [
  "ageAccessibility",
  "bookingBasics",
  "defectsDamages",
  "depositsPayments",
  "security",
  "travelHelp",
  "simsAtms",
  "whatToPack",
  "bestTimeToVisit",
] as const;

const POPULAR_GUIDE_KEYS: readonly GuideKey[] = [
  // How to Get Here (transport + arrival logistics)
  "naplesAirportPositanoBus",
  "positanoNaplesCenterBusTrain",
  "ferryDockToBrikette",
  "chiesaNuovaArrivals",
  // Experiences (itineraries + on-the-ground planning)
  "pathOfTheGods",
  "cheapEats",
  "dayTripsAmalfi",
  "positanoBeaches",
] as const;

type GuideCardData = {
  key: GuideKey;
  href: string;
  label: string;
  description: string;
  image: ReturnType<typeof resolveGuideCardImage>;
};

const DEFAULT_GUIDE_CARD_IMAGE = "/img/hostel-communal-terrace-lush-view.webp";

function buildGuideCardData(
  key: GuideKey,
  resolvedLang: AppLanguage,
  tGuides: TFunction<"guides">,
  tGuidesEn: TFunction<"guides">,
): GuideCardData {
  const entry = getGuideManifestEntry(key);
  const contentKey = entry?.contentKey ?? key;
  const seoKey = `content.${contentKey}.seo.description` as const;
  const descriptionCandidate = tGuides(seoKey, { defaultValue: "" }) as string;
  const descriptionEn = tGuidesEn(seoKey, { defaultValue: "" }) as string;
  const description =
    typeof descriptionCandidate === "string" && descriptionCandidate.trim().length > 0 && descriptionCandidate !== seoKey
      ? descriptionCandidate
      : typeof descriptionEn === "string" && descriptionEn.trim().length > 0 && descriptionEn !== seoKey
        ? descriptionEn
        : "";

  const image = resolveGuideCardImage(key, resolvedLang, tGuides, tGuidesEn);
  const href = guideHref(resolvedLang, key);
  const label = getGuideLinkLabel(tGuides, tGuidesEn, key);
  return { key, href, label, description, image };
}

function AssistanceIndexContent({ lang }: Props): JSX.Element {
  const routeLang = useCurrentLanguage();
  const resolvedLang = routeLang ?? lang;
  usePagePreload({
    lang: resolvedLang,
    namespaces: ["assistanceSection", "assistance", "guides", "howToGetHere"],
    optional: true,
  });
  const { t, i18n } = useTranslation("assistanceSection", { lng: resolvedLang });
  const { t: tGuides, i18n: guidesI18n } = useTranslation("guides", { lng: resolvedLang });
  const { t: tAssistance } = useTranslation("assistance", { lng: resolvedLang });
  const tGuidesEn: TFunction<"guides"> = (() => {
    const maybeFixed =
      typeof guidesI18n?.getFixedT === "function" ? guidesI18n.getFixedT("en", "guides") : undefined;
    return typeof maybeFixed === "function"
      ? (maybeFixed as TFunction<"guides">)
      : (tGuides as TFunction<"guides">);
  })();
  const tAssistanceEn: TFunction = (() => {
    const maybeFixed =
      typeof i18n?.getFixedT === "function" ? i18n.getFixedT("en", "assistance") : undefined;
    return typeof maybeFixed === "function" ? (maybeFixed as TFunction) : (tAssistance as TFunction);
  })();

  const heroIntroKey = "heroIntro" as const;
  const heroIntroRaw = t(heroIntroKey, { defaultValue: "" }) as string;
  const heroIntro =
    heroIntroRaw && heroIntroRaw !== heroIntroKey
      ? heroIntroRaw
      : (t("amaParagraph1", {
          defaultValue:
            "Message us to plan terrace evenings, hikes, or transfers; we’ll reply with curated tips and confirmations.",
        }) as string);

  const bookingOptions: Partial<Record<BookingLinkKey, string>> = (() => {
    return (t("bookingOptions", { returnObjects: true }) as Partial<Record<BookingLinkKey, string>>) || {};
  })();

  const popularGuidesHeadingKey = "popularGuides" as const;
  const popularGuidesHeadingRaw = t(popularGuidesHeadingKey, { defaultValue: "" }) as string;
  const popularGuidesHeading =
    typeof popularGuidesHeadingRaw === "string" &&
    popularGuidesHeadingRaw.trim().length > 0 &&
    popularGuidesHeadingRaw !== popularGuidesHeadingKey
      ? popularGuidesHeadingRaw
            : "Other Popular Guides";

  const helpfulGuideCards = useMemo(
    () =>
      HELPFUL_GUIDE_KEYS.filter((key) => isGuideLive(key)).map((key) =>
        buildGuideCardData(key, resolvedLang, tGuides, tGuidesEn),
      ),
    [resolvedLang, tGuides, tGuidesEn],
  );

  const popularGuideCards = useMemo(
    () =>
      POPULAR_GUIDE_KEYS.filter((key) => isGuideLive(key)).map((key) =>
        buildGuideCardData(key, resolvedLang, tGuides, tGuidesEn),
      ),
    [resolvedLang, tGuides, tGuidesEn],
  );

  const helpfulGuidesSectionItems = useMemo(
    () =>
      helpfulGuideCards.map((card) => ({
        id: card.key,
        href: card.href,
        label: card.label,
        description: card.description || card.label,
        image: card.image
          ? { src: card.image.src, alt: card.image.alt ?? card.label }
          : { src: DEFAULT_GUIDE_CARD_IMAGE, alt: card.label },
      })),
    [helpfulGuideCards],
  );

  const popularGuidesSectionItems = useMemo(
    () =>
      popularGuideCards.map((card) => ({
        id: card.key,
        href: card.href,
        label: card.label,
        description: card.description || card.label,
        image: card.image
          ? { src: card.image.src, alt: card.image.alt ?? card.label }
          : { src: DEFAULT_GUIDE_CARD_IMAGE, alt: card.label },
      })),
    [popularGuideCards],
  );

  const renderAssistanceLink = useCallback(
    ({ href, className, children, ariaLabel }: AssistanceQuickLinkRenderProps) => (
      <Link href={href} className={className} aria-label={ariaLabel}>
        {children}
      </Link>
    ),
    [],
  );

  return (
    <>
      <FaqStructuredData />
      <h1 className="sr-only">
        {t("heading", { defaultValue: "Help Centre" })}
      </h1>

      <AssistanceQuickLinksSection lang={resolvedLang} className="mt-4" />

      {/* Index of all assistance/help guides (excluding quick links above) */}
      <AssistanceQuickLinksSectionUi
        heading={tGuides("labels.helpfulGuides", { defaultValue: "Helpful Guides" })}
        readMoreLabel={tAssistance("cta.readMore", {
          defaultValue: tAssistanceEn("cta.readMore", { defaultValue: "Read more" }) as string,
        })}
        items={helpfulGuidesSectionItems}
        className="mt-6"
        renderLink={renderAssistanceLink}
      />

      <Section className="mt-10">
        <div className="rounded-3xl border border-brand-outline/20 bg-gradient-to-br from-brand-bg via-brand-bg to-brand-bg/70 p-8 shadow-sm dark:border-brand-text/10 dark:from-brand-surface/90 dark:via-brand-surface/70 dark:to-brand-text/85">
          <Stack className="gap-6 lg:flex-row lg:items-start lg:justify-between">
            <Container className="max-w-xl space-y-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary dark:text-brand-secondary">
                {t("heroEyebrow", {
                  defaultValue: t("heading", { defaultValue: "Help Centre" }) as string,
                })}
              </p>
              <h2 className="text-3xl font-bold leading-tight text-brand-heading dark:text-brand-text">
                {t("subheading", { defaultValue: "Book, explore & connect with us online." })}
              </h2>
              <p className="text-base text-brand-text/80 dark:text-brand-text/80">{heroIntro}</p>
            </Container>
            <Container className="w-full max-w-sm rounded-2xl bg-brand-bg/80 p-6 shadow-inner backdrop-blur dark:bg-brand-surface/60">
              <dl className="space-y-2 text-sm text-brand-text dark:text-brand-text">
                <div>
                  <dt className="font-semibold text-brand-heading dark:text-brand-text">
                    {t("addressLabel", { defaultValue: "Address" })}
                  </dt>
                  <dd>{t("addressValue", { defaultValue: "Via Marconi 358, Positano 84017 SA" })}</dd>
                </div>
              </dl>
              <p className="mt-5 text-sm font-semibold text-brand-heading dark:text-brand-text">
                {t("otherBookingOptions", { defaultValue: "Other booking options" })}
              </p>
              <Cluster className="mt-3">
                {(Object.entries(BOOKING_LINKS) as [BookingLinkKey, string][])
                  .map(([key, href]) => {
                    const label = bookingOptions[key] ?? BOOKING_OPTION_LABEL_FALLBACK[key];
                    return (
                      <Button
                        key={key}
                        asChild
                        tone="outline"
                        color="primary"
                        size="sm"
                        className={BOOKING_BUTTON_CLASSNAME}
                      >
                        <a href={href} target="_blank" rel="noopener noreferrer">
                          {label}
                        </a>
                      </Button>
                    );
                  })}
              </Cluster>
            </Container>
          </Stack>
        </div>
      </Section>

      {/* Popular guides cluster for internal linking */}
      <AssistanceQuickLinksSectionUi
        heading={popularGuidesHeading}
        readMoreLabel={tAssistance("cta.readMore", {
          defaultValue: tAssistanceEn("cta.readMore", { defaultValue: "Read more" }) as string,
        })}
        items={popularGuidesSectionItems}
        className="mb-10 mt-6"
        renderLink={renderAssistanceLink}
      />

    </>
  );
}

export default memo(AssistanceIndexContent);

"use client";

/* eslint-disable ds/no-hardcoded-copy -- PUB-05 pre-existing */
// src/app/[lang]/assistance/AssistanceIndexContent.tsx
// Client component for assistance landing page
import { type ComponentProps, memo, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import clsx from "clsx";
import type { TFunction } from "i18next";

import { Button } from "@acme/design-system/primitives";
import type { AssistanceQuickLinkRenderProps } from "@acme/ui/organisms/AssistanceQuickLinksSection";
import { AssistanceQuickLinksSection as AssistanceQuickLinksSectionUi } from "@acme/ui/organisms/AssistanceQuickLinksSection";

import { BookingOptionsButtons } from "@/components/assistance/BookingOptionsButtons";
import AssistanceQuickLinksSection from "@/components/assistance/quick-links-section";
import ContentStickyCta from "@/components/cta/ContentStickyCta";
import FaqStructuredData from "@/components/seo/FaqStructuredData";
import { isGuideLive } from "@/data/guides.index";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { useEntryAttribution } from "@/hooks/useEntryAttribution";
import { usePagePreload } from "@/hooks/usePagePreload";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { resolveGuideCardImage } from "@/lib/guides/guideCardImage";
import { guideHref, type GuideKey } from "@/routes.guides-helpers";
import { getGuideManifestEntry } from "@/routes/guides/guide-manifest";
import { writeAttribution } from "@/utils/entryAttribution";
import { HEADER_BOOKING_OPTIONS_ID } from "@/utils/headerPrimaryCtaTarget";
import { buildIntentAwareBookingCopy } from "@/utils/intentAwareBookingCopy";
import { resolveIntentAwareBookingSurface } from "@/utils/intentAwareBookingSurface";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

import type { AssistanceIndexI18nSeed } from "./i18n-bundle";

type Props = {
  lang: AppLanguage;
  serverI18n?: AssistanceIndexI18nSeed;
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

function seedBundle(lang: string, namespace: string, bundle: Record<string, unknown> | undefined): void {
  if (!bundle || Object.keys(bundle).length === 0) return;
  i18n.addResourceBundle(lang, namespace, bundle, true, true);
}

function resolvePopularGuidesHeading(t: TFunction<"assistanceSection">): string {
  const popularGuidesHeadingKey = "popularGuides" as const;
  const popularGuidesHeadingRaw = t(popularGuidesHeadingKey, { defaultValue: "" }) as string;
  if (
    typeof popularGuidesHeadingRaw === "string" &&
    popularGuidesHeadingRaw.trim().length > 0 &&
    popularGuidesHeadingRaw !== popularGuidesHeadingKey
  ) {
    return popularGuidesHeadingRaw;
  }

  return "Other Popular Guides";
}

function AssistanceBookingActions({
  bookingSurface,
  chooserLabel,
  dormsLabel,
  privateBookingLabel,
  onSelect,
}: {
  bookingSurface: ReturnType<typeof resolveIntentAwareBookingSurface>;
  chooserLabel: string;
  dormsLabel: string;
  privateBookingLabel: string;
  onSelect: (input: {
    href: string;
    resolvedIntent: "hostel" | "private";
    productType: string | null;
    decisionMode: "direct_resolution" | "chooser";
    destinationFunnel: "hostel_central" | "private";
  }) => void;
}): JSX.Element {
  if (bookingSurface.mode === "direct") {
    return (
      <Button asChild size="sm" className="w-full">
        <Link
          href={bookingSurface.primary.href}
          onClick={() => onSelect(bookingSurface.primary)}
        >
          {bookingSurface.primary.resolvedIntent === "private" ? privateBookingLabel : dormsLabel}
        </Link>
      </Button>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <p className="sm:col-span-2 text-sm font-medium text-brand-text/80 dark:text-brand-text/80">
        {chooserLabel}
      </p>
      <Button asChild size="sm" className="w-full">
        <Link
          href={bookingSurface.hostel.href}
          onClick={() => onSelect(bookingSurface.hostel)}
        >
          {dormsLabel}
        </Link>
      </Button>
      <Button asChild size="sm" tone="outline" className="w-full">
        <Link
          href={bookingSurface.private.href}
          onClick={() => onSelect(bookingSurface.private)}
        >
          {privateBookingLabel}
        </Link>
      </Button>
    </div>
  );
}

function AssistanceBookingPanel({
  assistanceBookingPanel,
  bookingCopy,
  bookingOptions,
  bookingSurface,
  buttonClassName,
  dormsLabel,
  onSelect,
  privateBookingLabel,
  translate,
}: {
  assistanceBookingPanel: ReturnType<typeof buildIntentAwareBookingCopy>["chooser"];
  bookingCopy: ReturnType<typeof buildIntentAwareBookingCopy>;
  bookingOptions: Partial<Record<string, string>>;
  bookingSurface: ReturnType<typeof resolveIntentAwareBookingSurface>;
  buttonClassName: string;
  dormsLabel: string;
  onSelect: (input: {
    href: string;
    resolvedIntent: "hostel" | "private";
    productType: string | null;
    decisionMode: "direct_resolution" | "chooser";
    destinationFunnel: "hostel_central" | "private";
  }) => void;
  privateBookingLabel: string;
  translate: TFunction<"assistanceSection">;
}): JSX.Element {
  return (
    <Section id={HEADER_BOOKING_OPTIONS_ID} className="mt-8">
      <div className="rounded-3xl border border-brand-outline/20 bg-gradient-to-br from-brand-surface/60 via-brand-bg to-brand-bg p-8 shadow-sm dark:border-brand-outline/20 dark:from-brand-surface/90 dark:via-brand-surface/70 dark:to-brand-surface/50">
        <Stack className="gap-6 lg:flex-row lg:items-start lg:justify-between">
          <Container className="max-w-xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary dark:text-brand-secondary">
              {translate("heroEyebrow", {
                defaultValue: translate("heading", { defaultValue: "Help Centre" }) as string,
              })}
            </p>
            <h2 className="text-3xl font-bold leading-tight text-brand-heading dark:text-brand-text">
              {assistanceBookingPanel.heading}
            </h2>
            <p className="text-base text-brand-text/80 dark:text-brand-text/80">
              {assistanceBookingPanel.subcopy}
            </p>
          </Container>
          <Container className="w-full max-w-sm rounded-2xl bg-brand-bg/80 p-6 shadow-inner backdrop-blur dark:bg-brand-surface/60">
            <dl className="space-y-2 text-sm text-brand-text dark:text-brand-text">
              <div>
                <dt className="font-semibold text-brand-heading dark:text-brand-text">
                  {translate("addressLabel", { defaultValue: "Address" })}
                </dt>
                <dd>{translate("addressValue", { defaultValue: "Via G. Marconi, 358, 84017, Positano" })}</dd>
              </div>
            </dl>
            <div className="mt-5">
              <AssistanceBookingActions
                bookingSurface={bookingSurface}
                chooserLabel={bookingCopy.chooser.subcopy}
                dormsLabel={dormsLabel}
                privateBookingLabel={privateBookingLabel}
                onSelect={onSelect}
              />
            </div>
            <p className="mt-4 text-sm font-semibold text-brand-heading dark:text-brand-text">
              {translate("otherBookingOptions", { defaultValue: "Other booking options" })}
            </p>
            <Cluster className="mt-3">
              <BookingOptionsButtons
                bookingOptions={bookingOptions}
                buttonClassName={buttonClassName}
              />
            </Cluster>
          </Container>
        </Stack>
      </div>
    </Section>
  );
}

function AssistanceIndexContent({ lang, serverI18n }: Props): JSX.Element {
  const seededRef = useRef(false);
  if (!seededRef.current && serverI18n) {
    if (serverI18n.namespaces) {
      for (const [namespace, bundle] of Object.entries(serverI18n.namespaces)) {
        seedBundle(serverI18n.lang, namespace, bundle);
      }
    }
    if (serverI18n.namespacesEn) {
      for (const [namespace, bundle] of Object.entries(serverI18n.namespacesEn)) {
        seedBundle("en", namespace, bundle);
      }
    }
    seedBundle(serverI18n.lang, "guides", serverI18n.guides);
    seedBundle("en", "guides", serverI18n.guidesEn);
    seededRef.current = true;
  }

  const resolvedLang = useCurrentLanguage() ?? lang;
  const currentAttribution = useEntryAttribution();
  usePagePreload({
    lang: resolvedLang,
    namespaces: ["assistanceSection", "assistance", "guides", "howToGetHere"],
    optional: true,
  });
  const { t, i18n } = useTranslation("assistanceSection", { lng: resolvedLang });
  const { t: tGuides, i18n: guidesI18n } = useTranslation("guides", { lng: resolvedLang });
  const { t: tAssistance } = useTranslation("assistance", { lng: resolvedLang });
  const { t: tHeader } = useTranslation("header", { lng: resolvedLang });
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
  const bookingOptions =
    (t("bookingOptions", { returnObjects: true }) as Partial<Record<string, string>>) || {};
  const popularGuidesHeading = resolvePopularGuidesHeading(t);
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

  const bookingSurface = useMemo(
    () => resolveIntentAwareBookingSurface(resolvedLang, currentAttribution),
    [currentAttribution, resolvedLang],
  );
  const dormsLabel = (tHeader("rooms", { defaultValue: "Dorms" }) as string) || "Dorms";
  const privateBookingLabel =
    (tHeader("navChildren.apartment.bookPrivate", {
      defaultValue: "Book private accommodations",
    }) as string) || "Book private accommodations";
  const bookingCopy = useMemo(
    () => buildIntentAwareBookingCopy({ dormsLabel, privateBookingLabel }),
    [dormsLabel, privateBookingLabel],
  );
  const assistanceBookingPanel = bookingSurface.mode === "direct"
    ? bookingSurface.primary.resolvedIntent === "private"
      ? bookingCopy.direct.private
      : bookingCopy.direct.hostel
    : bookingCopy.chooser;
  const handleBookingSelection = useCallback((input: {
    href: string;
    resolvedIntent: "hostel" | "private";
    productType: string | null;
    decisionMode: "direct_resolution" | "chooser";
    destinationFunnel: "hostel_central" | "private";
  }) => {
    writeAttribution({
      source_surface: "assistance",
      source_cta: "assistance_primary_booking",
      resolved_intent: input.resolvedIntent,
      product_type: input.productType,
      decision_mode: input.decisionMode,
      destination_funnel: input.destinationFunnel,
      locale: resolvedLang,
      fallback_triggered: false,
      next_page: input.href,
    });
  }, [resolvedLang]);

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
      <Section className="mt-8 mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-brand-heading dark:text-brand-text sm:text-4xl">
          {t("heading", { defaultValue: "Help Centre" })}
        </h1>
        <p className="mt-2 text-base text-brand-text/80 dark:text-brand-text/70">
          {t("heroIntro", {
            defaultValue: "Get instant answers from our team so you can plan your stay faster.",
          })}
        </p>
      </Section>

      <AssistanceQuickLinksSection lang={resolvedLang} className="mt-2" />

      {/* Index of all assistance/help guides (excluding quick links above) */}
      <AssistanceQuickLinksSectionUi
        heading={tGuides("labels.helpfulGuides", { defaultValue: "Helpful Guides" })}
        readMoreLabel={tAssistance("cta.readMore", {
          defaultValue: tAssistanceEn("cta.readMore", { defaultValue: "Read more" }) as string,
        })}
        items={helpfulGuidesSectionItems}
        className="mt-8"
        renderLink={renderAssistanceLink}
      />

      <AssistanceBookingPanel
        assistanceBookingPanel={assistanceBookingPanel}
        bookingCopy={bookingCopy}
        bookingOptions={bookingOptions}
        bookingSurface={bookingSurface}
        buttonClassName={BOOKING_BUTTON_CLASSNAME}
        dormsLabel={dormsLabel}
        onSelect={handleBookingSelection}
        privateBookingLabel={privateBookingLabel}
        translate={t}
      />

      {/* Popular guides cluster for internal linking */}
      <AssistanceQuickLinksSectionUi
        heading={popularGuidesHeading}
        readMoreLabel={tAssistance("cta.readMore", {
          defaultValue: tAssistanceEn("cta.readMore", { defaultValue: "Read more" }) as string,
        })}
        items={popularGuidesSectionItems}
        className="mb-10 mt-8"
        renderLink={renderAssistanceLink}
      />

      <ContentStickyCta lang={resolvedLang} ctaLocation="assistance" />
    </>
  );
}

export default memo(AssistanceIndexContent);

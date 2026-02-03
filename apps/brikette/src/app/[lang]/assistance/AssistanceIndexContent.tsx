"use client";

// src/app/[lang]/assistance/AssistanceIndexContent.tsx
// Client component for assistance landing page
import { type ComponentProps, memo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import clsx from "clsx";
import type { TFunction } from "i18next";

import { Button } from "@acme/design-system/primitives";

import AssistanceQuickLinksSection from "@/components/assistance/quick-links-section";
import FaqStructuredData from "@/components/seo/FaqStructuredData";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import type { AppLanguage } from "@/i18n.config";
import { guideHref } from "@/routes.guides-helpers";
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

function AssistanceIndexContent({ lang }: Props): JSX.Element {
  const routeLang = useCurrentLanguage();
  const resolvedLang = routeLang ?? lang;
  const { t, i18n, ready } = useTranslation("assistanceSection", { lng: resolvedLang });
  const { t: tGuides, i18n: guidesI18n } = useTranslation("guides", { lng: resolvedLang });
  const guidesEnT: TFunction = (() => {
    const maybeFixed =
      typeof guidesI18n?.getFixedT === "function" ? guidesI18n.getFixedT("en", "guides") : undefined;
    return typeof maybeFixed === "function" ? (maybeFixed as TFunction) : (tGuides as TFunction);
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
    if (!ready) return {};
    return (t("bookingOptions", { returnObjects: true }) as Partial<Record<BookingLinkKey, string>>) || {};
  })();

  return (
    <>
      <FaqStructuredData />
      <h1 className="sr-only">
        {t("heading", { defaultValue: "Help Centre" })}
      </h1>

      <Section className="mt-4">
        <div className="rounded-3xl border border-brand-outline/20 bg-gradient-to-br from-brand-bg via-brand-bg to-brand-bg/70 p-8 shadow-sm dark:border-brand-text/10 dark:from-brand-surface/90 dark:via-brand-surface/70 dark:to-brand-text/85">
          <Stack className="gap-6 lg:flex-row lg:items-start lg:justify-between">
            <Container className="max-w-xl space-y-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary dark:text-brand-secondary">
                {t("heading", { defaultValue: "Help Centre" })}
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
                  .filter(([key]) => bookingOptions?.[key])
                  .map(([key, href]) => {
                    const label = bookingOptions[key]!;
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

      <AssistanceQuickLinksSection lang={resolvedLang} />

      {/* Popular guides cluster for internal linking */}
      <Section className="mb-10 mt-4">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-brand-heading dark:text-brand-text">
          {t("popularGuides")}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <li>
            <Link
              href={guideHref(resolvedLang, "reachBudget")}
              className="block min-h-10 min-w-10 rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {t("guideReachBudget")}
            </Link>
          </li>
          <li>
            <Link
              href={guideHref(resolvedLang, "ferrySchedules")}
              className="block min-h-10 min-w-10 rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {t("guideFerrySchedules")}
            </Link>
          </li>
          <li>
            <Link
              href={guideHref(resolvedLang, "pathOfTheGods")}
              className="block min-h-10 min-w-10 rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {t("guidePathOfTheGods")}
            </Link>
          </li>
        </ul>
      </Section>

      {/* Also see: deeper budget content + hostel intro */}
      <Section className="mb-10 mt-2">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-brand-heading dark:text-brand-text">
          {tGuides("labels.alsoSee")}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
          <li>
            <Link
              href={guideHref(resolvedLang, "onlyHostel")}
              className="block min-h-10 min-w-10 rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {getGuideLinkLabel(tGuides, guidesEnT, "onlyHostel")}
            </Link>
          </li>
        </ul>
      </Section>
    </>
  );
}

export default memo(AssistanceIndexContent);

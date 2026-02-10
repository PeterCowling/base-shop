"use client";

// src/app/[lang]/rooms/[id]/RoomDetailContent.tsx
// Client component for room detail page (uses useTranslation hooks)
import { type ComponentProps, type ComponentPropsWithoutRef, Fragment } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import type { TFunction } from "i18next";

import { DirectBookingPerks } from "@acme/ui/molecules";
import StickyBookNow from "@acme/ui/organisms/StickyBookNow";

import LocationInline from "@/components/booking/LocationInline";
import RoomCard from "@/components/rooms/RoomCard";
import RoomStructuredData from "@/components/seo/RoomStructuredData";
import roomsData, { type RoomId } from "@/data/roomsData";
import { usePagePreload } from "@/hooks/usePagePreload";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { guideHref } from "@/routes.guides-helpers";
import { getDatePlusTwoDays, getTodayIso } from "@/utils/dateUtils";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

type Props = {
  lang: AppLanguage;
  id: RoomId;
};

type HeroContent = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  bullets?: string[];
};

type OutlineContent = {
  heading?: string;
  items?: { title?: string; body?: string }[];
};

type AmenityContent = { title?: string; body?: string };

type GridAsDivProps = ComponentPropsWithoutRef<"div"> & { as?: "div" };
type GridAsUlProps = ComponentPropsWithoutRef<"ul"> & { as: "ul" };
type GridProps = GridAsDivProps | GridAsUlProps;

function resolveCopy(value: unknown, key: string, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed === key) return fallback;
  if (/^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/u.test(trimmed)) return fallback;
  if (/^[A-Z0-9_]+(?:\.[A-Z0-9_]+)+$/u.test(trimmed)) return fallback;
  return trimmed;
}

function Grid(props: GridProps) {
  if (props.as === "ul") {
    const { as: _ignore, ...rest } = props;
    return <ul {...rest} />;
  }
  const { as: _ignore, ...rest } = props;
  return <div {...rest} />;
}

const Section = ({ children, ...rest }: ComponentProps<"section">) => (
  <section {...rest}>{children}</section>
);

function HeroSection({ hero }: { hero: HeroContent | null }) {
  if (!hero || !(hero.eyebrow || hero.title || hero.subtitle || hero.bullets?.length)) {
    return null;
  }

  return (
    <Section className="mx-auto mt-6 max-w-3xl px-4 text-brand-heading dark:text-brand-surface">
      {hero.eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-primary dark:text-brand-secondary">
          {hero.eyebrow}
        </p>
      ) : null}
      {hero.title ? (
        <p className="mt-3 text-3xl font-extrabold text-brand-primary dark:text-brand-secondary">
          {hero.title}
        </p>
      ) : null}
      {hero.subtitle ? (
        <p className="mt-2 text-lg text-brand-text dark:text-brand-surface/90">{hero.subtitle}</p>
      ) : null}
      {hero.bullets?.length ? (
        <Grid as="ul" className="mt-5 grid gap-3 sm:grid-cols-2">
          {hero.bullets.map((bullet, idx) => (
            <li
              key={`${bullet}-${idx}`}
              className="rounded-lg border border-brand-surface/60 bg-brand-bg/80 p-4 text-sm font-medium text-brand-text shadow-sm backdrop-blur dark:border-brand-surface/20 dark:bg-brand-text/90 dark:text-brand-surface"
            >
              {bullet}
            </li>
          ))}
        </Grid>
      ) : null}
    </Section>
  );
}

function OutlineSection({ outline }: { outline: OutlineContent | null }) {
  if (!outline || !(outline.heading || outline.items?.length)) {
    return null;
  }

  return (
    <Section className="mx-auto mt-8 max-w-3xl px-4">
      {outline.heading ? (
        <h2 className="text-lg font-semibold text-brand-heading dark:text-brand-surface">
          {outline.heading}
        </h2>
      ) : null}
      <div className="mt-4 space-y-4">
        {outline.items?.map((item, idx) => (
          <article
            key={`${item.title ?? "outline"}-${idx}`}
            className="rounded-lg border border-brand-surface/60 bg-brand-bg p-4 shadow-sm dark:border-brand-surface/20 dark:bg-brand-text"
          >
            {item.title ? (
              <h3 className="text-base font-semibold text-brand-heading dark:text-brand-secondary">
                {item.title}
              </h3>
            ) : null}
            {item.body ? (
              <p className="mt-2 text-sm leading-relaxed text-brand-text dark:text-brand-surface/90">
                {item.body}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </Section>
  );
}

function AmenitiesSection({
  shouldRender,
  heading,
  intro,
  blurbs,
}: {
  shouldRender: boolean;
  heading: string;
  intro: string;
  blurbs: AmenityContent[];
}) {
  if (!shouldRender) {
    return null;
  }

  return (
    <Section className="mx-auto mt-8 max-w-3xl px-4">
      {heading ? (
        <h2 className="text-lg font-semibold text-brand-heading dark:text-brand-surface">
          {heading}
        </h2>
      ) : null}
      {intro ? (
        <p className="mt-2 text-sm text-brand-text/80 dark:text-brand-surface/80">{intro}</p>
      ) : null}
      {blurbs.length ? (
        <Grid className="mt-4 grid gap-4 md:grid-cols-2">
          {blurbs.map((item, idx) => (
            <div
              key={`${item.title ?? "amenity"}-${idx}`}
              className="rounded-lg border border-brand-surface/60 bg-brand-bg p-4 shadow-sm dark:border-brand-surface/20 dark:bg-brand-text"
            >
              {item.title ? (
                <h3 className="text-base font-semibold text-brand-heading dark:text-brand-secondary">
                  {item.title}
                </h3>
              ) : null}
              {item.body ? (
                <p className="mt-2 text-sm leading-relaxed text-brand-text dark:text-brand-surface/90">
                  {item.body}
                </p>
              ) : null}
            </div>
          ))}
        </Grid>
      ) : null}
    </Section>
  );
}

export default function RoomDetailContent({ lang, id }: Props) {
  const { t } = useTranslation("roomsPage", { lng: lang, useSuspense: true });
  const { t: tGuides } = useTranslation("guides", { lng: lang, useSuspense: true });
  const guidesEnT = i18n.getFixedT("en", "guides") as TFunction;
  const { t: tRoomsPageDetail } = useTranslation("pages.rooms", { lng: lang, useSuspense: true });
  const { t: tRoomDetail } = useTranslation("rooms", { lng: lang, useSuspense: true });
  usePagePreload({
    lang,
    namespaces: ["roomsPage", "guides", "pages.rooms", "rooms"],
    optionalNamespaces: ["assistanceCommon", "modals", "ratingsBar"],
  });
  const room = roomsData.find((r) => r.id === id)!;
  const checkIn = getTodayIso();
  const checkOut = getDatePlusTwoDays(checkIn);
  const adults = 1;
  const roomTitleKey = `rooms.${id}.title`;
  const bedDescriptionKey = `rooms.${id}.bed_description`;

  const title = resolveCopy(t(roomTitleKey), roomTitleKey, id.replace(/_/gu, " "));

  const heroRaw = tRoomsPageDetail(`detail.${id}.hero`, { returnObjects: true });
  const hero =
    heroRaw && typeof heroRaw === "object" && !Array.isArray(heroRaw)
      ? (heroRaw as HeroContent)
      : null;

  const outlineRaw = tRoomsPageDetail(`detail.${id}.outline`, { returnObjects: true });
  const outline =
    outlineRaw && typeof outlineRaw === "object" && !Array.isArray(outlineRaw)
      ? (outlineRaw as OutlineContent)
      : null;

  const amenityRaw = tRoomDetail(`detail.${id}.amenities`, { returnObjects: true });
  const isAmenityArray = Array.isArray(amenityRaw);
  const amenityBlurbs = isAmenityArray ? (amenityRaw as AmenityContent[]) : [];

  const amenitiesHeading = resolveCopy(
    tRoomDetail("detail.common.amenitiesHeading"),
    "detail.common.amenitiesHeading",
  );
  const amenitiesIntro = resolveCopy(
    tRoomDetail("detail.common.amenitiesIntro"),
    "detail.common.amenitiesIntro",
  );
  const hasFallbackCopy = !isAmenityArray && Boolean(amenityRaw) && Boolean(amenitiesHeading || amenitiesIntro);
  const shouldRenderAmenities = amenityBlurbs.length > 0 || hasFallbackCopy;

  return (
    <Fragment>
      <RoomStructuredData room={room} lang={lang} />
      <h1 className="sr-only" aria-hidden="true">{title}</h1>

      <HeroSection hero={hero} />

      <RoomCard room={room} checkIn={checkIn} checkOut={checkOut} adults={adults} lang={lang} />

      <Section className="mx-auto max-w-3xl px-4">
        <p className="mt-6 text-base leading-relaxed">
          {resolveCopy(t(bedDescriptionKey), bedDescriptionKey)}
        </p>
        <div className="mt-4">
          <DirectBookingPerks lang={lang} />
          <LocationInline lang={lang} />
        </div>
      </Section>

      <OutlineSection outline={outline} />

      <AmenitiesSection
        shouldRender={shouldRenderAmenities}
        heading={amenitiesHeading}
        intro={amenitiesIntro}
        blurbs={amenityBlurbs}
      />

      <Section className="mx-auto mt-8 max-w-3xl px-4">
        <h2 className="mb-3 text-lg font-semibold text-brand-heading dark:text-brand-surface">
          {tGuides("labels.helpfulGuides")}
        </h2>
        <Grid as="ul" className="grid gap-3 sm:grid-cols-2">
          <li>
            <Link
              href={guideHref(lang, "reachBudget")}
              prefetch={true}
              className="block rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {getGuideLinkLabel(tGuides, guidesEnT, "reachBudget")}
            </Link>
          </li>
        </Grid>
      </Section>

      {/* Spacer so the sticky CTA doesn't cover footer content on small screens */}
      <div className="h-20 sm:hidden" aria-hidden />
      <StickyBookNow lang={lang} />
    </Fragment>
  );
}

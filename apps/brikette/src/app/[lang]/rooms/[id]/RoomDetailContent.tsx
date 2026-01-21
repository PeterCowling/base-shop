"use client";

// src/app/[lang]/rooms/[id]/RoomDetailContent.tsx
// Client component for room detail page (uses useTranslation hooks)
import { type ComponentProps, type ComponentPropsWithoutRef,Fragment, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import type { TFunction } from "i18next";

import { DirectBookingPerks } from "@acme/ui/molecules/DirectBookingPerks";
import StickyBookNow from "@acme/ui/organisms/StickyBookNow";

import LocationInline from "@/components/booking/LocationInline";
import RoomCard from "@/components/rooms/RoomCard";
import RoomStructuredData from "@/components/seo/RoomStructuredData";
import roomsData, { type RoomId } from "@/data/roomsData";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { guideHref } from "@/routes.guides-helpers";
import { getDatePlusTwoDays, getTodayIso } from "@/utils/dateUtils";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

type Props = {
  lang: AppLanguage;
  id: RoomId;
};

export default function RoomDetailContent({ lang, id }: Props) {
  const { t } = useTranslation("roomsPage", { lng: lang });
  const { t: tGuides } = useTranslation("guides", { lng: lang });
  const guidesEnT = useMemo<TFunction>(
    () => i18n.getFixedT("en", "guides") as TFunction,
    []
  );
  const { t: tRoomsPageDetail } = useTranslation("pages.rooms", { lng: lang });
  const { t: tRoomDetail } = useTranslation("rooms", { lng: lang });
  const room = roomsData.find((r) => r.id === id)!;
  const checkIn = getTodayIso();
  const checkOut = getDatePlusTwoDays(checkIn);
  const adults = 1;

  const title = t(`rooms.${id}.title`) as string;

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

  const amenitiesHeading = tRoomDetail("detail.common.amenitiesHeading");
  const amenitiesIntro = tRoomDetail("detail.common.amenitiesIntro");
  const hasFallbackCopy = !isAmenityArray && Boolean(amenityRaw) && Boolean(amenitiesHeading || amenitiesIntro);
  const shouldRenderAmenities = amenityBlurbs.length > 0 || hasFallbackCopy;

  type GridAsDivProps = ComponentPropsWithoutRef<"div"> & { as?: "div" };
  type GridAsUlProps = ComponentPropsWithoutRef<"ul"> & { as: "ul" };
  type GridProps = GridAsDivProps | GridAsUlProps;

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

  return (
    <Fragment>
      <RoomStructuredData room={room} lang={lang} />
      <h1 className="sr-only" aria-hidden="true">{title}</h1>

      {hero && (hero.eyebrow || hero.title || hero.subtitle || hero.bullets?.length) ? (
        <Section className="mx-auto mt-6 max-w-3xl px-4 text-brand-heading dark:text-brand-surface">
          {hero.eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-secondary dark:text-brand-bougainvillea">
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
      ) : null}

      <RoomCard room={room} checkIn={checkIn} checkOut={checkOut} adults={adults} lang={lang} />

      <Section className="mx-auto max-w-3xl px-4">
        <p className="mt-6 text-base leading-relaxed">{t(`rooms.${id}.bed_description`)}</p>
        <div className="mt-4">
          <DirectBookingPerks lang={lang} />
          <LocationInline lang={lang} />
        </div>
      </Section>

      {outline && (outline.heading || outline.items?.length) ? (
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
      ) : null}

      {shouldRenderAmenities ? (
        <Section className="mx-auto mt-8 max-w-3xl px-4">
          {amenitiesHeading ? (
            <h2 className="text-lg font-semibold text-brand-heading dark:text-brand-surface">
              {amenitiesHeading}
            </h2>
          ) : null}
          {amenitiesIntro ? (
            <p className="mt-2 text-sm text-brand-text/80 dark:text-brand-surface/80">{amenitiesIntro}</p>
          ) : null}
          {amenityBlurbs.length ? (
            <Grid className="mt-4 grid gap-4 md:grid-cols-2">
              {amenityBlurbs.map((item, idx) => (
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
      ) : null}

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
          <li>
            <Link
              href={guideHref(lang, "backpackerItineraries")}
              prefetch={true}
              className="block rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {getGuideLinkLabel(tGuides, guidesEnT, "backpackerItineraries")}
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

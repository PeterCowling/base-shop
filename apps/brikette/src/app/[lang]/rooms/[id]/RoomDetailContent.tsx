"use client";

// src/app/[lang]/rooms/[id]/RoomDetailContent.tsx
// Client component for room detail page (uses useTranslation hooks)
import { type ComponentProps, type ComponentPropsWithoutRef, Fragment, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { TFunction } from "i18next";

import { DirectBookingPerks } from "@acme/ui/molecules";
import StickyBookNow, { type StickyBookNowClickContext } from "@acme/ui/organisms/StickyBookNow";

import LocationInline from "@/components/booking/LocationInline";
import SocialProofSection from "@/components/landing/SocialProofSection";
import RoomCard from "@/components/rooms/RoomCard";
import RoomStructuredData from "@/components/seo/RoomStructuredData";
import roomsData, { type RoomId } from "@/data/roomsData";
import { usePagePreload } from "@/hooks/usePagePreload";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { guideHref } from "@/routes.guides-helpers";
import {
  getMinCheckoutForStay,
  isValidPax,
  isValidStayRange,
} from "@/utils/bookingDateRules";
import { getDatePlusTwoDays, getTodayIso } from "@/utils/dateUtils";
import { buildRoomItem, fireViewItem } from "@/utils/ga4-events";
import { trackThenNavigate } from "@/utils/trackThenNavigate";
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
              className="rounded-lg border border-brand-surface/60 bg-brand-bg/80 p-4 text-sm font-medium text-brand-text shadow-sm backdrop-blur dark:border-brand-surface/20 dark:bg-brand-surface dark:text-brand-text"
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
            className="rounded-lg border border-brand-surface/60 bg-brand-bg p-4 shadow-sm dark:border-brand-surface/20 dark:bg-brand-surface"
          >
            {item.title ? (
              <h3 className="text-base font-semibold text-brand-heading dark:text-brand-secondary">
                {item.title}
              </h3>
            ) : null}
            {item.body ? (
              <p className="mt-2 text-sm leading-relaxed text-brand-text dark:text-brand-text/80">
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
              className="rounded-lg border border-brand-surface/60 bg-brand-bg p-4 shadow-sm dark:border-brand-surface/20 dark:bg-brand-surface"
            >
              {item.title ? (
                <h3 className="text-base font-semibold text-brand-heading dark:text-brand-secondary">
                  {item.title}
                </h3>
              ) : null}
              {item.body ? (
                <p className="mt-2 text-sm leading-relaxed text-brand-text dark:text-brand-text/80">
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

type BookingQuery = { checkIn: string; checkOut: string; adults: number; queryState: "valid" | "absent" };

function parseBookingQuery(
  searchParams: { get: (key: string) => string | null } | null,
  todayIso: string,
): BookingQuery {
  const checkInParam = searchParams?.get("checkin");
  const checkIn = checkInParam && getMinCheckoutForStay(checkInParam) ? checkInParam : todayIso;
  const checkOutRaw = searchParams?.get("checkout") ?? getDatePlusTwoDays(checkIn);
  const checkOut = checkOutRaw;
  const adultsRaw = parseInt(searchParams?.get("pax") ?? "", 10);
  const adults = Number.isFinite(adultsRaw) && adultsRaw > 0 ? adultsRaw : 1;
  const hasCheckIn = Boolean(checkInParam) && checkInParam === checkIn;
  const queryState: "valid" | "absent" =
    hasCheckIn && checkIn >= todayIso && isValidStayRange(checkIn, checkOut) && isValidPax(adults)
      ? "valid"
      : "absent";
  return { checkIn, checkOut, adults, queryState };
}

function coerceToContent<T>(raw: unknown): T | null {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as T) : null;
}

function resolveAmenitiesSection(
  amenityRaw: unknown,
  heading: string,
  intro: string,
): { blurbs: AmenityContent[]; shouldRender: boolean } {
  const isArray = Array.isArray(amenityRaw);
  const blurbs = isArray ? (amenityRaw as AmenityContent[]) : [];
  const hasFallback = !isArray && Boolean(amenityRaw) && Boolean(heading || intro);
  return { blurbs, shouldRender: blurbs.length > 0 || hasFallback };
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
  const searchParams = useSearchParams();
  const room = roomsData.find((r) => r.id === id)!;
  const todayIso = getTodayIso();
  const { checkIn, checkOut, adults, queryState } = parseBookingQuery(searchParams, todayIso);
  const roomTitleKey = `rooms.${id}.title`;
  const bedDescriptionKey = `rooms.${id}.bed_description`;

  const title = resolveCopy(t(roomTitleKey), roomTitleKey, id.replace(/_/gu, " "));

  const hero = coerceToContent<HeroContent>(tRoomsPageDetail(`detail.${id}.hero`, { returnObjects: true }));
  const outline = coerceToContent<OutlineContent>(tRoomsPageDetail(`detail.${id}.outline`, { returnObjects: true }));

  const amenitiesHeading = resolveCopy(
    tRoomDetail("detail.common.amenitiesHeading"),
    "detail.common.amenitiesHeading",
  );
  const amenitiesIntro = resolveCopy(
    tRoomDetail("detail.common.amenitiesIntro"),
    "detail.common.amenitiesIntro",
  );
  const { blurbs: amenityBlurbs, shouldRender: shouldRenderAmenities } = resolveAmenitiesSection(
    tRoomDetail(`detail.${id}.amenities`, { returnObjects: true }),
    amenitiesHeading,
    amenitiesIntro,
  );

  const onStickyCheckoutClick = useCallback(
    (ctx: StickyBookNowClickContext) => {
      // TC-03: fire begin_checkout with room item context, then proceed via trackThenNavigate
      trackThenNavigate(
        "begin_checkout",
        {
          source: "sticky_cta",
          items: [buildRoomItem({ roomSku: room.sku, itemName: title })],
        },
        ctx.proceed,
      );
    },
    [room.sku, title],
  );

  // Fire view_item once per navigation
  useEffect(() => {
    fireViewItem({ itemId: room.sku, itemName: title });
  }, [room.sku, title]);

  return (
    <Fragment>
      <RoomStructuredData room={room} lang={lang} />
      <h1 className="mx-auto mt-6 px-4 text-3xl font-extrabold text-brand-primary dark:text-brand-secondary">
        {title}
      </h1>

      <HeroSection hero={hero} />

      <SocialProofSection lang={lang} />

      <RoomCard room={room} checkIn={checkIn} checkOut={checkOut} adults={adults} lang={lang} queryState={queryState} />

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
              className="block rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:border-brand-secondary/35 dark:bg-brand-surface dark:text-brand-text dark:hover:text-brand-secondary"
            >
              {getGuideLinkLabel(tGuides, guidesEnT, "reachBudget")}
            </Link>
          </li>
        </Grid>
      </Section>

      {/* Spacer so the sticky CTA doesn't cover footer content on small screens */}
      <div className="h-20 sm:hidden" aria-hidden />
      <StickyBookNow lang={lang} onStickyCheckoutClick={onStickyCheckoutClick} />
    </Fragment>
  );
}

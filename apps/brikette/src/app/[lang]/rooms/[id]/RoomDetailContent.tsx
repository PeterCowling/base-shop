"use client";

// src/app/[lang]/rooms/[id]/RoomDetailContent.tsx
// Client component for room detail page (uses useTranslation hooks)
/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Feature section labels use hardcoded English; translation follow-on deferred. */
import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  Fragment,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { TFunction } from "i18next";

import { DirectBookingPerks } from "@acme/ui/molecules";
import StickyBookNow, { type StickyBookNowClickContext } from "@acme/ui/organisms/StickyBookNow";

import LocationInline from "@/components/booking/LocationInline";
import SocialProofSection from "@/components/landing/SocialProofSection";
import FacilityIcon from "@/components/rooms/FacilityIcon";
import RoomCard from "@/components/rooms/RoomCard";
import RoomStructuredData from "@/components/seo/RoomStructuredData";
import roomsData, { type RoomFeatures, type RoomId } from "@/data/roomsData";
import { useAvailabilityForRoom } from "@/hooks/useAvailabilityForRoom";
import { usePagePreload } from "@/hooks/usePagePreload";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { guideHref } from "@/routes.guides-helpers";
import {
  getMaxCheckoutForStay,
  getMinCheckoutForStay,
  HOSTEL_MAX_PAX,
  HOSTEL_MAX_STAY_NIGHTS,
  HOSTEL_MIN_PAX,
  HOSTEL_MIN_STAY_NIGHTS,
  isValidPax,
  isValidStayRange,
  normalizeCheckoutForStay,
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

export function FeatureSection({ features }: { features: RoomFeatures | undefined }) {
  if (!features) return null;

  return (
    <Section className="mx-auto mt-6 max-w-3xl px-4">
      <dl className="space-y-2">
        <div className="flex items-start gap-2 text-sm text-brand-text dark:text-brand-surface/90">
          <dt className="w-28 shrink-0 font-medium">Beds</dt>
          <dd>{features.bedSpec}</dd>
        </div>
        <div className="flex items-start gap-2 text-sm text-brand-text dark:text-brand-surface/90">
          <dt className="w-28 shrink-0 font-medium">Bathroom</dt>
          <dd>{features.bathroomSpec}</dd>
        </div>
        {features.viewSpec ? (
          <div className="flex items-start gap-2 text-sm text-brand-text dark:text-brand-surface/90">
            <dt className="w-28 shrink-0 font-medium">View</dt>
            <dd>{features.viewSpec}</dd>
          </div>
        ) : null}
        {features.terracePresent ? (
          <div className="flex items-center gap-2 text-sm text-brand-text dark:text-brand-surface/90">
            <dt className="w-28 shrink-0 font-medium">Terrace</dt>
            <dd>Private terrace</dd>
          </div>
        ) : null}
        {features.inRoomLockers ? (
          <div className="flex items-center gap-2 text-sm text-brand-text dark:text-brand-surface/90">
            <dt className="w-28 shrink-0 font-medium">Lockers</dt>
            <dd className="flex items-center gap-1">
              <FacilityIcon facility="locker" />
              In-room lockers
            </dd>
          </div>
        ) : null}
      </dl>
    </Section>
  );
}

type BookingQuery = {
  checkIn: string;
  checkOut: string;
  adults: number;
  queryState: "valid" | "invalid" | "absent";
};

function parseBookingQuery(
  searchParams: { get: (key: string) => string | null } | null,
  todayIso: string,
): BookingQuery {
  const checkInParam = searchParams?.get("checkin");
  const hasCheckInParam = Boolean(checkInParam);
  const checkIn = checkInParam && getMinCheckoutForStay(checkInParam) ? checkInParam : todayIso;
  const checkOutRaw = searchParams?.get("checkout") ?? getDatePlusTwoDays(checkIn);
  const checkOut = checkOutRaw;
  const adultsRaw = parseInt(searchParams?.get("pax") ?? "", 10);
  const adults = Number.isFinite(adultsRaw) && adultsRaw > 0 ? adultsRaw : 1;
  const isValid =
    hasCheckInParam && checkIn >= todayIso && isValidStayRange(checkIn, checkOut) && isValidPax(adults);
  const isInvalid = hasCheckInParam && !isValid;
  const queryState: "valid" | "invalid" | "absent" = isValid ? "valid" : isInvalid ? "invalid" : "absent";
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

type BookingDatePickerProps = {
  pickerCheckIn: string;
  pickerCheckOut: string;
  pickerAdults: number;
  maxPickerAdults: number;
  todayIso: string;
  pickerRef: RefObject<HTMLDivElement | null>;
  t: (key: string) => string;
  onDateChange: (newCheckIn: string, newCheckOut: string, newAdults: number) => void;
};

function BookingDatePicker({
  pickerCheckIn,
  pickerCheckOut,
  pickerAdults,
  maxPickerAdults,
  todayIso,
  pickerRef,
  t,
  onDateChange,
}: BookingDatePickerProps) {
  return (
    <Section className="mx-auto mt-6 max-w-3xl px-4">
      <div ref={pickerRef}>
        <h2 className="mb-4 text-base font-semibold text-brand-heading dark:text-brand-surface">
          {t("selectDatesTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3" data-min-nights={HOSTEL_MIN_STAY_NIGHTS} data-max-nights={HOSTEL_MAX_STAY_NIGHTS}>
          <div className="flex flex-col gap-1">
            <label htmlFor="room-checkin" className="text-sm text-brand-text dark:text-brand-surface/80">
              {t("checkInDate")}
            </label>
            <input
              id="room-checkin"
              type="date"
              value={pickerCheckIn}
              min={todayIso}
              onChange={(event) => {
                const newCheckIn = event.target.value;
                const newCheckOut = normalizeCheckoutForStay(newCheckIn, pickerCheckOut);
                onDateChange(newCheckIn, newCheckOut, pickerAdults);
              }}
              className="rounded border border-brand-outline/40 px-3 py-2 text-sm dark:border-brand-secondary/35 dark:bg-brand-surface dark:text-brand-text"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="room-checkout" className="text-sm text-brand-text dark:text-brand-surface/80">
              {t("checkOutDate")}
            </label>
            <input
              id="room-checkout"
              type="date"
              value={pickerCheckOut}
              min={getMinCheckoutForStay(pickerCheckIn) ?? getDatePlusTwoDays(pickerCheckIn)}
              max={getMaxCheckoutForStay(pickerCheckIn) ?? undefined}
              onChange={(event) => {
                const normalizedCheckOut = normalizeCheckoutForStay(pickerCheckIn, event.target.value);
                onDateChange(pickerCheckIn, normalizedCheckOut, pickerAdults);
              }}
              className="rounded border border-brand-outline/40 px-3 py-2 text-sm dark:border-brand-secondary/35 dark:bg-brand-surface dark:text-brand-text"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-brand-text dark:text-brand-surface/80">{t("adults")}</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Decrease adults"
                onClick={() => {
                  onDateChange(pickerCheckIn, pickerCheckOut, Math.max(HOSTEL_MIN_PAX, pickerAdults - 1));
                }}
                disabled={pickerAdults <= HOSTEL_MIN_PAX}
                className="min-h-11 min-w-11 rounded border border-brand-outline/40 text-brand-primary disabled:opacity-40 dark:border-brand-secondary/35 dark:text-brand-secondary"
              >
                -
              </button>
              <span className="w-6 text-center text-sm text-brand-text dark:text-brand-surface/80">
                {pickerAdults}
              </span>
              <button
                type="button"
                aria-label="Increase adults"
                onClick={() => {
                  onDateChange(pickerCheckIn, pickerCheckOut, Math.min(maxPickerAdults, pickerAdults + 1));
                }}
                disabled={pickerAdults >= maxPickerAdults}
                className="min-h-11 min-w-11 rounded border border-brand-outline/40 text-brand-primary disabled:opacity-40 dark:border-brand-secondary/35 dark:text-brand-secondary"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

export default function RoomDetailContent({ lang, id }: Props) {
  const router = useRouter();
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
  const [pickerCheckIn, setPickerCheckIn] = useState(checkIn);
  const [pickerCheckOut, setPickerCheckOut] = useState(checkOut);
  const [pickerAdults, setPickerAdults] = useState(adults);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const maxPickerAdults = Math.min(HOSTEL_MAX_PAX, room.occupancy ?? HOSTEL_MAX_PAX);
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

  // Seed booking params once when landing without explicit checkin query.
  useEffect(() => {
    const hasExistingParams = Boolean(searchParams?.get("checkin"));
    if (hasExistingParams) {
      return;
    }
    const defaultCheckIn = todayIso;
    const defaultCheckOut = getDatePlusTwoDays(todayIso);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("checkin", defaultCheckIn);
    params.set("checkout", defaultCheckOut);
    params.set("pax", String(HOSTEL_MIN_PAX));
    router.replace(`?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- LINT-1008 [ttl=2026-12-31] Mount-only effect intentionally omits deps to seed defaults once; re-running would clobber user changes.
  }, []);

  useEffect(() => {
    setPickerCheckIn(checkIn);
    setPickerCheckOut(checkOut);
    setPickerAdults(adults);
  }, [checkIn, checkOut, adults]);

  const handleDateChange = useCallback(
    (newCheckIn: string, newCheckOut: string, newAdults: number) => {
      setPickerCheckIn(newCheckIn);
      setPickerCheckOut(newCheckOut);
      setPickerAdults(newAdults);
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("checkin", newCheckIn);
      params.set("checkout", newCheckOut);
      params.set("pax", String(newAdults));
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const { availabilityRoom } = useAvailabilityForRoom({
    room,
    checkIn: pickerCheckIn,
    checkOut: pickerCheckOut,
    adults: pickerAdults,
  });

  return (
    <Fragment>
      <RoomStructuredData room={room} lang={lang} />
      <h1 className="mx-auto mt-6 px-4 text-3xl font-extrabold text-brand-primary dark:text-brand-secondary">
        {title}
      </h1>

      <HeroSection hero={hero} />

      <SocialProofSection lang={lang} />

      <BookingDatePicker
        pickerCheckIn={pickerCheckIn}
        pickerCheckOut={pickerCheckOut}
        pickerAdults={pickerAdults}
        maxPickerAdults={maxPickerAdults}
        todayIso={todayIso}
        pickerRef={datePickerRef}
        t={t as (key: string) => string}
        onDateChange={handleDateChange}
      />

      <RoomCard
        room={room}
        checkIn={pickerCheckIn}
        checkOut={pickerCheckOut}
        adults={pickerAdults}
        lang={lang}
        queryState={queryState}
        datePickerRef={datePickerRef}
        availabilityRoom={availabilityRoom}
      />

      <Section className="mx-auto max-w-3xl px-4">
        <p className="mt-6 text-base leading-relaxed">
          {resolveCopy(t(bedDescriptionKey), bedDescriptionKey)}
        </p>
        <div className="mt-4">
          <DirectBookingPerks lang={lang} />
          <LocationInline lang={lang} />
        </div>
      </Section>

      <FeatureSection features={room.features} />

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

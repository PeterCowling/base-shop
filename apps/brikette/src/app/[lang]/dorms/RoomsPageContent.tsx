"use client";

// src/app/[lang]/dorms/RoomsPageContent.tsx
// Client component for rooms listing page
import { Fragment, memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter, useSearchParams } from "next/navigation";

import { Section } from "@acme/design-system/atoms";
import { DirectBookingPerks } from "@acme/ui/molecules";

import BookingNotice from "@/components/booking/BookingNotice";
import type { DateRange } from "@/components/booking/DateRangePicker";
import { DateRangePicker } from "@/components/booking/DateRangePicker";
import RoomsSection, { type RoomsSectionBookingQuery } from "@/components/rooms/RoomsSection";
import { roomsData } from "@/data/roomsData";
import { useAvailability } from "@/hooks/useAvailability";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { isValidPax, isValidStayRange } from "@/utils/bookingDateRules";
import { buildBookingQueryString } from "@/utils/bookingQuery";
import { hydrateBookingSearch } from "@/utils/bookingSearch";
import { formatDate, getDatePlusTwoDays, getTodayIso, safeParseIso } from "@/utils/dateUtils";
import { fireViewItemList } from "@/utils/ga4-events";

type Props = {
  lang: AppLanguage;
  bookingQuery?: RoomsSectionBookingQuery;
  /** Server-resolved hero heading from the RSC page wrapper; used as SSR-stable primary value. */
  serverTitle?: string;
  /** Server-resolved hero subheading from the RSC page wrapper. */
  serverSubtitle?: string;
};

const I18N_KEY_TOKEN_PATTERN = /^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/i;

function resolveTranslatedCopy(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (I18N_KEY_TOKEN_PATTERN.test(trimmed)) return fallback;
  return trimmed;
}

function hydrateRoomsBookingQuery(
  searchParams: ReturnType<typeof useSearchParams>,
): RoomsSectionBookingQuery | undefined {
  const hydrated = hydrateBookingSearch(searchParams, { paxKeys: ["pax"] });
  if (!hydrated.search) return undefined;
  return {
    checkIn: hydrated.search.checkin,
    checkOut: hydrated.search.checkout,
    pax: String(hydrated.search.pax),
    queryString: buildBookingQueryString(
      hydrated.search.checkin,
      hydrated.search.checkout,
      hydrated.search.pax,
    ),
  };
}

function normalizeBookingQuery(range: DateRange, pax: number): RoomsSectionBookingQuery | undefined {
  const checkinInput = range.from ? formatDate(range.from) : "";
  const checkoutInput = range.to ? formatDate(range.to) : "";
  if (!checkinInput || !checkoutInput) {
    return undefined;
  }
  return {
    checkIn: checkinInput,
    checkOut: checkoutInput,
    pax: String(pax),
    queryString: buildBookingQueryString(checkinInput, checkoutInput, pax),
  };
}

function deriveQueryState(
  normalizedBookingQuery: RoomsSectionBookingQuery | undefined,
  checkinInput: string,
  checkoutInput: string,
  pax: number,
): "valid" | "invalid" | "absent" {
  if (!normalizedBookingQuery) return "absent";
  return isValidStayRange(checkinInput, checkoutInput) && isValidPax(pax) ? "valid" : "invalid";
}

function syncBookingSearchParams(
  router: ReturnType<typeof useRouter>,
  searchParams: ReturnType<typeof useSearchParams>,
  next: { checkin?: string; checkout?: string; pax: number },
): void {
  const nextParams = new URLSearchParams(searchParams?.toString() ?? "");
  if (next.checkin) {
    nextParams.set("checkin", next.checkin);
  } else {
    nextParams.delete("checkin");
  }
  if (next.checkout) {
    nextParams.set("checkout", next.checkout);
  } else {
    nextParams.delete("checkout");
  }
  nextParams.set("pax", String(next.pax));
  router.replace(`?${nextParams.toString()}`, { scroll: false });
}

function getInitialRange(query: RoomsSectionBookingQuery | undefined): DateRange {
  return {
    from: safeParseIso(query?.checkIn ?? ""),
    to: safeParseIso(query?.checkOut ?? ""),
  };
}

function parsePax(value: string | undefined): number {
  return parseInt(value ?? "1", 10) || 1;
}

function deriveAvailabilityInputs(normalizedBookingQuery: RoomsSectionBookingQuery | undefined): {
  checkin: string;
  checkout: string;
  pax: string;
} {
  const checkin = normalizedBookingQuery?.checkIn?.trim() || getTodayIso();
  const checkout = normalizedBookingQuery?.checkOut?.trim() || getDatePlusTwoDays(checkin);
  return {
    checkin,
    checkout,
    pax: normalizedBookingQuery?.pax ?? "1",
  };
}

// apartment is a private room (lives at /private-rooms) — excluded here to keep the dorms listing
// dorms-only, and because its widgetRoomCode is pending an Octorate ID.
const DORMS_EXCLUDE_IDS = ["double_room", "apartment"];

type RoomsBookingModel = {
  range: DateRange;
  pax: number;
  normalizedBookingQuery: RoomsSectionBookingQuery | undefined;
  queryState: "valid" | "invalid" | "absent";
  availabilityRooms: ReturnType<typeof useAvailability>["rooms"];
  setRange: (range: DateRange | undefined) => void;
  setPax: (pax: number) => void;
};

function useRoomsBookingModel(bookingQuery: RoomsSectionBookingQuery | undefined): RoomsBookingModel {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydratedBookingQuery = useMemo(() => hydrateRoomsBookingQuery(searchParams), [searchParams]);
  const resolvedBookingQuery = bookingQuery ?? hydratedBookingQuery;
  const [range, setRange] = useState<DateRange>(getInitialRange(resolvedBookingQuery));
  const [pax, setPax] = useState<number>(parsePax(resolvedBookingQuery?.pax));
  const checkinInput = range.from ? formatDate(range.from) : "";
  const checkoutInput = range.to ? formatDate(range.to) : "";
  const normalizedBookingQuery = useMemo(() => normalizeBookingQuery(range, pax), [range, pax]);
  const queryState = deriveQueryState(normalizedBookingQuery, checkinInput, checkoutInput, pax);

  useEffect(() => {
    setRange(getInitialRange(resolvedBookingQuery));
    setPax(parsePax(resolvedBookingQuery?.pax));
  }, [resolvedBookingQuery?.checkIn, resolvedBookingQuery?.checkOut, resolvedBookingQuery?.pax]);

  const availabilityInputs = deriveAvailabilityInputs(normalizedBookingQuery);
  const { rooms: availabilityRooms } = useAvailability(availabilityInputs);

  const handleRangeChange = (nextRange: DateRange | undefined): void => {
    setRange(nextRange ?? { from: undefined, to: undefined });
    const nextCheckin = nextRange?.from ? formatDate(nextRange.from) : undefined;
    const nextCheckout = nextRange?.to ? formatDate(nextRange.to) : undefined;
    syncBookingSearchParams(router, searchParams, { checkin: nextCheckin, checkout: nextCheckout, pax });
  };

  const handlePaxChange = (nextPax: number): void => {
    setPax(nextPax);
    syncBookingSearchParams(router, searchParams, {
      checkin: checkinInput || undefined,
      checkout: checkoutInput || undefined,
      pax: nextPax,
    });
  };

  return {
    range,
    pax,
    normalizedBookingQuery,
    queryState,
    availabilityRooms,
    setRange: (next) => handleRangeChange(next),
    setPax: (next) => handlePaxChange(next),
  };
}

function RoomsSearchPanel({
  t,
  model,
}: {
  t: (key: string, opts?: Record<string, unknown>) => unknown;
  model: RoomsBookingModel;
}) {
  const { range, pax, queryState, setRange, setPax } = model;

  const onPaxInputChange = (value: string): void => {
    const nextPax = parseInt(value, 10);
    const normalized = Number.isFinite(nextPax) && nextPax > 0 ? nextPax : 1;
    setPax(normalized);
  };

  return (
    <Section padding="default" className="mx-auto max-w-7xl">
      <div className="rounded-2xl border border-brand-outline/40 bg-brand-surface p-4 shadow-sm">
        <DateRangePicker
          selected={range}
          onRangeChange={setRange}
          stayHelperText={t("date.stayHelper", { defaultValue: "2–8 nights" }) as string}
          clearDatesText={t("date.clearDates", { defaultValue: "Clear dates" }) as string}
          checkInLabelText={t("booking.checkInLabel", { defaultValue: "Check in" }) as string}
          checkOutLabelText={t("booking.checkOutLabel", { defaultValue: "Check out" }) as string}
        />
        <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-brand-heading">
          {t("date.guests", { defaultValue: "Guests" }) as string}
          <input
            type="number"
            min={1}
            max={8}
            value={pax}
            onChange={(event) => onPaxInputChange(event.target.value)}
            className="min-h-11 w-24 rounded-xl border border-brand-outline/40 bg-brand-bg px-3 py-2 text-brand-heading shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          />
        </label>
        {queryState === "invalid" ? (
          <BookingNotice className="mt-4">
            {t("bookingConstraints.notice") as string}{" "}
            <a className="underline" href="mailto:hostelpositano@gmail.com?subject=Split%20booking%20help">
              {t("bookingConstraints.assistedLink") as string}
            </a>
            .
          </BookingNotice>
        ) : null}
      </div>
    </Section>
  );
}

function RoomsPageContent({ lang, bookingQuery, serverTitle, serverSubtitle }: Props) {
  const { t } = useTranslation("roomsPage", { lng: lang, useSuspense: true });
  useTranslation("ratingsBar", { lng: lang, useSuspense: true });
  usePagePreload({
    lang,
    namespaces: ["roomsPage", "assistanceCommon"],
    optionalNamespaces: ["ratingsBar", "modals", "guides"],
  });

  // Use server-resolved props when available (guaranteed SSR content from RSC wrapper).
  // Fall back to client-side translation if server props are absent (e.g. in tests).
  const pageTitle =
    serverTitle ??
    resolveTranslatedCopy(t("hero.heading", { defaultValue: "Our rooms" }), "Our rooms");
  const pageSubtitle =
    serverSubtitle ??
    resolveTranslatedCopy(t("hero.subheading", { defaultValue: "" }), "");
  const model = useRoomsBookingModel(bookingQuery);

  useEffect(() => {
    fireViewItemList({
      itemListId: "rooms_index",
      rooms: roomsData,
    });
  }, []);

  return (
    <Fragment>
      {/* Page Header */}
      <Section padding="default" className="text-center">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-brand-heading sm:text-4xl lg:text-5xl">
          {pageTitle}
        </h1>
        {pageSubtitle && (
          <p className="mx-auto text-lg text-brand-text/80">{pageSubtitle}</p>
        )}
      </Section>

      <RoomsSearchPanel t={t} model={model} />

      <RoomsSection
        lang={lang}
        bookingQuery={model.normalizedBookingQuery}
        queryState={model.queryState}
        itemListId="rooms_index"
        excludeRoomIds={DORMS_EXCLUDE_IDS}
        availabilityRooms={model.availabilityRooms}
      />

      {/* Direct Booking Perks */}
      <Section padding="default">
        <DirectBookingPerks lang={lang} />
      </Section>

    </Fragment>
  );
}

export default memo(RoomsPageContent);

// packages/ui/src/organisms/RoomsSection.tsx
// Responsive list of room cards (moved from app src)
import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "../atoms/Section";
import { Grid } from "../components/atoms/primitives/Grid";
import { ROOM_DROPDOWN_NAMES } from "../config/roomNames";
import { getRoomSlug } from "../config/roomSlugs";
import { roomsData, toFlatImageArray } from "../data/roomsData";
import { useCurrentLanguage } from "../hooks/useCurrentLanguage";
import type { AppLanguage } from "../i18n.config";
import RoomCard from "../molecules/RoomCard";
import type { FilterAvailability, RoomFiltersState,RoomFilterView } from "../molecules/RoomFilters";
import RoomFilters from "../molecules/RoomFilters";
import { SLUGS } from "../slug-map";
import type { RoomCardImageLabels, RoomCardPrice } from "../types/roomCard";
import { getDatePlusTwoDays, getTodayIso } from "../utils/dateUtils";
import { getPrivateRoomChildPath } from "../utils/privateRoomPaths";

export type RoomsSectionBookingQuery = {
  checkIn?: string;
  checkOut?: string;
  pax?: string;
  queryString?: string;
};


function looksLikeI18nKeyToken(value: string): boolean {
  if (!value.includes(".")) return false;
  const parts = value.split(".");
  if (parts.length < 2) return false;
  for (const part of parts) {
    if (!part) return false;
    for (let i = 0; i < part.length; i += 1) {
      const code = part.charCodeAt(i);
      const isLowerAlpha = code >= 97 && code <= 122;
      const isUpperAlpha = code >= 65 && code <= 90;
      const isDigit = code >= 48 && code <= 57;
      const isUnderscore = code === 95;
      if (!isLowerAlpha && !isUpperAlpha && !isDigit && !isUnderscore) {
        return false;
      }
    }
  }
  return true;
}

function resolveTranslatedCopy(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (looksLikeI18nKeyToken(trimmed)) return fallback;
  return trimmed;
}

function parseClientBookingQuery(): RoomsSectionBookingQuery {
  const params = new URLSearchParams(window.location.search);
  return {
    checkIn: params.get("checkin") ?? "",
    checkOut: params.get("checkout") ?? "",
    pax: params.get("pax") ?? "",
    queryString: params.toString(),
  };
}

type RoomFilterViewValue = "sea" | "courtyard" | "garden" | "none";
type RoomFilterProfile = {
  view: RoomFilterViewValue;
  femaleOnly: boolean;
  hasEnsuiteBathroom: boolean;
  bedCount: number;
};

const FILTER_PROFILE_BY_ROOM_ID: Partial<Record<string, Omit<RoomFilterProfile, "bedCount">>> = {
  room_10: { view: "none", femaleOnly: false, hasEnsuiteBathroom: true },
  room_11: { view: "sea", femaleOnly: true, hasEnsuiteBathroom: true },
  // Room 12 is mixed occupancy with private (next-door) bathroom eligibility.
  room_12: { view: "sea", femaleOnly: false, hasEnsuiteBathroom: true },
  room_3: { view: "none", femaleOnly: true, hasEnsuiteBathroom: false },
  room_4: { view: "none", femaleOnly: false, hasEnsuiteBathroom: false },
  room_5: { view: "sea", femaleOnly: true, hasEnsuiteBathroom: true },
  room_6: { view: "sea", femaleOnly: true, hasEnsuiteBathroom: true },
  room_9: { view: "courtyard", femaleOnly: false, hasEnsuiteBathroom: true },
  room_8: { view: "garden", femaleOnly: true, hasEnsuiteBathroom: false },
};

function buildRoomFilterProfile(room: (typeof roomsData)[number]): RoomFilterProfile {
  const mapped = FILTER_PROFILE_BY_ROOM_ID[room.id];
  return {
    view: mapped?.view ?? "none",
    femaleOnly: mapped?.femaleOnly ?? false,
    hasEnsuiteBathroom: mapped?.hasEnsuiteBathroom ?? false,
    bedCount: room.occupancy ?? 0,
  };
}

function RoomsSection({
  lang: explicitLang,
  bookingQuery,
  itemListId,
  onRoomSelect,
  roomPrices,
  singleCtaMode,
  excludeRoomIds,
  includeRoomIds,
  showFilters = true,
}: {
  lang?: string;
  bookingQuery?: RoomsSectionBookingQuery;
  /** Optional analytics context for room-card CTA clicks (GA4-agnostic). */
  itemListId?: string;
  /**
   * Optional hook invoked before opening Booking2 modal when a room/rate CTA is clicked.
   * Kept GA4-agnostic; app callers can emit analytics using their own contract layer.
   */
  onRoomSelect?: (ctx: { roomSku: string; plan: "nr" | "flex"; index: number; itemListId?: string }) => void;
  /**
   * Optional per-room pricing data keyed by room ID (e.g. "room_10", "double_room").
   * When provided for a room, overrides the default (empty) price block on that RoomCard.
   * Used by the brikette live-availability feature to show per-date-range pricing.
   */
  roomPrices?: Record<string, RoomCardPrice>;
  /**
   * When true, renders a single "Check Rates" CTA (NR rate plan) instead of the default
   * dual Non-Refundable / Flexible buttons. The cheapest (NR) rate is always used.
   */
  singleCtaMode?: boolean;
  /**
   * Optional list of room IDs to exclude from the listing entirely.
   * Used by the dorms page to hide rooms that have moved to a different route.
   */
  excludeRoomIds?: string[];
  /**
   * Optional allow-list of room IDs to render in the listing.
   * Applied before filters; useful for segmented booking pages.
   */
  includeRoomIds?: string[];
  /** Toggle visibility of room filters. */
  showFilters?: boolean;
}): JSX.Element {
  const fallbackLang = useCurrentLanguage();
  const lang = explicitLang ?? fallbackLang;
  const { t } = useTranslation("roomsPage", { lng: lang });
  const [clientBookingQuery, setClientBookingQuery] = useState<RoomsSectionBookingQuery | null>(
    bookingQuery ?? null
  );
  const roomsSlug = SLUGS.rooms[lang as keyof typeof SLUGS.rooms] ?? SLUGS.rooms.en;
  useEffect(() => {
    if (bookingQuery) return;
    setClientBookingQuery(parseClientBookingQuery());
  }, [bookingQuery]);
  const resolvedBookingQuery = bookingQuery ?? clientBookingQuery;
  const checkIn = resolvedBookingQuery?.checkIn?.trim() || getTodayIso();
  const _checkOut = resolvedBookingQuery?.checkOut?.trim() || getDatePlusTwoDays(checkIn);
  const _adults = parseInt(resolvedBookingQuery?.pax ?? "1", 10) || 1;

  const [filters, setFilters] = useState<RoomFiltersState>({
    view: "all",
    femaleOnly: false,
    ensuiteBathroom: false,
    bedCounts: [],
  });

  const availableBedCounts = useMemo(
    () =>
      Array.from(
        new Set(
          roomsData
            .filter((room) => !includeRoomIds || includeRoomIds.includes(room.id))
            .filter((room) => !excludeRoomIds?.includes(room.id))
            .map((room) => room.occupancy ?? 0)
            .filter((count) => count > 0),
        ),
      ).sort((a, b) => a - b),
    [excludeRoomIds, includeRoomIds],
  );

  const visibleRooms = useMemo(
    () =>
      roomsData
        .filter((room) => !includeRoomIds || includeRoomIds.includes(room.id))
        .filter((r) => !excludeRoomIds?.includes(r.id)),
    [excludeRoomIds, includeRoomIds],
  );

  const visibleProfiles = useMemo(
    () => visibleRooms.map((room) => ({ room, profile: buildRoomFilterProfile(room) })),
    [visibleRooms],
  );
  const roomImageLabels = useMemo<RoomCardImageLabels>(
    () => ({
      enlarge: resolveTranslatedCopy(
        t("roomImage.clickToEnlarge", { defaultValue: "Click to enlarge image" }),
        "Click to enlarge image",
      ),
      prevAria: resolveTranslatedCopy(
        t("roomImage.prevAria", { defaultValue: "Previous image" }),
        "Previous image",
      ),
      nextAria: resolveTranslatedCopy(
        t("roomImage.nextAria", { defaultValue: "Next image" }),
        "Next image",
      ),
      empty: resolveTranslatedCopy(
        t("roomImage.noImage", { defaultValue: "No image available" }),
        "No image available",
      ),
    }),
    [t],
  );

  function matchesFilters(
    profile: RoomFilterProfile,
    f: { view: RoomFilterView | "all"; femaleOnly: boolean; ensuiteBathroom: boolean; bedCounts: number[] },
  ): boolean {
    if (f.view !== "all" && profile.view !== f.view) return false;
    if (f.femaleOnly && !profile.femaleOnly) return false;
    if (f.ensuiteBathroom && !profile.hasEnsuiteBathroom) return false;
    if (f.bedCounts.length > 0 && !f.bedCounts.includes(profile.bedCount)) return false;
    return true;
  }

  const filteredRooms = useMemo(
    () => visibleProfiles.filter(({ profile }) => matchesFilters(profile, filters)).map(({ room }) => room),
    [filters, visibleProfiles],
  );

  const filterAvailability = useMemo((): FilterAvailability => {
    const viewOptions: RoomFilterView[] = ["all", "sea", "courtyard", "garden", "none"];
    const views = {} as Record<RoomFilterView, boolean>;
    for (const v of viewOptions) {
      views[v] =
        v === "all" ||
        visibleProfiles.some(({ profile }) =>
          matchesFilters(profile, { ...filters, view: v }),
        );
    }
    const femaleOnly = visibleProfiles.some(({ profile }) =>
      matchesFilters(profile, { ...filters, femaleOnly: true }),
    );
    const ensuiteBathroom = visibleProfiles.some(({ profile }) =>
      matchesFilters(profile, { ...filters, ensuiteBathroom: true }),
    );
    const bedCountsAvail = {} as Record<number, boolean>;
    for (const count of availableBedCounts) {
      bedCountsAvail[count] = visibleProfiles.some(({ profile }) =>
        matchesFilters(profile, { ...filters, bedCounts: [count] }),
      );
    }
    return { views, femaleOnly, ensuiteBathroom, bedCounts: bedCountsAvail };
  }, [filters, visibleProfiles, availableBedCounts]);

  // Auto-deselect filters that have become unavailable
  useEffect(() => {
    let changed = false;
    const next = { ...filters };
    if (filters.femaleOnly && !filterAvailability.femaleOnly) {
      next.femaleOnly = false;
      changed = true;
    }
    if (filters.ensuiteBathroom && !filterAvailability.ensuiteBathroom) {
      next.ensuiteBathroom = false;
      changed = true;
    }
    if (filters.view !== "all" && !filterAvailability.views[filters.view]) {
      next.view = "all";
      changed = true;
    }
    const validBedCounts = filters.bedCounts.filter((c) => filterAvailability.bedCounts[c] !== false);
    if (validBedCounts.length !== filters.bedCounts.length) {
      next.bedCounts = validBedCounts;
      changed = true;
    }
    if (changed) setFilters(next);
  }, [filterAvailability, filters]);

  const sectionClasses = useMemo(
    () =>
      [
        /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
        "bg-brand-surface dark:bg-brand-bg",
        /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
        "bg-no-repeat bg-[length:60vw]",
        "px-4 py-12",
        /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
        "pt-12 sm:pt-12 scroll-mt-30",
      ].join(" "),
    []
  );

  return (
    <section id="rooms" className={sectionClasses}>
      <Section as="div" padding="none" width="full" className="mx-auto max-w-7xl px-4">
        <header className="mb-8 text-center sm:text-start">
          <h2 className="text-xl font-medium tracking-wide text-brand-primary dark:text-brand-secondary">
            {resolveTranslatedCopy(t("rooms.title", { defaultValue: "Rooms" }), "Rooms")}
          </h2>
          <hr className="mt-1 w-12 border-t-2 border-brand-primary" />
        </header>

        {showFilters ? (
          <RoomFilters
            selected={filters}
            onChange={setFilters}
            availableBedCounts={availableBedCounts}
            availability={filterAvailability}
            lang={lang}
          />
        ) : null}

        <Grid cols={1} gap={8} className="sm:grid-cols-2">
          {filteredRooms.map((room, index) => {
            const href =
              room.id === "double_room"
                ? `/${lang}${getPrivateRoomChildPath(lang as AppLanguage, "double-room")}`
                : room.id === "apartment"
                  ? `/${lang}${getPrivateRoomChildPath(lang as AppLanguage, "apartment")}`
                  : `/${lang}/${roomsSlug}/${getRoomSlug(room.id, lang as AppLanguage)}`;
            const title = resolveTranslatedCopy(
              t(`rooms.${room.id}.title`, {
                defaultValue: ROOM_DROPDOWN_NAMES[room.id] ?? "Room",
              }),
              ROOM_DROPDOWN_NAMES[room.id] ?? "Room"
            );
            const nonRefundableLabel = resolveTranslatedCopy(
              t("checkRatesNonRefundable", { defaultValue: "Non-Refundable Rates" }),
              "Non-Refundable Rates"
            );
            const flexibleLabel = resolveTranslatedCopy(
              t("checkRatesFlexible", { defaultValue: "Flexible Rates" }),
              "Flexible Rates"
            );
            const checkRatesSingleLabel = resolveTranslatedCopy(
              t("checkRatesSingle", { defaultValue: "Check Rates" }),
              "Check Rates"
            );
            const openBooking = (rateType: "nonRefundable" | "refundable") => {
              const plan = rateType === "nonRefundable" ? "nr" : "flex";
              onRoomSelect?.({ roomSku: room.id, plan, index, itemListId });
              // Booking modal removed (TASK-24). Navigation is handled by the app layer
              // via RoomCard props (brikette: TASK-27 direct Octorate link).
            };
            return (
              <RoomCard
                key={room.id}
                id={room.id}
                title={title}
                images={toFlatImageArray(room.images)}
                imageAlt={`${title} room`}
                imageLabels={roomImageLabels}
                lang={lang}
                actions={
                  singleCtaMode
                    ? [{ id: "nr", label: checkRatesSingleLabel, onSelect: () => openBooking("nonRefundable") }]
                    : [
                        { id: "nr", label: nonRefundableLabel, onSelect: () => openBooking("nonRefundable") },
                        { id: "flex", label: flexibleLabel, onSelect: () => openBooking("refundable") },
                      ]
                }
                price={roomPrices?.[room.id]}
                titleOverlay
                detailHref={href}
                detailLabel={resolveTranslatedCopy(
                  t("moreAboutThisRoom", { defaultValue: "More About This Room" }),
                  "More About This Room"
                )}
              />
            );
          })}
        </Grid>
      </Section>
    </section>
  );
}

export default memo(RoomsSection);
export { RoomsSection };

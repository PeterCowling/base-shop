// packages/ui/src/organisms/RoomsSection.tsx
// Responsive list of room cards (moved from app src)
import { memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

import { Section } from "../atoms/Section";
import { Grid } from "../components/atoms/primitives/Grid";
import { useModal } from "../context/ModalContext";
import { roomsData } from "../data/roomsData";
import { useCurrentLanguage } from "../hooks/useCurrentLanguage";
import RoomCard from "../molecules/RoomCard";
import RoomFilters, { type RoomFilter } from "../molecules/RoomFilters";
import { SLUGS } from "../slug-map";
import { getDatePlusTwoDays, getTodayIso } from "../utils/dateUtils";

export type RoomsSectionBookingQuery = {
  checkIn?: string;
  checkOut?: string;
  pax?: string;
  queryString?: string;
};

const ROOM_TITLE_FALLBACKS: Record<string, string> = {
  double_room: "Double Room",
  room_10: "Premium Mixed Dorm",
  room_11: "Superior Mixed Dorm",
  room_12: "Superior Mixed Dorm Plus",
  room_3: "Mixed Dorm",
  room_4: "Mixed Dorm",
  room_5: "Mixed Dorm",
  room_6: "Mixed Dorm",
  room_8: "Female Dorm",
  room_9: "Female Dorm",
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

function formatRoomBasePrice(
  amount: number | undefined,
  currency: string | undefined
): string {
  const safeAmount =
    typeof amount === "number" && Number.isFinite(amount) ? amount : null;
  if (safeAmount === null) return "";
  const normalizedCurrency =
    typeof currency === "string" && currency.trim() ? currency : "EUR";
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: safeAmount % 1 === 0 ? 0 : 2,
    }).format(safeAmount);
  } catch {
    return `${normalizedCurrency} ${safeAmount.toFixed(0)}`;
  }
}

function buildRoomInventorySummary(room: (typeof roomsData)[number], title: string): string {
  const occupancy = Number.isFinite(room.occupancy) ? Math.max(1, room.occupancy) : 1;
  const occupancyLabel = occupancy === 1 ? "1 guest" : `${occupancy} guests`;
  const pricingUnit = room.pricingModel === "perRoom" ? "room" : "bed";
  const pricingLabel = room.pricingModel === "perRoom" ? "Private room" : "Dorm room";
  const formattedPrice = formatRoomBasePrice(room.basePrice?.amount, room.basePrice?.currency);
  const priceFragment = formattedPrice ? ` From ${formattedPrice} per ${pricingUnit}.` : "";

  return `${title}. ${pricingLabel} for up to ${occupancyLabel}.${priceFragment}`;
}

function RoomsSection({
  lang: explicitLang,
  bookingQuery,
}: {
  lang?: string;
  bookingQuery?: RoomsSectionBookingQuery;
}): JSX.Element {
  const fallbackLang = useCurrentLanguage();
  const lang = explicitLang ?? fallbackLang;
  const { t } = useTranslation("roomsPage", { lng: lang });
  const { openModal } = useModal();
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
  const checkOut = resolvedBookingQuery?.checkOut?.trim() || getDatePlusTwoDays(checkIn);
  const adults = parseInt(resolvedBookingQuery?.pax ?? "1", 10) || 1;
  const normalizedQueryString = (resolvedBookingQuery?.queryString ?? "").trim().replace(/^\?/, "");
  const searchString = normalizedQueryString ? `?${normalizedQueryString}` : "";

  const [filter, setFilter] = useState<RoomFilter>("all");

  const filteredRooms = useMemo(
    () =>
      roomsData.filter((r) =>
        filter === "all"
          ? true
          : filter === "private"
          ? r.pricingModel === "perRoom"
          : r.pricingModel === "perBed"
      ),
    [filter]
  );

  const sectionClasses = useMemo(
    () =>
      [
        /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
        "bg-brand-surface dark:bg-brand-bg",
        /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
        "bg-no-repeat bg-[length:60vw]",
        "px-4 py-12",
        /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
        "pt-30 sm:pt-12 scroll-mt-30",
      ].join(" "),
    []
  );

  return (
    <section id="rooms" className={sectionClasses}>
      <Section as="div" padding="none" width="full" className="mx-auto max-w-7xl px-4">
        <header className="mb-8 text-center sm:text-end">
          <h2 className="text-xl font-medium tracking-wide text-brand-primary dark:text-brand-secondary">
            {resolveTranslatedCopy(t("rooms.title", { defaultValue: "Rooms" }), "Rooms")}
          </h2>
          <hr className="mt-1 w-12 border-t-2 border-brand-primary" />
        </header>

        <RoomFilters selected={filter} onChange={setFilter} lang={lang} />

        <Grid cols={1} gap={8} className="sm:grid-cols-2">
          {filteredRooms.map((room) => {
            const href = `/${lang}/${roomsSlug}/${room.id}`;
            const title = resolveTranslatedCopy(
              t(`rooms.${room.id}.title`, {
                defaultValue: ROOM_TITLE_FALLBACKS[room.id] ?? "Room",
              }),
              ROOM_TITLE_FALLBACKS[room.id] ?? "Room"
            );
            const nonRefundableLabel = resolveTranslatedCopy(
              t("checkRatesNonRefundable", { defaultValue: "Non-Refundable Rates" }),
              "Non-Refundable Rates"
            );
            const flexibleLabel = resolveTranslatedCopy(
              t("checkRatesFlexible", { defaultValue: "Flexible Rates" }),
              "Flexible Rates"
            );
            const roomSummary = buildRoomInventorySummary(room, title);

            const openBooking = (rateType: "nonRefundable" | "refundable") => {
              openModal("booking2", {
                checkIn,
                checkOut,
                adults,
                rateType,
                room: {
                  nonRefundableCode: room.rateCodes.direct.nr,
                  refundableCode: room.rateCodes.direct.flex,
                },
              });
            };
            return (
              <div key={room.id} className="flex flex-col">
                <RoomCard
                  id={room.id}
                  title={title}
                  images={room.imagesRaw}
                  imageAlt={`${title} room`}
                  lang={lang}
                  actions={[
                    { id: "nr", label: nonRefundableLabel, onSelect: () => openBooking("nonRefundable") },
                    { id: "flex", label: flexibleLabel, onSelect: () => openBooking("refundable") },
                  ]}
                />
                <p className="mt-2 text-sm leading-relaxed text-brand-text/80 dark:text-brand-text/75">
                  {roomSummary}
                </p>
                <Link
                  href={`${href}${searchString}`}
                  className="mt-2 inline-flex min-h-11 items-center self-start text-sm font-medium text-brand-primary underline hover:text-brand-bougainvillea focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70 dark:text-brand-secondary dark:hover:text-brand-secondary/85 dark:focus-visible:ring-brand-secondary/70"
                >
                  {resolveTranslatedCopy(
                    t("moreAboutThisRoom", { defaultValue: "More About This Room" }),
                    "More About This Room"
                  )}
                </Link>
              </div>
            );
          })}
        </Grid>
      </Section>
    </section>
  );
}

export default memo(RoomsSection);
export { RoomsSection };

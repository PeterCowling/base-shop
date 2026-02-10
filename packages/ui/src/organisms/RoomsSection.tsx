// packages/ui/src/organisms/RoomsSection.tsx
// Responsive list of room cards (moved from app src)
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Section } from "../atoms/Section";
import { Grid } from "../components/atoms/primitives/Grid";
import { useModal } from "../context/ModalContext";
import { roomsData } from "../data/roomsData";
import { useCurrentLanguage } from "../hooks/useCurrentLanguage";
import RoomCard from "../molecules/RoomCard";
import RoomFilters, { type RoomFilter } from "../molecules/RoomFilters";
import { SLUGS } from "../slug-map";
import { getDatePlusTwoDays, getTodayIso } from "../utils/dateUtils";

function RoomsSection({ lang: explicitLang }: { lang?: string }): JSX.Element {
  const fallbackLang = useCurrentLanguage();
  const lang = explicitLang ?? fallbackLang;
  const { t } = useTranslation("roomsPage", { lng: lang });
  const { openModal } = useModal();
  const roomsSlug = SLUGS.rooms[lang as keyof typeof SLUGS.rooms] ?? SLUGS.rooms.en;
  const searchParams = useSearchParams();
  const checkIn = searchParams?.get("checkin") ?? getTodayIso();
  const checkOut = searchParams?.get("checkout") ?? getDatePlusTwoDays(checkIn);
  const adults = parseInt(searchParams?.get("pax") ?? "1", 10) || 1;
  const searchString = searchParams?.toString() ? `?${searchParams.toString()}` : "";

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
        "bg-brand-surface dark:bg-brand-text",
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
          <h2 className="text-xl font-medium tracking-wide text-brand-primary">{t("rooms.title")}</h2>
          <hr className="mt-1 w-12 border-t-2 border-brand-primary" />
        </header>

        <RoomFilters selected={filter} onChange={setFilter} lang={lang} />

        <Grid cols={1} gap={8} className="sm:grid-cols-2">
          {filteredRooms.map((room) => {
            const href = `/${lang}/${roomsSlug}/${room.id}`;
            const title = t(`rooms.${room.id}.title`) as string;
            const nonRefundableLabel = t("checkRatesNonRefundable") as string;
            const flexibleLabel = t("checkRatesFlexible") as string;

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
                <Link
                  href={`${href}${searchString}`}
                  className="mt-2 inline-flex min-h-11 items-center self-start text-sm font-medium text-brand-primary underline hover:text-brand-bougainvillea focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70"
                >
                  {t("moreAboutThisRoom")}
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

import type { RefObject } from "react";
import { useTranslation } from "react-i18next";

import { BookingCalendarPanel } from "@/components/booking/BookingCalendarPanel";
import BookingNotice from "@/components/booking/BookingNotice";
import type { DateRange } from "@/components/booking/DateRangePicker";
import ExpiredQuoteNotice from "@/components/booking/ExpiredQuoteNotice";
import RecoveryQuoteCapture from "@/components/booking/RecoveryQuoteCapture";
import type { AppLanguage } from "@/i18n.config";
import type { RoomQueryState } from "@/types/booking";
import { HOSTEL_MIN_PAX } from "@/utils/bookingDateRules";
import { getBookPath } from "@/utils/localizedRoutes";

import { Section } from "./RoomDetailSections";

export function BookingPickerSection({
  datePickerRef,
  range,
  onRangeChange,
  stayHelperText,
  clearDatesText,
  checkInLabelText,
  checkOutLabelText,
  adultsLabel,
  pickerAdults,
  maxPickerAdults,
  onAdultsChange,
}: {
  datePickerRef: RefObject<HTMLDivElement | null>;
  range: DateRange;
  onRangeChange: (r: DateRange | undefined) => void;
  stayHelperText: string;
  clearDatesText: string;
  checkInLabelText: string;
  checkOutLabelText: string;
  adultsLabel: string;
  pickerAdults: number;
  maxPickerAdults: number;
  onAdultsChange: (n: number) => void;
}) {
  const { t } = useTranslation("roomsPage");

  return (
    <Section className="mx-auto mt-6 max-w-3xl px-4">
      <div ref={datePickerRef}>
        <BookingCalendarPanel
          range={range}
          onRangeChange={onRangeChange}
          pax={pickerAdults}
          onPaxChange={onAdultsChange}
          minPax={HOSTEL_MIN_PAX}
          maxPax={maxPickerAdults}
          labels={{
            stayHelper: stayHelperText,
            clearDates: clearDatesText,
            checkIn: checkInLabelText,
            checkOut: checkOutLabelText,
            guests: adultsLabel,
            decreaseGuests: t("bookingControls.decreaseAdults") as string,
            increaseGuests: t("bookingControls.increaseAdults") as string,
          }}
        />
      </div>
    </Section>
  );
}

export function RoomDetailBookingNotices({
  queryState,
  indicativeAnchor,
  showRebuildQuotePrompt,
}: {
  queryState: RoomQueryState;
  indicativeAnchor: string | null;
  showRebuildQuotePrompt: boolean;
}) {
  const { t } = useTranslation("roomsPage");

  return (
    <>
      {queryState === "invalid" ? (
        <Section className="mx-auto mt-4 max-w-3xl px-4">
          <BookingNotice>
            {t("bookingConstraints.notice") as string}{" "}
            <a
              className="inline-flex min-h-11 min-w-11 items-center underline"
              href="mailto:hostelpositano@gmail.com?subject=Split%20booking%20help"
            >
              {t("bookingConstraints.assistedLink") as string}
            </a>
            .
          </BookingNotice>
        </Section>
      ) : null}
      {queryState === "absent" ? (
        <Section className="mx-auto mt-4 max-w-3xl px-4">
          <BookingNotice>
            {indicativeAnchor
              ? (t("bookingConstraints.absentWithAnchor", { price: indicativeAnchor }) as string)
              : (t("bookingConstraints.absentNoRates") as string)}
          </BookingNotice>
        </Section>
      ) : null}
      {showRebuildQuotePrompt ? (
        <Section className="mx-auto mt-4 max-w-3xl px-4">
          <ExpiredQuoteNotice />
        </Section>
      ) : null}
    </>
  );
}

export function RoomDetailRecoverySection({
  lang,
  roomId,
  roomSku,
  queryState,
  checkin,
  checkout,
  pax,
}: {
  lang: AppLanguage;
  roomId: string;
  roomSku: string;
  queryState: RoomQueryState;
  checkin: string;
  checkout: string;
  pax: number;
}) {
  const { t } = useTranslation("roomsPage");

  return (
    <Section className="mx-auto mt-4 max-w-3xl px-4">
      <RecoveryQuoteCapture
        isValidSearch={queryState === "valid"}
        resumePathname={getBookPath(lang)}
        context={{
          checkin,
          checkout,
          pax,
          source_route: `/${lang}/dorms/${roomId}`,
          room_id: roomSku,
          rate_plan: "nr",
        }}
        title={t("recovery.roomTitle") as string}
      />
    </Section>
  );
}

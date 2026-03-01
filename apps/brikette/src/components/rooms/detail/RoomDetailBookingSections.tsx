import type { RefObject } from "react";
import { useTranslation } from "react-i18next";

import BookingNotice from "@/components/booking/BookingNotice";
import type { DateRange } from "@/components/booking/DateRangePicker";
import { DateRangePicker } from "@/components/booking/DateRangePicker";
import ExpiredQuoteNotice from "@/components/booking/ExpiredQuoteNotice";
import RecoveryQuoteCapture from "@/components/booking/RecoveryQuoteCapture";
import type { AppLanguage } from "@/i18n.config";
import { HOSTEL_MIN_PAX } from "@/utils/bookingDateRules";

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
        <DateRangePicker
          selected={range}
          onRangeChange={onRangeChange}
          stayHelperText={stayHelperText}
          clearDatesText={clearDatesText}
          checkInLabelText={checkInLabelText}
          checkOutLabelText={checkOutLabelText}
        />
        <div className="mt-4 flex flex-col gap-1">
          <label className="text-sm text-brand-text dark:text-brand-surface/80">{adultsLabel}</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={t("bookingControls.decreaseAdults") as string}
              onClick={() => onAdultsChange(Math.max(HOSTEL_MIN_PAX, pickerAdults - 1))}
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
              aria-label={t("bookingControls.increaseAdults") as string}
              onClick={() => onAdultsChange(Math.min(maxPickerAdults, pickerAdults + 1))}
              disabled={pickerAdults >= maxPickerAdults}
              className="min-h-11 min-w-11 rounded border border-brand-outline/40 text-brand-primary disabled:opacity-40 dark:border-brand-secondary/35 dark:text-brand-secondary"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

export function RoomDetailBookingNotices({
  queryState,
  indicativeAnchor,
  showRebuildQuotePrompt,
}: {
  queryState: "valid" | "invalid" | "absent";
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
            <a className="underline" href="mailto:hostelpositano@gmail.com?subject=Split%20booking%20help">
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
  queryState: "valid" | "invalid" | "absent";
  checkin: string;
  checkout: string;
  pax: number;
}) {
  const { t } = useTranslation("roomsPage");

  return (
    <Section className="mx-auto mt-4 max-w-3xl px-4">
      <RecoveryQuoteCapture
        isValidSearch={queryState === "valid"}
        resumePathname={`/${lang}/book`}
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

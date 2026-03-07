import type { RefObject } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/design-system/atoms";

import { BookingCalendarPanel } from "@/components/booking/BookingCalendarPanel";
import BookingNotice from "@/components/booking/BookingNotice";
import type { DateRange } from "@/components/booking/DateRangePicker";
import ExpiredQuoteNotice from "@/components/booking/ExpiredQuoteNotice";
import RecoveryQuoteCapture from "@/components/booking/RecoveryQuoteCapture";
import type { AppLanguage } from "@/i18n.config";
import { resolveBookingControlLabels } from "@/utils/bookingControlLabels";
import { formatDate } from "@/utils/dateUtils";
import { getBookPath } from "@/utils/localizedRoutes";

type BookPageSearchPanelProps = {
  lang?: AppLanguage;
  range: DateRange;
  pax: number;
  onRangeChange: (newRange: DateRange | undefined) => void;
  onPaxChange: (newPax: number) => void;
  onCanonicalQuery: (next: { checkin: string; checkout: string; pax: number }) => void;
  checkin: string;
  checkout: string;
  stayHelperText: string;
  clearDatesText: string;
  checkInLabelText: string;
  checkOutLabelText: string;
  guestsLabelText: string;
  showConstraintGuidance: boolean;
  showRebuildQuotePrompt: boolean;
  calendarAnchorRef?: RefObject<HTMLDivElement | null>;
  showSelectDatesPrompt?: boolean;
  selectDatesPromptText?: string;
};

export function BookPageSearchPanel({
  lang,
  range,
  pax,
  onRangeChange,
  onPaxChange,
  onCanonicalQuery,
  checkin,
  checkout,
  stayHelperText,
  clearDatesText,
  checkInLabelText,
  checkOutLabelText,
  guestsLabelText,
  showConstraintGuidance,
  showRebuildQuotePrompt,
  calendarAnchorRef,
  showSelectDatesPrompt = false,
  selectDatesPromptText = "",
}: BookPageSearchPanelProps): JSX.Element {
  const { t } = useTranslation("bookPage");
  const { t: tRooms } = useTranslation("roomsPage", { lng: lang });
  const bookingControlLabels = resolveBookingControlLabels(t, tRooms);

  return (
    <div ref={calendarAnchorRef} className="mt-6 mx-auto scroll-mt-24" tabIndex={-1}>
      <BookingCalendarPanel
        lang={lang}
        range={range}
        onRangeChange={(newRange) => {
          onRangeChange(newRange);
          const newCheckin = newRange?.from ? formatDate(newRange.from) : "";
          const newCheckout = newRange?.to ? formatDate(newRange.to) : "";
          if (newCheckin && newCheckout) {
            onCanonicalQuery({ checkin: newCheckin, checkout: newCheckout, pax });
          }
        }}
        pax={pax}
        onPaxChange={(next) => {
          onPaxChange(next);
          onCanonicalQuery({ checkin, checkout, pax: next });
        }}
        minPax={1}
        maxPax={8}
        stayHelperText={stayHelperText}
        clearDatesText={clearDatesText}
        checkInLabelText={checkInLabelText}
        checkOutLabelText={checkOutLabelText}
        guestsLabelText={guestsLabelText}
        decreaseGuestsAriaLabel={bookingControlLabels.decreaseGuestsAriaLabel}
        increaseGuestsAriaLabel={bookingControlLabels.increaseGuestsAriaLabel}
      />

      {/* Notices sit below the calendar row */}
      {showConstraintGuidance ? (
        <div className="mt-4">
          <BookingNotice>
            {t("bookingConstraints.notice") as string}{" "}
            <a className="underline" href="mailto:hostelpositano@gmail.com?subject=Split%20booking%20help">
              {t("bookingConstraints.assistedLink") as string}
            </a>
            .
          </BookingNotice>
        </div>
      ) : null}
      {showSelectDatesPrompt && selectDatesPromptText ? (
        <div className="mt-4">
          <BookingNotice>{selectDatesPromptText}</BookingNotice>
        </div>
      ) : null}
      {showRebuildQuotePrompt ? <div className="mt-4"><ExpiredQuoteNotice /></div> : null}
    </div>
  );
}

export function BookPageIndicativeDisclosure({
  indicativeDisclosure,
}: {
  indicativeDisclosure: string | null;
}): JSX.Element | null {
  if (!indicativeDisclosure) return null;
  return (
    <Section padding="default" className="mx-auto max-w-7xl pt-0">
      <BookingNotice size="xs" className="text-brand-text/80">
        {indicativeDisclosure}
      </BookingNotice>
    </Section>
  );
}

export function BookPageRecoverySection({
  lang,
  roomQueryState,
  checkin,
  checkout,
  pax,
}: {
  lang: AppLanguage;
  roomQueryState: "valid" | "invalid" | "absent";
  checkin: string;
  checkout: string;
  pax: number;
}): JSX.Element {
  return (
    <Section padding="default" className="mx-auto max-w-7xl">
      <RecoveryQuoteCapture
        isValidSearch={roomQueryState === "valid"}
        resumePathname={getBookPath(lang)}
        context={{
          checkin,
          checkout,
          pax,
          source_route: getBookPath(lang),
        }}
      />
    </Section>
  );
}

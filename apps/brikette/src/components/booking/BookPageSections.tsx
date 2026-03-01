import { useTranslation } from "react-i18next";

import { Section } from "@acme/design-system/atoms";

import BookingNotice from "@/components/booking/BookingNotice";
import type { DateRange } from "@/components/booking/DateRangePicker";
import { DateRangePicker } from "@/components/booking/DateRangePicker";
import ExpiredQuoteNotice from "@/components/booking/ExpiredQuoteNotice";
import RecoveryQuoteCapture from "@/components/booking/RecoveryQuoteCapture";
import type { AppLanguage } from "@/i18n.config";
import { formatDate } from "@/utils/dateUtils";

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
}: BookPageSearchPanelProps): JSX.Element {
  const { t } = useTranslation("bookPage");

  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-brand-outline/40 bg-brand-surface p-4 shadow-sm">
      <DateRangePicker
        lang={lang}
        selected={range}
        onRangeChange={(newRange) => {
          onRangeChange(newRange);
          const newCheckin = newRange?.from ? formatDate(newRange.from) : "";
          const newCheckout = newRange?.to ? formatDate(newRange.to) : "";
          if (newCheckin && newCheckout) {
            onCanonicalQuery({ checkin: newCheckin, checkout: newCheckout, pax });
          }
        }}
        stayHelperText={stayHelperText}
        clearDatesText={clearDatesText}
        checkInLabelText={checkInLabelText}
        checkOutLabelText={checkOutLabelText}
      />
      <label className="flex flex-col gap-1 text-sm font-medium text-brand-heading">
        {guestsLabelText}
        <input
          type="number"
          min={1}
          max={8}
          value={pax}
          onChange={(e) => {
            const newPax = Number.isFinite(Number.parseInt(e.target.value, 10))
              ? Math.max(1, Number.parseInt(e.target.value, 10))
              : 1;
            onPaxChange(newPax);
            onCanonicalQuery({ checkin, checkout, pax: newPax });
          }}
          className="min-h-11 w-24 rounded-xl border border-brand-outline/40 bg-brand-bg px-3 py-2 text-brand-heading shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        />
      </label>
      {showConstraintGuidance ? (
        <BookingNotice>
          {t("bookingConstraints.notice") as string}{" "}
          <a className="underline" href="mailto:hostelpositano@gmail.com?subject=Split%20booking%20help">
            {t("bookingConstraints.assistedLink") as string}
          </a>
          .
        </BookingNotice>
      ) : null}
      {showRebuildQuotePrompt ? <ExpiredQuoteNotice /> : null}
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
        resumePathname={`/${lang}/book`}
        context={{
          checkin,
          checkout,
          pax,
          source_route: `/${lang}/book`,
        }}
      />
    </Section>
  );
}

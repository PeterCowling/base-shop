import {
  type ChangeEvent,
  memo,
} from "react";

import { useCurrentLanguage } from "../../hooks/useCurrentLanguage";
import { resolveBookingDateFormat } from "../../utils/bookingDateFormat";

import { ModalFrame } from "./primitives";
import type { BookingModal2Copy } from "./types";

const BOOKING_MODAL_2_TITLE_ID = "booking-modal-2-title";
const DEFAULT_TEST_ID = "booking-modal-2";
const CHECKIN_INPUT_ID = "booking2-checkIn";
const CHECKOUT_INPUT_ID = "booking2-checkOut";
const ADULTS_INPUT_ID = "booking2-adults";

export interface BookingModal2Props {
  readonly isOpen: boolean;
  readonly copy: BookingModal2Copy;
  readonly checkIn: string;
  readonly checkOut: string;
  readonly adults: number;
  readonly onCheckInChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onCheckOutChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onAdultsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly testId?: string;
}

const BookingModal2 = memo(function BookingModal2({
  isOpen,
  copy,
  checkIn,
  checkOut,
  adults,
  onCheckInChange,
  onCheckOutChange,
  onAdultsChange,
  onConfirm,
  onCancel,
  testId = DEFAULT_TEST_ID,
}: BookingModal2Props): JSX.Element | null {
  const lang = useCurrentLanguage();
  const { placeholder, inputLocale } = resolveBookingDateFormat(lang);

  if (!isOpen) return null;

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onCancel}
      testId={testId}
      overlayClassName="layer-modal-backdrop pointer-coarse:p-6 grid place-items-center bg-black/60 backdrop-blur-sm motion-safe:animate-fade-in dark:bg-black/80"
      ariaLabelledBy={BOOKING_MODAL_2_TITLE_ID}
    >
      <div
        className="pointer-events-auto w-full rounded-2xl bg-brand-bg p-6 text-start shadow-2xl drop-shadow-brand-primary-10
                   sm:w-96 dark:bg-brand-text dark:text-brand-surface"
      >
        <h2
          id={BOOKING_MODAL_2_TITLE_ID}
          className="mb-4 text-lg font-semibold text-brand-heading
                     text-shadow-sm [--tw-text-shadow-color:theme(colors.slate.500/0.3)]"
        >
          {copy.title}
        </h2>

        <div className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor={CHECKIN_INPUT_ID} className="text-sm font-medium text-brand-text">
              {copy.checkInLabel}
            </label>
            <input
              id={CHECKIN_INPUT_ID}
              type="date"
              lang={inputLocale}
              value={checkIn}
              onChange={onCheckInChange}
              placeholder={placeholder}
              className="w-full rounded-lg border-2 border-brand-surface p-2.5
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label htmlFor={CHECKOUT_INPUT_ID} className="text-sm font-medium text-brand-text">
              {copy.checkOutLabel}
            </label>
            <input
              id={CHECKOUT_INPUT_ID}
              type="date"
              lang={inputLocale}
              value={checkOut}
              onChange={onCheckOutChange}
              placeholder={placeholder}
              className="w-full rounded-lg border-2 border-brand-surface p-2.5
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label htmlFor={ADULTS_INPUT_ID} className="text-sm font-medium text-brand-text">
              {copy.adultsLabel}
            </label>
            <input
              id={ADULTS_INPUT_ID}
              type="number"
              min={1}
              value={adults}
              onChange={onAdultsChange}
              className="w-full rounded-lg border-2 border-brand-surface p-2.5
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-10 min-w-10 rounded bg-brand-secondary px-4 py-2 text-sm font-semibold text-brand-text
                       drop-shadow-brand-primary-40 transition-all
                       hover:bg-brand-primary/90
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            {copy.confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-10 min-w-10 rounded border border-brand-text px-4 py-2 text-sm font-semibold text-brand-text
                       transition-colors hover:bg-brand-surface
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary
                       focus-visible:ring-offset-2"
          >
            {copy.cancelLabel}
          </button>
        </div>
      </div>
    </ModalFrame>
  );
});

export default BookingModal2;

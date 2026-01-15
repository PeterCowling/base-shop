import clsx from "clsx";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import DatePicker from "react-datepicker";
import { useCurrentLanguage } from "@ui/hooks/useCurrentLanguage";
import { resolveBookingDateFormat } from "@ui/utils/bookingDateFormat";
import type {
  BookingModalCopy,
  BookingModalBuildParams,
  BookingModalHrefBuilder,
  BookingGuestOption,
} from "./types";

const BOOKING_MODAL_TITLE_ID = "booking-modal-title";
const BOOKING_CHECK_IN_ID = "booking-check-in";
const BOOKING_CHECK_OUT_ID = "booking-check-out";
const BOOKING_GUESTS_ID = "booking-people-number";
const BOOKING_SUBMIT_ID = "booking-submit";
const DEFAULT_TEST_ID = "booking-modal";

const CTA_BUTTON_CLASSNAMES = clsx(
  "inline-flex",
  "min-h-10",
  "min-w-10",
  "items-center",
  "justify-center",
  "rounded-lg",
  "bg-brand-secondary",
  "px-8",
  "py-4",
  "text-center",
  "text-lg",
  "font-bold",
  "text-brand-text",
  "drop-shadow-brand-primary-40",
  "transition-all",
  "hover:bg-brand-primary/90",
  "focus-visible:ring-brand-primary",
  "focus-visible:ring-offset-2",
);

const MOBILE_CLOSE_BUTTON_CLASSNAMES = clsx(
  "mt-4",
  "inline-flex",
  "min-h-10",
  "min-w-10",
  "items-center",
  "justify-center",
  "rounded-full",
  "px-4",
  "text-brand-text/70",
  "transition-colors",
  "hover:text-brand-heading",
  "md:hidden",
);

type ContainerProps = ComponentPropsWithoutRef<"div">;

const Container = memo(function Container({ className, ...props }: ContainerProps): JSX.Element {
  const composed = clsx("pointer-events-auto", "relative", "top-20", "mx-4", "w-full", className);
  return <div className={composed} {...props} />;
});

export interface BookingModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly copy: BookingModalCopy;
  readonly guestOptions: BookingGuestOption[];
  readonly buildBookingHref: BookingModalHrefBuilder;
  readonly minNights?: number;
  readonly today?: Date;
  readonly testId?: string;
  readonly onAction?: (params: BookingModalBuildParams) => void;
}

const DEFAULT_MIN_NIGHTS = 2;

function BookingModal({
  isOpen,
  onClose,
  copy,
  guestOptions,
  buildBookingHref,
  minNights = DEFAULT_MIN_NIGHTS,
  today: todayOverride,
  testId = DEFAULT_TEST_ID,
  onAction,
}: BookingModalProps): JSX.Element | null {
  const lang = useCurrentLanguage();
  const { dateFormat, placeholder } = useMemo(() => resolveBookingDateFormat(lang), [lang]);
  const today = useMemo<Date>(() => todayOverride ?? new Date(), [todayOverride]);

  const initialCheckout = useMemo<Date>(() => {
    const date = new Date(today);
    date.setDate(date.getDate() + minNights);
    return date;
  }, [today, minNights]);

  const [checkInDate, setCheckInDate] = useState<Date>(today);
  const [checkOutDate, setCheckOutDate] = useState<Date>(initialCheckout);
  const [guests, setGuests] = useState<number>(guestOptions[0]?.value ?? 1);

  useEffect(() => {
    if (!isOpen) return;
    setCheckInDate(today);
    setCheckOutDate(initialCheckout);
    setGuests(guestOptions[0]?.value ?? 1);
  }, [isOpen, today, initialCheckout, guestOptions]);

  const minCheckOut = useMemo<Date>(() => {
    const date = new Date(checkInDate);
    date.setDate(date.getDate() + minNights);
    return date;
  }, [checkInDate, minNights]);

  useEffect(() => {
    if (checkOutDate < minCheckOut) setCheckOutDate(minCheckOut);
  }, [checkOutDate, minCheckOut]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [isOpen, onClose]);

  const handleOverlayClick = useCallback((): void => {
    onClose();
  }, [onClose]);

  const handleOverlayKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>): void => {
      if (["Escape", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        onClose();
      }
    },
    [onClose],
  );

  const handleCheckIn = useCallback((date: Date | null): void => {
    if (date) setCheckInDate(date);
  }, []);

  const handleCheckOut = useCallback((date: Date | null): void => {
    if (date) setCheckOutDate(date);
  }, []);

  const handleGuests = useCallback((event: ChangeEvent<HTMLSelectElement>): void => {
    setGuests(Number(event.target.value));
  }, []);

  if (!isOpen) return null;

  const params: BookingModalBuildParams = {
    checkIn: checkInDate,
    checkOut: checkOutDate,
    guests,
  };

  const bookingHref = buildBookingHref(params);

  return (
    <div data-layer="modal" className="layer-modal relative" data-testid={testId}>
      <div
        role="button"
        aria-label={copy.overlayLabel}
        tabIndex={0}
        onClick={handleOverlayClick}
        onKeyDown={handleOverlayKeyDown}
        className="layer-modal-backdrop pointer-coarse:p-4 fixed inset-0 bg-black/60 backdrop-blur-sm motion-safe:animate-fade-in dark:bg-black/80"
      />

      <div className="layer-modal-container pointer-events-none flex items-start justify-center">
        <Container className="md:max-w-xl">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={BOOKING_MODAL_TITLE_ID}
            className="layer-modal-panel rounded-2xl bg-brand-bg p-8 shadow-2xl drop-shadow-brand-primary-10 dark:bg-brand-text dark:text-brand-surface"
          >
            <button
              aria-label={copy.closeLabel}
              onClick={onClose}
              className="absolute end-6 top-6 hidden size-10 items-center justify-center rounded-full text-brand-text/60 transition-colors hover:text-brand-heading md:flex"
            >
              <svg viewBox="0 0 26 25" className="size-6" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <line x1="25" y1="25" x2="1" y2="1" />
                <line x1="1" y1="25" x2="25" y2="1" />
              </svg>
            </button>

            <header className="mb-8">
              <h2
                id={BOOKING_MODAL_TITLE_ID}
                className="text-2xl font-bold text-brand-heading text-shadow-sm [--tw-text-shadow-color:theme(colors.slate.500/0.2)]"
              >
                {copy.title}
              </h2>
              <p className="mt-2 text-brand-text/70">{copy.subTitle}</p>
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="flex flex-col space-y-2">
                <label htmlFor={BOOKING_CHECK_IN_ID} className="text-sm font-medium text-brand-text">
                  {copy.checkInLabel}
                </label>
                <DatePicker
                  id={BOOKING_CHECK_IN_ID}
                  selected={checkInDate}
                  onChange={handleCheckIn}
                  minDate={today}
                  dateFormat={dateFormat}
                  className="w-full rounded-lg border-2 border-brand-surface px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  placeholderText={placeholder}
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label htmlFor={BOOKING_CHECK_OUT_ID} className="text-sm font-medium text-brand-text">
                  {copy.checkOutLabel}
                </label>
                <DatePicker
                  id={BOOKING_CHECK_OUT_ID}
                  selected={checkOutDate}
                  onChange={handleCheckOut}
                  minDate={minCheckOut}
                  dateFormat={dateFormat}
                  className="w-full rounded-lg border-2 border-brand-surface px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  placeholderText={placeholder}
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label htmlFor={BOOKING_GUESTS_ID} className="text-sm font-medium text-brand-text">
                  {copy.guestsLabel}
                </label>
                <select
                  id={BOOKING_GUESTS_ID}
                  value={guests}
                  onChange={handleGuests}
                  className="w-full rounded-lg border-2 border-brand-surface px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  {guestOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex flex-col space-y-4">
              <a
                id={BOOKING_SUBMIT_ID}
                target="_blank"
                rel="noopener noreferrer"
                href={bookingHref}
                className={CTA_BUTTON_CLASSNAMES}
                onClick={() => onAction?.(params)}
              >
                {copy.buttonLabel}
              </a>

              <button onClick={onClose} className={MOBILE_CLOSE_BUTTON_CLASSNAMES}>
                {copy.closeLabel}
              </button>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}

export default memo(BookingModal);

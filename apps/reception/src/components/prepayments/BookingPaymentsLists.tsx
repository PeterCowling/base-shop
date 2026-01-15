import React, { createRef, RefObject, useMemo } from "react";
import type { KeyboardEvent } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import BookingRefChipPrepayComponent from "./BookingRefChipPrepay";
import CheckInDateChip from "./CheckInDateChip";
import HoursChip from "./HoursChip";
import MarkAsFailedButton from "./MarkAsFailedButton";
import MarkAsPaidButton from "./MarkAsPaidButton";
import "./Prepayments.css";

const SECTION_TITLES = [
  "Agreed to Terms and Conditions",
  "First Attempt Failed",
  "Second Attempt Failed",
];

export interface BookingPaymentItem {
  bookingRef: string;
  amountToCharge: number;
  occupantId: string;
  occupantName: string;
  hoursElapsed: number | null;
  codes: number[];
  checkInDate?: string | null;
  ccCardNumber?: string;
  ccExpiry?: string;
}

export interface BookingPaymentsListsProps {
  code21List: BookingPaymentItem[];
  code5List: BookingPaymentItem[];
  code6List: BookingPaymentItem[];
  onOpenBooking: (item: BookingPaymentItem) => void;
  /** Optional click handler used for delete mode */
  onBookingClick?: (item: BookingPaymentItem) => void;
  onMarkAsPaid: (item: BookingPaymentItem) => Promise<void>;
  setMessage: (msg: string) => void;
  createPaymentTransaction: (
    bookingRef: string,
    guestId: string,
    amount: number
  ) => Promise<void>;
  /**
   * logActivity expects occupantId, then code, then description
   */
  logActivity: (
    occupantId: string,
    code: number,
    description: string
  ) => Promise<void>;
}

const BookingPaymentsLists: React.FC<BookingPaymentsListsProps> = ({
  code21List,
  code5List,
  code6List,
  onOpenBooking,
  onBookingClick,
  createPaymentTransaction,
  logActivity,
  setMessage,
}) => {
  const containerRefs = useMemo(() => {
    const refs: Record<string, RefObject<HTMLDivElement | null>> = {};
    SECTION_TITLES.forEach((title) => {
      refs[title] = createRef<HTMLDivElement>();
    });
    return refs;
  }, []);

  const sections = useMemo(
    () => [
      { data: code21List, title: SECTION_TITLES[0] },
      { data: code5List, title: SECTION_TITLES[1] },
      { data: code6List, title: SECTION_TITLES[2] },
    ],
    [code21List, code5List, code6List]
  );

  const itemRefs = useMemo(() => {
    const refs: Record<string, RefObject<HTMLLIElement | null>> = {};
    sections.forEach(({ data }) => {
      data.forEach((item) => {
        const key = `${item.occupantId}-${item.bookingRef}`;
        refs[key] = createRef<HTMLLIElement>();
      });
    });
    return refs;
  }, [sections]);

  /**
   * Renders a list section with a parent <CSSTransition> for "fade-container",
   * then a nested <TransitionGroup> for items. Each item uses <CSSTransition>
   * with a nodeRef to avoid findDOMNode usage.
   *
   * Key point: We skip rendering the entire <TransitionGroup> if 'listData' is empty.
   * This ensures <TransitionGroup> always has valid children.
   */
  const renderListSection = (
    listData: BookingPaymentItem[],
    title: string
  ) => {
    if (listData.length === 0) {
      // No items => No <TransitionGroup> => No type conflict
      return null;
    }

    const containerRef = containerRefs[title];

    return (
      <TransitionGroup component={React.Fragment}>
        <CSSTransition
          key={title}
          nodeRef={containerRef}
          timeout={1000}
          classNames="fade-container"
        >
          <div
            ref={containerRef}
            className="mb-8 w-full bg-white border border-gray-400 rounded dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
          >
            {/* Subheader */}
            <div className="p-4 bg-primary-main text-white border-b border-primary-main font-heading text-lg font-bold uppercase">
              {title}
            </div>

            {/* Items transition */}
            <TransitionGroup component="ul" className="px-4 pb-4 pt-2">
              {listData.map((item) => {
                const {
                  bookingRef,
                  amountToCharge,
                  occupantId,
                  occupantName,
                  hoursElapsed,
                  codes,
                  checkInDate,
                  ccCardNumber,
                  ccExpiry,
                } = item;

                const hasCard = !!ccCardNumber && !!ccExpiry;
                const hasCode21 = codes.includes(21);
                const hasCode5or6 = codes.includes(5) || codes.includes(6);

                let thresholdHours: number | null = null;
                if (hasCode21 && !hasCode5or6) {
                  thresholdHours = 48;
                } else if (hasCode5or6) {
                  thresholdHours = 24;
                }

                const itemKey = `${occupantId}-${bookingRef}`;
                const itemRef = itemRefs[itemKey];

                return (
                  <CSSTransition
                    key={itemKey}
                    nodeRef={itemRef}
                    timeout={1000}
                    classNames="fade-item"
                  >
                    <li ref={itemRef} className="my-4 fade-item-move">
                      <div
                        role="button"
                        tabIndex={0}
                        title="Double-click to open this booking"
                        onDoubleClick={() => onOpenBooking(item)}
                        onClick={() => onBookingClick?.(item)}
                        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            onOpenBooking(item);
                            return;
                          }

                          if (event.key === " " || event.key === "Spacebar") {
                            if (onBookingClick) {
                              event.preventDefault();
                              onBookingClick(item);
                            }
                          }
                        }}
                        className="w-full text-left cursor-pointer transition-colors p-4 rounded hover:bg-gray-50 dark:hover:bg-darkSurface font-body flex flex-wrap items-center justify-between gap-3"
                      >
                        {/* Left side: Check-In Date, Booking Ref, Guest Name */}
                        <div className="flex flex-wrap items-center gap-3">
                          <CheckInDateChip
                            checkInDate={checkInDate ?? undefined}
                          />
                          <BookingRefChipPrepayComponent
                            bookingRef={bookingRef}
                            hasCard={hasCard}
                          />
                          <span className="inline-block px-4 py-2 text-sm font-semibold">
                            {occupantName}
                          </span>
                        </div>

                        {/* Right side: Hours chip + Payment actions */}
                        <div className="flex items-center gap-2">
                          <HoursChip
                            hoursElapsed={hoursElapsed}
                            thresholdHours={thresholdHours}
                          />

                          <MarkAsPaidButton
                            bookingRef={bookingRef}
                            guestId={occupantId}
                            amount={amountToCharge}
                            createPaymentTransaction={
                              createPaymentTransaction
                            }
                            logActivity={logActivity}
                            onSuccess={() => {
                              setMessage(`Payment paid for ${bookingRef}`);
                            }}
                          />

                          {hasCard && (
                            <MarkAsFailedButton
                              bookingRef={bookingRef}
                              guestId={occupantId}
                              existingCodes={codes}
                              logActivity={logActivity}
                              onSuccess={() => {
                                setMessage(`Payment failed for ${bookingRef}`);
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </li>
                  </CSSTransition>
                );
              })}
            </TransitionGroup>
          </div>
        </CSSTransition>
      </TransitionGroup>
    );
  };

  return (
    <div className="flex flex-col items-center font-body w-full">
      {sections.map(({ data, title }) => {
        const content = renderListSection(data, title);

        return content ? (
          <React.Fragment key={title}>{content}</React.Fragment>
        ) : null;
      })}
      {/* If you have more arrays (e.g. "Cancelled"), do a similar call:
          {renderListSection(cancelledList, "Cancelled")} */}
    </div>
  );
};

export default React.memo(BookingPaymentsLists);

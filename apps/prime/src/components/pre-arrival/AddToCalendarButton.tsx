/**
 * AddToCalendarButton
 *
 * Button to download a calendar event (.ics file) for check-in.
 * Works on iOS, Android, and desktop calendar apps.
 */

'use client';

import { FC, memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { downloadIcs, type CheckInEventData } from '../../lib/calendar';

interface AddToCalendarButtonProps {
  /** Check-in date (ISO format YYYY-MM-DD) */
  checkInDate: string;
  /** Guest's first name */
  firstName: string;
  /** Booking/reservation code */
  bookingCode: string;
  /** Number of nights */
  nights: number;
  /** Additional className for styling */
  className?: string;
}

/**
 * AddToCalendarButton component.
 *
 * Downloads an ICS file for the check-in event.
 */
export const AddToCalendarButton: FC<AddToCalendarButtonProps> = memo(
  function AddToCalendarButton({
    checkInDate,
    firstName,
    bookingCode,
    nights,
    className = '',
  }) {
    const { t } = useTranslation('PreArrival');
    const [isDownloading, setIsDownloading] = useState(false);

    const handleClick = useCallback(() => {
      setIsDownloading(true);

      try {
        const eventData: CheckInEventData = {
          checkInDate,
          firstName,
          bookingCode,
          nights,
        };

        downloadIcs(eventData);
      } catch (error) {
        console.error('[AddToCalendarButton] Failed to download ICS:', error);
      } finally {
        // Small delay for UX feedback
        setTimeout(() => setIsDownloading(false), 500);
      }
    }, [checkInDate, firstName, bookingCode, nights]);

    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isDownloading}
        className={`
          inline-flex items-center gap-2 px-4 py-2
          bg-white dark:bg-gray-800
          border border-gray-300 dark:border-gray-600
          rounded-lg shadow-sm
          text-sm font-medium text-gray-700 dark:text-gray-200
          hover:bg-gray-50 dark:hover:bg-gray-700
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          ${className}
        `}
        aria-label={t('calendar.addToCalendar')}
      >
        {/* Calendar icon */}
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>
          {isDownloading
            ? t('calendar.downloading')
            : t('calendar.addToCalendar')}
        </span>
      </button>
    );
  },
);

AddToCalendarButton.displayName = 'AddToCalendarButton';
export default AddToCalendarButton;

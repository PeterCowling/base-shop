/**
 * FindMyStay
 *
 * Fallback component for guests who have lost their personal link.
 * Allows lookup of booking by reservation code and last name.
 * On successful match, redirects to authenticated portal.
 */

'use client';

import { FC, FormEvent, memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

interface FindMyStayProps {
  /** Additional className for styling */
  className?: string;
}

interface FindBookingResponse {
  success: boolean;
  redirectUrl?: string;
  error?: string;
}

/**
 * FindMyStay component.
 *
 * Booking lookup form for guests without their personal link.
 */
export const FindMyStay: FC<FindMyStayProps> = memo(function FindMyStay({
  className = '',
}) {
  const { t } = useTranslation('FindMyStay');
  const router = useRouter();

  const [bookingCode, setBookingCode] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      // Basic validation
      if (!bookingCode.trim() || !lastName.trim()) {
        setError(t('errors.fieldsRequired'));
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/find-booking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingCode: bookingCode.trim().toUpperCase(),
            lastName: lastName.trim(),
          }),
        });

        const data: FindBookingResponse = await response.json();

        if (!response.ok || !data.success) {
          // Generic error - don't reveal specifics for security
          if (response.status === 429) {
            setError(t('errors.tooManyAttempts'));
          } else {
            setError(t('errors.notFound'));
          }
          return;
        }

        // Redirect to the authenticated portal
        if (data.redirectUrl) {
          router.push(data.redirectUrl);
        }
      } catch {
        setError(t('errors.networkError'));
      } finally {
        setIsLoading(false);
      }
    },
    [bookingCode, lastName, router, t],
  );

  return (
    <div
      className={`
        max-w-md mx-auto p-6 bg-white dark:bg-gray-800
        rounded-xl shadow-lg
        ${className}
      `}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {t('subtitle')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Booking code input */}
        <div>
          <label
            htmlFor="bookingCode"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
          >
            {t('fields.bookingCode')}
          </label>
          <input
            type="text"
            id="bookingCode"
            name="bookingCode"
            value={bookingCode}
            onChange={(e) => setBookingCode(e.target.value)}
            placeholder={t('fields.bookingCodePlaceholder')}
            className={`
              w-full px-4 py-3 rounded-lg
              border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-700
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              focus:ring-2 focus:ring-primary-500 focus:border-transparent
              uppercase
            `}
            autoComplete="off"
            autoCapitalize="characters"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('fields.bookingCodeHint')}
          </p>
        </div>

        {/* Last name input */}
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
          >
            {t('fields.lastName')}
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t('fields.lastNamePlaceholder')}
            className={`
              w-full px-4 py-3 rounded-lg
              border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-700
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              focus:ring-2 focus:ring-primary-500 focus:border-transparent
            `}
            autoComplete="family-name"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('fields.lastNameHint')}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm"
          >
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full py-3 px-4 rounded-lg
            font-medium text-white
            bg-primary-600 hover:bg-primary-700
            disabled:bg-gray-400 disabled:cursor-not-allowed
            transition-colors duration-200
            ${isLoading ? 'opacity-75' : ''}
          `}
        >
          {isLoading ? t('button.loading') : t('button.submit')}
        </button>
      </form>

      {/* Help text */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('help.cantFind')}
        </p>
        <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
          {t('help.contactUs')}
        </p>
      </div>
    </div>
  );
});

FindMyStay.displayName = 'FindMyStay';
export default FindMyStay;

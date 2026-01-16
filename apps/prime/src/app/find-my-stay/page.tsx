'use client';

import { ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Inline } from '@acme/ui';
import Container from '@/components/layout/Container';

export default function FindMyStayPage() {
  const { t } = useTranslation('FindMyStay');
  const [surname, setSurname] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!surname.trim() || !bookingRef.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/find-booking?surname=${encodeURIComponent(surname)}&bookingRef=${encodeURIComponent(bookingRef)}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError(t('errors.notFound'));
        } else if (response.status === 429) {
          setError(t('errors.tooManyAttempts'));
        } else {
          setError(t('errors.generic', 'Something went wrong. Please try again.'));
        }
        return;
      }

      const data = await response.json();
      // Redirect to check-in page with the code
      window.location.href = `/staff-lookup?code=${data.checkInCode}`;
    } catch {
      setError(t('errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-svh bg-gray-50 p-4">
      <Container className="max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="min-h-11 min-w-11 rounded-full p-2 hover:bg-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-gray-500">{t('subtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="surname" className="block text-sm font-medium text-gray-700">
              {t('fields.lastName')}
            </label>
            <input
              id="surname"
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder={t('fields.lastNamePlaceholder')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="bookingRef" className="block text-sm font-medium text-gray-700">
              {t('fields.bookingCode')}
            </label>
            <input
              id="bookingRef"
              type="text"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
              placeholder={t('fields.bookingCodePlaceholder')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 font-mono uppercase focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-800">
              {error}
            </div>
          )}

          <Inline
            asChild
            gap={2}
            wrap={false}
            className="min-h-11 min-w-11 w-full justify-center rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <button
              type="submit"
              disabled={isLoading || !surname.trim() || !bookingRef.trim()}
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  <span>{t('button.submit')}</span>
                </>
              )}
            </button>
          </Inline>
        </form>
      </Container>
    </main>
  );
}

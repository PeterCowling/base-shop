/* eslint-disable ds/min-tap-size, ds/container-widths-only-at, ds/enforce-layout-primitives -- BRIK-3 BRIK-002 prime DS rules deferred */
'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

import { recordActivationFunnelEvent } from '../../lib/analytics/activationFunnel';

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
          setError(t('errors.generic'));
        }
        return;
      }

      const data = await response.json();
      if (!data.redirectUrl || typeof data.redirectUrl !== 'string') {
        setError(t('errors.redirectFailed'));
        return;
      }

      recordActivationFunnelEvent({
        type: 'lookup_success',
        sessionKey: bookingRef.trim().toUpperCase(),
        route: '/find-my-stay',
      });
      window.location.assign(data.redirectUrl);
    } catch {
      setError(t('errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-svh bg-muted p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="rounded-full p-2 hover:bg-muted/80"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="surname" className="block text-sm font-medium text-foreground">
              {t('fields.lastName')}
            </label>
            <input
              id="surname"
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder={t('fields.lastNamePlaceholder')}
              className="mt-1 w-full rounded-lg border border-border px-4 py-3 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="bookingRef" className="block text-sm font-medium text-foreground">
              {t('fields.bookingCode')}
            </label>
            <input
              id="bookingRef"
              type="text"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
              placeholder={t('fields.bookingCodePlaceholder')}
              className="mt-1 w-full rounded-lg border border-border px-4 py-3 font-mono uppercase focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-danger-soft p-4 text-danger-foreground">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !surname.trim() || !bookingRef.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                <Search className="h-5 w-5" />
                {t('button.submit')}
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

/* eslint-disable ds/container-widths-only-at, ds/min-tap-size -- BRIK-3 prime DS rules deferred */
'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { recordActivationFunnelEvent } from '../../lib/analytics/activationFunnel';

type Status = 'loading' | 'ready' | 'error' | 'verified';

function GuestEntryContent() {
  const { t } = useTranslation('FindMyStay');
  const searchParams = useSearchParams();
  const token = useMemo(() => {
    return searchParams.get('token') || searchParams.get('t') || '';
  }, [searchParams]);

  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [lastName, setLastName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [guestFirstName, setGuestFirstName] = useState('');

  useEffect(() => {
    if (!token) {
      setError(t('guestEntry.errors.missingLink'));
      setStatus('error');
      return;
    }

    let isMounted = true;

    async function validateToken() {
      try {
        const response = await fetch(`/api/guest-session?token=${encodeURIComponent(token)}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(t('guestEntry.errors.linkInvalid'));
          }
          if (response.status === 410) {
            throw new Error(t('guestEntry.errors.linkExpired'));
          }
          throw new Error(t('guestEntry.errors.validateFailed'));
        }

        if (isMounted) {
          setStatus('ready');
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : t('guestEntry.errors.validateFailed'));
          setStatus('error');
        }
      }
    }

    validateToken();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- PRIME-1: t from useTranslation is a stable reference
  }, [token]);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!lastName.trim() || !token) return;

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/guest-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, lastName: lastName.trim() }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(t('guestEntry.errors.lastNameMismatch'));
        }
        if (response.status === 429) {
          throw new Error(t('errors.tooManyAttempts'));
        }
        throw new Error(t('guestEntry.errors.verifyFailed'));
      }

      const data = await response.json() as {
        bookingId: string;
        guestUuid: string | null;
        guestFirstName: string;
      };

      localStorage.setItem('prime_guest_token', token);
      localStorage.setItem('prime_guest_booking_id', data.bookingId);
      if (data.guestUuid) {
        localStorage.setItem('prime_guest_uuid', data.guestUuid);
      }
      if (data.guestFirstName) {
        localStorage.setItem('prime_guest_first_name', data.guestFirstName);
      }
      localStorage.setItem('prime_guest_verified_at', new Date().toISOString());
      recordActivationFunnelEvent({
        type: 'verify_success',
        sessionKey: data.guestUuid ?? data.bookingId,
        route: '/g',
        context: {
          hasGuestUuid: Boolean(data.guestUuid),
        },
      });

      setGuestFirstName(data.guestFirstName || '');
      setStatus('verified');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('guestEntry.errors.verifyFailed'));
    } finally {
      setIsVerifying(false);
    }
  }

  if (status === 'loading') {
    return (
      <main className="flex min-h-svh items-center justify-center bg-muted p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="min-h-svh bg-muted p-4">
        <div className="mx-auto max-w-md rounded-xl bg-card p-6 text-center shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-foreground">{t('guestEntry.errorTitle')}</h1>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <Link
            href="/find-my-stay"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-primary-foreground hover:bg-primary/90"
          >
            {t('guestEntry.findMyStay')}
          </Link>
        </div>
      </main>
    );
  }

  if (status === 'verified') {
    return (
      <main className="min-h-svh bg-muted p-4">
        <div className="mx-auto max-w-md rounded-xl bg-card p-6 text-center shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            {guestFirstName ? t('guestEntry.welcomeName', { firstName: guestFirstName }) : t('guestEntry.youreIn')}
          </h1>
          <p className="mb-6 text-muted-foreground">
            {t('guestEntry.portalReady')}
          </p>
          <p className="mb-6 rounded-lg bg-success-soft px-3 py-2 text-sm text-success-foreground">
            {t('guestEntry.guidedSetupNote')}
          </p>
          <Link
            href="/portal"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-primary-foreground hover:bg-primary/90"
          >
            {t('guestEntry.continue')}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-svh bg-muted p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">{t('guestEntry.confirmTitle')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('guestEntry.confirmSubtitle')}
          </p>
          <p className="mt-3 rounded-lg bg-info-soft px-3 py-2 text-sm text-info-foreground">
            {t('guestEntry.whyThisHelps')}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t('guestEntry.privacyNote')}
          </p>
        </div>

        <form onSubmit={handleVerify} className="rounded-xl bg-card p-6 shadow-sm">
          <label htmlFor="lastName" className="block text-sm font-medium text-muted-foreground">
            {t('guestEntry.lastNameLabel')}
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder={t('guestEntry.lastNamePlaceholder')}
            className="mt-2 w-full rounded-lg border border-border px-4 py-3 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            disabled={isVerifying}
          />

          {error && (
            <div className="mt-4 rounded-lg bg-danger-soft p-3 text-sm text-danger-foreground">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying || !lastName.trim()}
            className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isVerifying ? t('guestEntry.checking') : t('guestEntry.continue')}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function GuestEntryPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-svh items-center justify-center bg-muted p-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
      }
    >
      <GuestEntryContent />
    </Suspense>
  );
}

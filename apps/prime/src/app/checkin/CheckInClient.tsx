/* eslint-disable ds/min-tap-size -- BRIK-2 tap-size deferred */
'use client';

/**
 * Check-in Code Lookup Page (Staff Only)
 *
 * Staff can scan a QR code or follow a link like /checkin/BRK-A7K9M.
 * The code is extracted from the URL pathname (Cloudflare Pages _redirects
 * serves this page for all /checkin/* paths).
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePathname, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Calendar, Clock, CreditCard, MapPin, User } from 'lucide-react';

import StaffReadinessBadges from '../../components/check-in/StaffReadinessBadges';
import { usePinAuth } from '../../contexts/messaging/PinAuthProvider';
import { extractCodeFromPathname, formatEtaWindow, isStaffRole } from '../../lib/checkin/helpers';
import type { StaffCheckInView } from '../../types/checkInCode';

export default function CheckInPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation('PreArrival');
  const {
    authError,
    authToken,
    isLoading: isAuthLoading,
    lockout,
    login,
    role,
    user,
  } = usePinAuth();

  const code = extractCodeFromPathname(pathname, 'checkin');

  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestData, setGuestData] = useState<StaffCheckInView | null>(null);

  const hasAccess = isStaffRole(role);

  // Redirect non-staff users
  useEffect(() => {
    if (user && role && !hasAccess) {
      router.push('/');
    }
  }, [user, role, hasAccess, router]);

  // Fetch guest data when staff accesses the page with a code
  useEffect(() => {
    if (!hasAccess || !code) {
      setIsLoading(false);
      return;
    }

    async function fetchGuestData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/check-in-lookup?code=${encodeURIComponent(code!)}`, {
          headers: authToken
            ? {
                Authorization: `Bearer ${authToken}`,
              }
            : undefined,
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('codeNotFound');
          } else if (response.status === 410) {
            setError('codeExpired');
          } else if (response.status === 401 || response.status === 403) {
            setError('lookupFailed');
          } else {
            setError('lookupFailed');
          }
          return;
        }

        const data = await response.json();
        setGuestData(data);
      } catch (err) {
        console.error('Error fetching guest data:', err);
        setError('lookupFailed');
      } finally {
        setIsLoading(false);
      }
    }

    void fetchGuestData();
  }, [authToken, hasAccess, code]);

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    await login(pin);
  }

  if (!user) {
    return (
      <div className="min-h-svh bg-muted p-4">
        <div className="mx-auto mt-12 max-w-md rounded-xl bg-card p-6 shadow-sm">
          <h1 className="text-xl font-bold text-foreground">Staff access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your staff PIN to continue.
          </p>
          <form onSubmit={handlePinSubmit} className="mt-4 space-y-3">
            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-foreground focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              placeholder="PIN"
            />
            <button
              type="submit"
              disabled={isAuthLoading || !pin.trim()}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isAuthLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          {authError && (
            <p className="mt-3 text-sm text-danger">
              {authError}
            </p>
          )}
          {lockout && (
            <p className="mt-1 text-xs text-muted-foreground">
              Failed attempts: {lockout.failedAttempts}. Remaining: {lockout.attemptsRemaining}.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show loading while checking auth
  if (!role) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  if (!code) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t('staffLookup.noCode')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-muted p-4">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full p-2 hover:bg-muted"
            aria-label={t('staffLookup.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('staffLookup.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('staffLookup.code', { code })}</p>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-muted-foreground">{t('staffLookup.loading')}</p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="rounded-xl bg-danger-soft p-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-danger" />
            <h2 className="text-lg font-semibold text-danger-foreground">
              {t(`staffLookup.errors.${error}`)}
            </h2>
            <p className="mt-2 text-sm text-danger-foreground">
              {t('staffLookup.tryAgain')}
            </p>
          </div>
        )}

        {/* Guest data */}
        {guestData && !isLoading && !error && (
          <div className="space-y-4">
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info-soft">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('staffLookup.guestName')}</p>
                  <p className="text-xl font-bold text-foreground">{guestData.guestName}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{t('staffLookup.room')}</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {guestData.roomAssignment}
                </p>
              </div>
              <div className="rounded-xl bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{t('staffLookup.nights')}</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {guestData.nights} {guestData.nights === 1 ? t('stay.night') : t('stay.nights')}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{t('staffLookup.dates')}</span>
              </div>
              <p className="mt-1 text-foreground">
                {new Date(guestData.checkInDate).toLocaleDateString()} -{' '}
                {new Date(guestData.checkOutDate).toLocaleDateString()}
              </p>
            </div>

            {(guestData.etaWindow || guestData.etaMethod) && (
              <div className="rounded-xl bg-info-soft p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('staffLookup.eta')}</span>
                </div>
                <p className="mt-1 text-info-foreground">
                  {formatEtaWindow(guestData.etaWindow)}
                  {guestData.etaMethod && ` (${t(`eta.methods.${guestData.etaMethod}`)})`}
                </p>
              </div>
            )}

            <StaffReadinessBadges
              readiness={guestData.readiness}
              personalization={guestData.personalization}
              operational={guestData.operational}
            />

            <div className="rounded-xl bg-success-soft p-4">
              <div className="flex items-center gap-2 text-success">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">{t('staffLookup.payment')}</span>
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-success-foreground">{t('cash.cityTax.label')}</span>
                  <span className="font-semibold text-success-foreground">
                    €{guestData.cityTaxDue.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-success-foreground">{t('cash.deposit.label')}</span>
                  <span className="font-semibold text-success-foreground">
                    €{guestData.depositDue.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-success pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-success-foreground">{t('cash.total')}</span>
                    <span className="text-lg font-bold text-success-foreground">
                      €{(guestData.cityTaxDue + guestData.depositDue).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

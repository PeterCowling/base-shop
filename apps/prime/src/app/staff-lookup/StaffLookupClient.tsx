/* eslint-disable ds/min-tap-size -- BRIK-2 tap-size deferred */
'use client';

/**
 * Staff Check-in Code Lookup Page
 *
 * Staff can enter a check-in code or scan a QR code to look up guest details.
 * This page handles the code via query parameter (?code=XXX) instead of a dynamic route
 * for static export compatibility.
 */

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Calendar, Clock, CreditCard, MapPin, Search, User } from 'lucide-react';

import StaffReadinessBadges from '../../components/check-in/StaffReadinessBadges';
import { usePinAuth } from '../../contexts/messaging/PinAuthProvider';
import { recordActivationFunnelEvent } from '../../lib/analytics/activationFunnel';
import { extractCodeFromPathname, formatEtaWindow, isStaffRole } from '../../lib/checkin/helpers';
import type { StaffCheckInView } from '../../types/checkInCode';

function StaffLookupContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  const codeFromUrl = searchParams.get('code') ?? extractCodeFromPathname(pathname, 'staff-lookup') ?? '';
  const [inputCode, setInputCode] = useState(codeFromUrl);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestData, setGuestData] = useState<StaffCheckInView | null>(null);

  const hasAccess = isStaffRole(role);

  // Redirect non-staff users
  useEffect(() => {
    if (user && role && !hasAccess) {
      router.push('/');
    }
  }, [user, role, hasAccess, router]);

  const performLookup = useCallback(async (code: string) => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);
    setGuestData(null);

    try {
      const response = await fetch(`/api/check-in-lookup?code=${encodeURIComponent(code.trim())}`, {
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
      recordActivationFunnelEvent({
        type: 'staff_lookup_used',
        sessionKey: code.trim().toUpperCase(),
        route: '/staff-lookup',
      });
    } catch (err) {
      console.error('Error fetching guest data:', err);
      setError('lookupFailed');
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  // Auto-lookup if code in URL
  useEffect(() => {
    if (codeFromUrl && hasAccess) {
      performLookup(codeFromUrl);
    }
  }, [codeFromUrl, hasAccess, performLookup]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    performLookup(inputCode);
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    await login(pin);
  }

  // Show loading while checking auth
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
            <p className="text-sm text-muted-foreground">{t('staffLookup.subtitle')}</p>
          </div>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder={t('staffLookup.placeholder')}
              className="flex-1 rounded-lg border border-border px-4 py-3 text-lg font-mono uppercase focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputCode.trim()}
              className="rounded-lg bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>

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
            {/* Guest name */}
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

            {/* Room and dates */}
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

            {/* Dates */}
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

            {/* ETA */}
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

            {/* Payment amounts */}
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

export default function StaffLookupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <StaffLookupContent />
    </Suspense>
  );
}

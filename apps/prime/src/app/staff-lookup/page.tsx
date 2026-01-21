'use client';

// Force dynamic rendering to avoid SSG issues with context providers
export const dynamic = 'force-dynamic';

/**
 * Staff Check-in Code Lookup Page
 *
 * Staff can enter a check-in code or scan a QR code to look up guest details.
 * This page handles the code via query parameter (?code=XXX) instead of a dynamic route
 * for static export compatibility.
 */

import { AlertCircle, ArrowLeft, Calendar, Clock, CreditCard, MapPin, Search, User } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { usePinAuth } from '../../contexts/messaging/PinAuthProvider';

interface StaffCheckInView {
  guestName: string;
  roomAssignment: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  cityTaxDue: number;
  depositDue: number;
  etaWindow: string | null;
  etaMethod: string | null;
}

/**
 * Check if the user has staff-level access.
 */
function isStaffRole(role: string | null): boolean {
  return role === 'staff' || role === 'admin' || role === 'owner';
}

/**
 * Format ETA window for display.
 */
function formatEtaWindow(window: string | null): string {
  if (!window) return '-';
  const [hours, minutes] = window.split(':').map(Number);
  const endMinutes = minutes + 30;
  const endHours = hours + Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  return `${window} - ${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
}

function StaffLookupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation('PreArrival');
  const { role, user } = usePinAuth();

  const codeFromUrl = searchParams.get('code') ?? '';
  const [inputCode, setInputCode] = useState(codeFromUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestData, setGuestData] = useState<StaffCheckInView | null>(null);

  const hasAccess = isStaffRole(role);

  // Redirect non-staff users
  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    if (user && role && !hasAccess) {
      router.push('/');
    }
  }, [user, role, hasAccess, router]);

  // Auto-lookup if code in URL
  useEffect(() => {
    if (codeFromUrl && hasAccess) {
      performLookup(codeFromUrl);
    }
  }, [codeFromUrl, hasAccess]);

  async function performLookup(code: string) {
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);
    setGuestData(null);

    try {
      const response = await fetch(`/api/check-in-lookup?code=${encodeURIComponent(code.trim())}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('codeNotFound');
        } else if (response.status === 410) {
          setError('codeExpired');
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    performLookup(inputCode);
  }

  // Show loading while checking auth
  if (!user || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full p-2 hover:bg-gray-200"
            aria-label={t('staffLookup.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('staffLookup.title')}</h1>
            <p className="text-sm text-gray-500">{t('staffLookup.subtitle')}</p>
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
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-lg font-mono uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputCode.trim()}
              className="rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="mt-4 text-gray-500">{t('staffLookup.loading')}</p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="rounded-xl bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
            <h2 className="text-lg font-semibold text-red-800">
              {t(`staffLookup.errors.${error}`)}
            </h2>
            <p className="mt-2 text-sm text-red-600">
              {t('staffLookup.tryAgain')}
            </p>
          </div>
        )}

        {/* Guest data */}
        {guestData && !isLoading && !error && (
          <div className="space-y-4">
            {/* Guest name */}
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('staffLookup.guestName')}</p>
                  <p className="text-xl font-bold text-gray-900">{guestData.guestName}</p>
                </div>
              </div>
            </div>

            {/* Room and dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{t('staffLookup.room')}</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {guestData.roomAssignment}
                </p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{t('staffLookup.nights')}</span>
                </div>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {guestData.nights} {guestData.nights === 1 ? t('stay.night') : t('stay.nights')}
                </p>
              </div>
            </div>

            {/* Dates */}
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{t('staffLookup.dates')}</span>
              </div>
              <p className="mt-1 text-gray-900">
                {new Date(guestData.checkInDate).toLocaleDateString()} -{' '}
                {new Date(guestData.checkOutDate).toLocaleDateString()}
              </p>
            </div>

            {/* ETA */}
            {(guestData.etaWindow || guestData.etaMethod) && (
              <div className="rounded-xl bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('staffLookup.eta')}</span>
                </div>
                <p className="mt-1 text-blue-900">
                  {formatEtaWindow(guestData.etaWindow)}
                  {guestData.etaMethod && ` (${t(`eta.methods.${guestData.etaMethod}`)})`}
                </p>
              </div>
            )}

            {/* Payment amounts */}
            <div className="rounded-xl bg-green-50 p-4">
              <div className="flex items-center gap-2 text-green-600">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">{t('staffLookup.payment')}</span>
              </div>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-green-700">{t('cash.cityTax.label')}</span>
                  <span className="font-semibold text-green-900">
                    €{guestData.cityTaxDue.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-700">{t('cash.deposit.label')}</span>
                  <span className="font-semibold text-green-900">
                    €{guestData.depositDue.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-green-200 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-800">{t('cash.total')}</span>
                    <span className="text-lg font-bold text-green-900">
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    }>
      <StaffLookupContent />
    </Suspense>
  );
}

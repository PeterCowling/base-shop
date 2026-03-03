'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';

import { GuestProfileForm } from '../../../../components/profile/GuestProfileForm';
import { useUnifiedBookingData } from '../../../../hooks/dataOrchestrator/useUnifiedBookingData';
import { useFetchGuestProfile } from '../../../../hooks/pureData/useFetchGuestProfile';

export default function AccountProfilePage() {
  const { t } = useTranslation('Onboarding');
  const { occupantData, isLoading: bookingLoading } = useUnifiedBookingData();

  const currentBookingId = occupantData?.reservationCode ?? null;

  const { effectiveProfile, isLoading: profileLoading } = useFetchGuestProfile({
    currentBookingId: currentBookingId ?? undefined,
  });

  const isLoading = bookingLoading || profileLoading;

  return (
    <main className="min-h-dvh bg-muted p-4 pb-20">
      <div className="mx-auto space-y-4">
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <h1 className="mb-4 text-xl font-semibold text-foreground">
            {t('guestProfile.title')}
          </h1>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-12 rounded-lg bg-muted" />
                <div className="h-12 rounded-lg bg-muted" />
                <div className="h-12 rounded-lg bg-muted" />
              </div>
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-8 rounded-full bg-muted" />
                <div className="h-8 rounded-full bg-muted" />
              </div>
            </div>
          ) : (
            <GuestProfileForm
              effectiveProfile={effectiveProfile}
              currentBookingId={currentBookingId}
            />
          )}
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            {t('handoff.cta')}
          </Link>
        </div>
      </div>
    </main>
  );
}

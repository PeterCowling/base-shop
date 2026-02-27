/* eslint-disable ds/container-widths-only-at, ds/no-hardcoded-copy -- BRIK-3 prime DS rules deferred */
'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import RoutePlanner from '../../../components/routes/RoutePlanner';
import { useUnifiedBookingData } from '../../../hooks/dataOrchestrator/useUnifiedBookingData';
import { usePreArrivalState } from '../../../hooks/usePreArrivalState';

export default function RoutesPage() {
  const router = useRouter();
  const { occupantData, isLoading, error, isCheckedIn } = useUnifiedBookingData();

  const {
    preArrivalData,
    saveRoute,
    updateChecklistItem,
  } = usePreArrivalState({
    checkInDate: occupantData?.checkInDate,
    checkOutDate: occupantData?.checkOutDate,
    isCheckedIn,
    nights: occupantData?.nights ?? 1,
    cityTaxDue: occupantData?.cityTax?.totalDue,
  });

  const handleSaveRoute = useCallback((slug: string | null) => {
    void saveRoute(slug);
  }, [saveRoute]);

  const handleRouteViewed = useCallback(() => {
    void updateChecklistItem('routePlanned', true);
  }, [updateChecklistItem]);

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !occupantData) {
    return (
      <div className="p-4 text-center mt-5 text-danger">
        Unable to load route planner data.
      </div>
    );
  }

  return (
    <main className="min-h-svh bg-muted px-4 py-6 pb-24">
      <div className="mx-auto max-w-md rounded-2xl bg-card p-4 shadow-sm">
        <RoutePlanner
          savedRouteSlug={preArrivalData.routeSaved}
          onSaveRoute={handleSaveRoute}
          onRouteViewed={handleRouteViewed}
          onClose={() => router.push('/')}
        />
      </div>
    </main>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !occupantData) {
    return (
      <div className="p-4 text-center mt-5 text-red-600">
        Unable to load route planner data.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 pb-24">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-4 shadow-sm">
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

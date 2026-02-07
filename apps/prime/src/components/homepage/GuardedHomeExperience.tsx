'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import ArrivalHome from '../arrival/ArrivalHome';
import ReadinessDashboard from '../pre-arrival/ReadinessDashboard';
import { useUnifiedBookingData } from '../../hooks/dataOrchestrator/useUnifiedBookingData';
import { useCheckInCode } from '../../hooks/useCheckInCode';
import { usePreArrivalState } from '../../hooks/usePreArrivalState';
import type { ChecklistProgress } from '../../types/preArrival';
import HomePage from './HomePage';

export default function GuardedHomeExperience() {
  const router = useRouter();
  const { occupantData, isLoading, error, isCheckedIn } = useUnifiedBookingData();

  const checkInDate = occupantData?.checkInDate;
  const checkOutDate = occupantData?.checkOutDate;
  const nights = occupantData?.nights ?? 1;
  const firstName = occupantData?.firstName ?? 'Guest';
  const cityTaxDue = occupantData?.cityTax?.totalDue;

  const {
    arrivalState,
    preArrivalData,
    cashAmounts,
    updateChecklistItem,
  } = usePreArrivalState({
    checkInDate,
    checkOutDate,
    isCheckedIn,
    nights,
    cityTaxDue,
  });

  const {
    code: checkInCode,
    isLoading: isCodeLoading,
  } = useCheckInCode({
    checkOutDate,
    enabled: arrivalState === 'arrival-day',
  });

  const handleChecklistItemClick = useCallback((item: keyof ChecklistProgress) => {
    if (item === 'routePlanned') {
      router.push('/routes');
      return;
    }

    if (item === 'etaConfirmed') {
      router.push('/eta');
      return;
    }

    if (item === 'cashPrepared') {
      router.push('/cash-prep');
      return;
    }

    const current = preArrivalData.checklistProgress[item];
    void updateChecklistItem(item, !current);
  }, [preArrivalData.checklistProgress, router, updateChecklistItem]);

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
        Unable to load your booking information.
      </div>
    );
  }

  if (arrivalState === 'pre-arrival' && checkInDate) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6 pb-24">
        <div className="mx-auto max-w-md">
          <ReadinessDashboard
            preArrivalData={preArrivalData}
            arrivalState={arrivalState}
            checkInDate={checkInDate}
            nights={nights}
            firstName={firstName}
            cashAmounts={cashAmounts}
            onChecklistItemClick={handleChecklistItemClick}
          />
          <div className="mt-8">
            <HomePage />
          </div>
        </div>
      </main>
    );
  }

  if (arrivalState === 'arrival-day') {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6 pb-24">
        <div className="mx-auto max-w-md">
          <ArrivalHome
            firstName={firstName}
            checkInCode={checkInCode}
            isCodeLoading={isCodeLoading}
            preArrivalData={preArrivalData}
            cashAmounts={cashAmounts}
            nights={nights}
            onChecklistItemClick={handleChecklistItemClick}
          />
          <div className="mt-8">
            <HomePage />
          </div>
        </div>
      </main>
    );
  }

  return <HomePage />;
}

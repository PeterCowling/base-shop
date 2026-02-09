'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import CashPrep from '../../../components/pre-arrival/CashPrep';
import { useUnifiedBookingData } from '../../../hooks/dataOrchestrator/useUnifiedBookingData';
import { usePreArrivalState } from '../../../hooks/usePreArrivalState';

export default function CashPrepPage() {
  const router = useRouter();
  const { occupantData, isLoading, error, isCheckedIn } = useUnifiedBookingData();

  const { preArrivalData, cashAmounts, setCashReady } = usePreArrivalState({
    checkInDate: occupantData?.checkInDate,
    checkOutDate: occupantData?.checkOutDate,
    isCheckedIn,
    nights: occupantData?.nights ?? 1,
    cityTaxDue: occupantData?.cityTax?.totalDue,
  });

  const handleConfirm = useCallback((cityTaxReady: boolean, depositReady: boolean) => {
    void setCashReady(cityTaxReady, depositReady).then(() => {
      router.push('/');
    });
  }, [router, setCashReady]);

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
        Unable to load cash preparation details.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 pb-24">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-4 shadow-sm">
        <CashPrep
          cityTaxAmount={cashAmounts.cityTax}
          depositAmount={cashAmounts.deposit}
          cityTaxReady={preArrivalData.cashReadyCityTax}
          depositReady={preArrivalData.cashReadyDeposit}
          onConfirm={handleConfirm}
          onBack={() => router.push('/')}
        />
      </div>
    </main>
  );
}

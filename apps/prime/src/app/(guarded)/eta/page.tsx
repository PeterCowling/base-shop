'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import EtaConfirmation from '../../../components/pre-arrival/EtaConfirmation';
import { useUnifiedBookingData } from '../../../hooks/dataOrchestrator/useUnifiedBookingData';
import { usePreArrivalState } from '../../../hooks/usePreArrivalState';
import type { EtaMethod } from '../../../types/preArrival';

export default function EtaPage() {
  const router = useRouter();
  const { occupantData, isLoading, error, isCheckedIn } = useUnifiedBookingData();

  const { preArrivalData, setEta } = usePreArrivalState({
    checkInDate: occupantData?.checkInDate,
    checkOutDate: occupantData?.checkOutDate,
    isCheckedIn,
    nights: occupantData?.nights ?? 1,
    cityTaxDue: occupantData?.cityTax?.totalDue,
  });

  const handleConfirm = useCallback((window: string, method: EtaMethod, note?: string) => {
    void setEta(window, method, note).then(() => {
      router.push('/');
    });
  }, [router, setEta]);

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
        Unable to load ETA data.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 pb-24">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-4 shadow-sm">
        <EtaConfirmation
          currentEtaWindow={preArrivalData.etaWindow}
          currentEtaMethod={preArrivalData.etaMethod}
          currentEtaNote={preArrivalData.etaNote}
          onConfirm={handleConfirm}
          onBack={() => router.push('/')}
        />
      </div>
    </main>
  );
}

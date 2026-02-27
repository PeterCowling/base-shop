/* eslint-disable ds/container-widths-only-at -- BRIK-3 prime DS rules deferred */
'use client';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

import CashPrep from '../../../components/pre-arrival/CashPrep';
import { useUnifiedBookingData } from '../../../hooks/dataOrchestrator/useUnifiedBookingData';
import { usePreArrivalState } from '../../../hooks/usePreArrivalState';

export default function CashPrepPage() {
  const { t } = useTranslation('PreArrival');
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
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !occupantData) {
    return (
      <div className="p-4 text-center mt-5 text-danger">
        {t('cash.loadError')}
      </div>
    );
  }

  return (
    <main className="min-h-svh bg-muted px-4 py-6 pb-24">
      <div className="mx-auto max-w-md rounded-2xl bg-card p-4 shadow-sm">
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

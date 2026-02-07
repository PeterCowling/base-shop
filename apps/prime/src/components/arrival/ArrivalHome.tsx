/**
 * ArrivalHome.tsx
 *
 * Arrival day home screen shown when guest is on their check-in date.
 * Displays the check-in QR code prominently along with important reminders.
 */

import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  CreditCard,
  MapPin,
  Sparkles,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { FC, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckInQR } from '../check-in/CheckInQR';
import type { PreArrivalData, ChecklistProgress } from '../../types/preArrival';

interface ArrivalHomeProps {
  /** Guest's first name */
  firstName: string;
  /** Check-in code (if available) */
  checkInCode: string | null;
  /** Whether check-in code is loading */
  isCodeLoading: boolean;
  /** Pre-arrival data */
  preArrivalData: PreArrivalData;
  /** Cash amounts for display */
  cashAmounts: {
    cityTax: number;
    deposit: number;
  };
  /** Number of nights */
  nights: number;
  /** Handler for checklist item clicks */
  onChecklistItemClick: (item: keyof ChecklistProgress) => void;
  /** Optional class name */
  className?: string;
}

/**
 * ArrivalHome
 *
 * The arrival day experience focused on check-in readiness.
 */
export const ArrivalHome: FC<ArrivalHomeProps> = memo(function ArrivalHome({
  firstName,
  checkInCode,
  isCodeLoading,
  preArrivalData,
  cashAmounts,
  nights,
  onChecklistItemClick,
  className = '',
}) {
  const { t } = useTranslation('PreArrival');

  const totalCash = cashAmounts.cityTax + cashAmounts.deposit;
  const cashReady = preArrivalData.checklistProgress.cashPrepared;

  const handleCashClick = useCallback(() => {
    onChecklistItemClick('cashPrepared');
  }, [onChecklistItemClick]);

  const handleLocationClick = useCallback(() => {
    onChecklistItemClick('locationSaved');
  }, [onChecklistItemClick]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Welcome header */}
      <div className="text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700">
          <Sparkles className="h-4 w-4" />
          {t('arrival.badge')}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('arrival.welcome', { name: firstName })}
        </h1>
        <p className="mt-1 text-gray-600">{t('arrival.subtitle')}</p>
      </div>

      {/* Check-in QR section */}
      <div className="rounded-2xl bg-gradient-to-b from-blue-50 to-indigo-50 p-6">
        <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-gray-500">
          {t('arrival.showAtReception')}
        </h2>

        {isCodeLoading ? (
          <div className="flex flex-col items-center py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500">{t('arrival.generatingCode')}</p>
          </div>
        ) : checkInCode ? (
          <CheckInQR code={checkInCode} />
        ) : (
          <div className="py-8 text-center text-gray-500">
            <p>{t('arrival.codeUnavailable')}</p>
          </div>
        )}
      </div>

      {/* Cash reminder - prominent if not ready */}
      <button
        type="button"
        onClick={handleCashClick}
        className={`flex w-full items-start gap-4 rounded-xl p-4 text-start transition-colors ${
          cashReady
            ? 'bg-green-50 hover:bg-green-100'
            : 'bg-amber-50 hover:bg-amber-100'
        }`}
      >
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
            cashReady ? 'bg-green-100' : 'bg-amber-100'
          }`}
        >
          <Banknote className={`h-6 w-6 ${cashReady ? 'text-green-600' : 'text-amber-600'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {!cashReady && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            {cashReady && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            <p className={`font-semibold ${cashReady ? 'text-green-800' : 'text-amber-800'}`}>
              {cashReady ? t('arrival.cashReady') : t('arrival.cashReminder')}
            </p>
          </div>
          <p className={`mt-1 text-sm ${cashReady ? 'text-green-700' : 'text-amber-700'}`}>
            {t('arrival.cashAmount', { amount: totalCash })}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <span className={cashReady ? 'text-green-600' : 'text-amber-600'}>
              {t('arrival.cityTaxLabel', { amount: cashAmounts.cityTax })}
            </span>
            <span className={cashReady ? 'text-green-600' : 'text-amber-600'}>
              {t('arrival.depositLabel', { amount: cashAmounts.deposit })}
            </span>
          </div>
        </div>
        <ChevronRight className={`h-5 w-5 ${cashReady ? 'text-green-400' : 'text-amber-400'}`} />
      </button>

      {/* ID reminder */}
      <div className="flex items-center gap-4 rounded-xl bg-blue-50 p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
          <CreditCard className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="font-medium text-blue-800">{t('arrival.idReminder')}</p>
          <p className="text-sm text-blue-600">{t('arrival.idNote')}</p>
        </div>
      </div>

      {/* Location quick access */}
      <button
        type="button"
        onClick={handleLocationClick}
        className="flex w-full items-center gap-4 rounded-xl bg-gray-50 p-4 text-start transition-colors hover:bg-gray-100"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
          <MapPin className="h-5 w-5 text-gray-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{t('arrival.findUs')}</p>
          <p className="text-sm text-gray-500">{t('location.address')}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </button>

      {/* What happens next */}
      <div className="rounded-xl bg-gray-50 p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          {t('arrival.whatHappensNext')}
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
              1
            </span>
            <span className="text-sm text-gray-700">{t('arrival.step1')}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
              2
            </span>
            <span className="text-sm text-gray-700">{t('arrival.step2')}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
              3
            </span>
            <span className="text-sm text-gray-700">{t('arrival.step3')}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600">
              4
            </span>
            <span className="text-sm text-gray-700">{t('arrival.step4')}</span>
          </li>
        </ul>
      </div>

      {/* Stay summary */}
      <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
        <Clock className="h-5 w-5 text-blue-500" />
        <div>
          <p className="font-medium text-gray-900">
            {nights} {nights === 1 ? t('stay.night') : t('stay.nights')}
          </p>
          <p className="text-sm text-gray-500">{t('stay.location')}</p>
        </div>
      </div>
    </div>
  );
});

export default ArrivalHome;

/**
 * ArrivalHome.tsx
 *
 * Arrival day home screen shown when guest is on their check-in date.
 * Displays the check-in QR code prominently along with important reminders.
 */

import { type FC, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  MapPin,
  MessageCircle,
  Sparkles,
} from 'lucide-react';

import { ArrivalCodePanel, UtilityActionStrip } from '@acme/ui';

import { recordActivationFunnelEvent } from '../../lib/analytics/activationFunnel';
import type { GuestKeycardStatus } from '../../lib/preArrival/keycardStatus';
import type { ChecklistProgress,PreArrivalData } from '../../types/preArrival';
import { CheckInQR } from '../check-in/CheckInQR';

import KeycardStatus from './KeycardStatus';

interface ArrivalHomeProps {
  /** Guest's first name */
  firstName: string;
  /** Check-in code (if available) */
  checkInCode: string | null;
  /** Whether check-in code is loading */
  isCodeLoading: boolean;
  /** Whether the code is stale (from cache) */
  isCodeStale?: boolean;
  /** Whether the device is offline */
  isOffline?: boolean;
  /** Handler to refresh the code */
  onRefreshCode?: () => void;
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
  /** Guest keycard status */
  keycardStatus?: GuestKeycardStatus;
  /** Optional class name */
  className?: string;
}

const DEFAULT_KEYCARD_STATUS: GuestKeycardStatus = {
  state: 'pending-issue',
  hasLostCardNotice: false,
  latestTransactionType: null,
  latestTransactionAt: null,
};

function getFunnelSessionKey(): string {
  if (typeof window === 'undefined') {
    return 'unknown-session';
  }

  return (
    localStorage.getItem('prime_guest_uuid') ||
    localStorage.getItem('prime_guest_booking_id') ||
    'unknown-session'
  );
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
  isCodeStale = false,
  isOffline = false,
  onRefreshCode,
  preArrivalData,
  cashAmounts,
  nights,
  onChecklistItemClick,
  keycardStatus = DEFAULT_KEYCARD_STATUS,
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

  const utilityActions = [
    {
      id: 'maps',
      label: 'Maps',
      icon: MapPin,
      onSelect: () => {
        recordActivationFunnelEvent({
          type: 'utility_action_used',
          sessionKey: getFunnelSessionKey(),
          route: '/',
          stepId: 'maps',
          context: { surface: 'arrival-day' },
        });
        handleLocationClick();
      },
      variant: 'primary' as const,
    },
    {
      id: 'cash',
      label: 'Cash',
      icon: CalendarDays,
      onSelect: () => {
        recordActivationFunnelEvent({
          type: 'utility_action_used',
          sessionKey: getFunnelSessionKey(),
          route: '/',
          stepId: 'cash',
          context: { surface: 'arrival-day' },
        });
        handleCashClick();
      },
    },
    {
      id: 'support',
      label: 'Support',
      icon: MessageCircle,
      onSelect: () => {
        recordActivationFunnelEvent({
          type: 'utility_action_used',
          sessionKey: getFunnelSessionKey(),
          route: '/',
          stepId: 'support',
          context: { surface: 'arrival-day' },
        });
        if (typeof window !== 'undefined') {
          window.open('mailto:hostelbrikette@gmail.com', '_self');
        }
      },
    },
  ];

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
      <div>
        {/* Stale warning banner */}
        {isCodeStale && checkInCode && (
          <div className="mb-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{t('arrival.codeStaleWarning')}</span>
            </div>
          </div>
        )}

        {/* Offline no cache message */}
        {isOffline && !checkInCode && !isCodeLoading && (
          <div className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{t('arrival.offlineNoCache')}</span>
            </div>
          </div>
        )}

        <ArrivalCodePanel
          title={t('arrival.showAtReception')}
          isLoading={isCodeLoading}
          code={checkInCode}
          loadingLabel={t('arrival.generatingCode')}
          unavailableLabel={t('arrival.codeUnavailable')}
          renderCode={(code) => <CheckInQR code={code} />}
        />

        {/* Refresh button when back online with stale code */}
        {!isOffline && isCodeStale && checkInCode && onRefreshCode && (
          <button
            type="button"
            onClick={onRefreshCode}
            className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {t('arrival.refreshCode')}
          </button>
        )}
      </div>

      <UtilityActionStrip actions={utilityActions} />

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

      <KeycardStatus status={keycardStatus} />

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

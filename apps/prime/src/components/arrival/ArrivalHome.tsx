/**
 * ArrivalHome.tsx
 *
 * Arrival day home screen shown when guest is on their check-in date.
 * Displays the check-in QR code prominently along with important reminders.
 */
'use client';

import { type FC, memo, useCallback, useMemo } from 'react';
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

interface NextStepItemProps {
  index: number;
  text: string;
  isComplete?: boolean;
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

const NextStepItem: FC<NextStepItemProps> = memo(function NextStepItem({
  index,
  text,
  isComplete = false,
}) {
  const badgeClassName = isComplete
    ? 'bg-success-soft text-success-foreground'
    : 'bg-info-soft text-info-foreground';

  return (
    <li className="grid grid-cols-6 items-start gap-3">
      <span
        className={`col-span-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${badgeClassName}`}
      >
        {index}
      </span>
      <span className="col-span-5 text-sm text-foreground">{text}</span>
    </li>
  );
});

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

  const utilityActions = useMemo(
    () => [
      {
        id: 'maps',
        label: t('utilityActions.maps'),
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
        label: t('cash.title'),
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
        label: t('utilityActions.support'),
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
            // i18n-exempt -- PRIME-1 [ttl=2026-12-31]: URI scheme target, not user-facing copy
            window.open('mailto:hostelbrikette@gmail.com', '_self');
          }
        },
      },
    ],
    [handleCashClick, handleLocationClick, t]
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Welcome header */}
      <div className="text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-success-soft px-4 py-1.5 text-sm font-medium text-success-foreground">
          <Sparkles className="h-4 w-4" />
          {t('arrival.badge')}
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {t('arrival.welcome', { name: firstName })}
        </h1>
        <p className="mt-1 text-muted-foreground">{t('arrival.subtitle')}</p>
      </div>

      {/* Check-in QR section */}
      <div>
        {/* Stale warning banner */}
        {isCodeStale && checkInCode && (
          <div className="mb-3 rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning-foreground">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                {t('arrival.codeStaleWarning')}
              </span>
            </div>
          </div>
        )}

        {/* Offline no cache message */}
        {isOffline && !checkInCode && !isCodeLoading && (
          <div className="mb-3 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger-foreground">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                {t('arrival.offlineNoCache')}
              </span>
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
            className="mt-3 h-11 min-w-11 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
        className={`flex min-h-10 min-w-10 w-full items-start gap-4 rounded-xl p-4 text-start transition-colors ${
          cashReady
            ? 'bg-success-soft'
            : 'bg-warning-soft'
        }`}
      >
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
            cashReady ? 'bg-success-soft' : 'bg-warning-soft'
          }`}
        >
          <Banknote className={`h-6 w-6 ${cashReady ? 'text-success-foreground' : 'text-warning-foreground'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {!cashReady && <AlertTriangle className="h-4 w-4 text-warning-foreground" />}
            {cashReady && <CheckCircle2 className="h-4 w-4 text-success-foreground" />}
            <p className={`font-semibold ${cashReady ? 'text-success-foreground' : 'text-warning-foreground'}`}>
              {cashReady ? t('arrival.cashReady') : t('arrival.cashReminder')}
            </p>
          </div>
          <p className={`mt-1 text-sm ${cashReady ? 'text-success-foreground' : 'text-warning-foreground'}`}>
            {t('arrival.cashAmount', { amount: totalCash })}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <span className={cashReady ? 'text-success-foreground' : 'text-warning-foreground'}>
              {t('arrival.cityTaxLabel', { amount: cashAmounts.cityTax })}
            </span>
            <span className={cashReady ? 'text-success-foreground' : 'text-warning-foreground'}>
              {t('arrival.depositLabel', { amount: cashAmounts.deposit })}
            </span>
          </div>
        </div>
        <ChevronRight className={`h-5 w-5 ${cashReady ? 'text-success-foreground' : 'text-warning-foreground'}`} />
      </button>

      {/* ID reminder */}
      <div className="flex items-center gap-4 rounded-xl bg-info-soft p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-info-soft">
          <CreditCard className="h-5 w-5 text-info-foreground" />
        </div>
        <div>
          <p className="font-medium text-info-foreground">{t('arrival.idReminder')}</p>
          <p className="text-sm text-info-foreground">{t('arrival.idNote')}</p>
        </div>
      </div>

      <KeycardStatus status={keycardStatus} />

      {/* Location quick access */}
      <button
        type="button"
        onClick={handleLocationClick}
        className="flex h-11 min-w-11 w-full items-center gap-4 rounded-xl bg-muted p-4 text-start transition-colors hover:bg-muted/80"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
          <MapPin className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground">{t('arrival.findUs')}</p>
          <p className="text-sm text-muted-foreground">{t('location.address')}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* What happens next */}
      <div className="rounded-xl bg-muted p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('arrival.whatHappensNext')}
        </h3>
        <ul className="space-y-3">
          <NextStepItem index={1} text={t('arrival.step1')} />
          <NextStepItem index={2} text={t('arrival.step2')} />
          <NextStepItem index={3} text={t('arrival.step3')} />
          <NextStepItem index={4} text={t('arrival.step4')} isComplete />
        </ul>
      </div>

      {/* Stay summary */}
      <div className="flex items-center gap-3 rounded-xl bg-info-soft p-4">
        <Clock className="h-5 w-5 text-info-foreground" />
        <div>
          <p className="font-medium text-foreground">
            {nights} {nights === 1 ? t('stay.night') : t('stay.nights')}
          </p>
          <p className="text-sm text-muted-foreground">{t('stay.location')}</p>
        </div>
      </div>
    </div>
  );
});

export default ArrivalHome;

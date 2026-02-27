/* eslint-disable ds/no-hardcoded-copy -- BRIK-3 prime DS rules deferred */
/**
 * ReadinessDashboard.tsx
 *
 * Main pre-arrival dashboard component shown to guests before check-in.
 * Displays readiness score, checklist progress, and next action card.
 */

import { type FC, memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { CalendarDays, MapPin, MessageCircle, Sparkles } from 'lucide-react';

import { ReadinessSignalCard, UtilityActionStrip } from '@acme/ui';

import { recordActivationFunnelEvent } from '../../lib/analytics/activationFunnel';
import {
  computeReadinessScore,
  getChecklistItemLabel,
  getCompletedCount,
  getTotalChecklistItems,
} from '../../lib/preArrival';
import type { ChecklistProgress, GuestArrivalState,PreArrivalData  } from '../../types/preArrival';

import ChecklistItem from './ChecklistItem';
import NextActionCard from './NextActionCard';

interface ReadinessDashboardProps {
  /** Pre-arrival data */
  preArrivalData: PreArrivalData;
  /** Guest's arrival state */
  arrivalState: GuestArrivalState;
  /** Check-in date (ISO format) */
  checkInDate: string;
  /** Number of nights */
  nights: number;
  /** Guest's first name */
  firstName: string;
  /** Cash amounts for display */
  cashAmounts: {
    cityTax: number;
    deposit: number;
  };
  /** Handler for checklist item clicks */
  onChecklistItemClick: (item: keyof ChecklistProgress) => void;
  /** Most recent completed checklist item for celebration feedback */
  recentlyCompletedItem?: keyof ChecklistProgress | null;
  /** Optional class name */
  className?: string;
}

/**
 * Format check-in date for display.
 */
function formatCheckInDate(dateStr: string, _t: (key: string) => string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Calculate days until check-in.
 */
function getDaysUntilCheckIn(dateStr: string): number {
  try {
    const checkIn = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkIn.setHours(0, 0, 0, 0);
    const diffTime = checkIn.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

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

export const ReadinessDashboard: FC<ReadinessDashboardProps> = memo(
  function ReadinessDashboard({
    preArrivalData,
    arrivalState,
    checkInDate,
    nights,
    firstName,
    cashAmounts,
    onChecklistItemClick,
    recentlyCompletedItem,
    className = '',
  }) {
    const { t } = useTranslation('PreArrival');

    // Compute readiness metrics
    const { checklistProgress } = preArrivalData;
    const score = useMemo(
      () => computeReadinessScore(checklistProgress),
      [checklistProgress],
    );
    const completedCount = useMemo(
      () => getCompletedCount(checklistProgress),
      [checklistProgress],
    );
    const totalItems = getTotalChecklistItems();

    // Date calculations
    const daysUntil = getDaysUntilCheckIn(checkInDate);
    const formattedDate = formatCheckInDate(checkInDate, t);

    // Is it arrival day?
    const isArrivalDay = arrivalState === 'arrival-day';

    // Handler wrapper with proper types
    const handleItemClick = useCallback(
      (item: keyof ChecklistProgress) => {
        onChecklistItemClick(item);
      },
      [onChecklistItemClick],
    );

    const utilityActions = useMemo(
      () => [
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
              context: {
                surface: isArrivalDay ? 'arrival-day' : 'pre-arrival',
              },
            });
            handleItemClick('locationSaved');
          },
          variant: 'primary' as const,
        },
        {
          id: 'eta',
          label: 'Share ETA',
          icon: CalendarDays,
          onSelect: () => {
            recordActivationFunnelEvent({
              type: 'utility_action_used',
              sessionKey: getFunnelSessionKey(),
              route: '/',
              stepId: 'eta',
              context: {
                surface: isArrivalDay ? 'arrival-day' : 'pre-arrival',
              },
            });
            handleItemClick('etaConfirmed');
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
              context: {
                surface: isArrivalDay ? 'arrival-day' : 'pre-arrival',
              },
            });
            if (typeof window !== 'undefined') {
              window.open('mailto:hostelbrikette@gmail.com', '_self');
            }
          },
        },
      ],
      [handleItemClick, isArrivalDay],
    );

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-info-soft px-3 py-1 text-sm font-medium text-info-foreground">
            <Sparkles className="h-4 w-4" />
            {isArrivalDay
              ? t('header.arrivalDay')
              : t('header.preArrival')}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isArrivalDay
              ? t('header.welcomeArrivalDay', { name: firstName })
              : t('header.welcome', { name: firstName })}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isArrivalDay
              ? t('header.arrivalDaySubtitle')
              : t('header.subtitle')}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {isArrivalDay
              ? 'Final checks now mean faster reception handoff.'
              : 'Complete these steps now to speed up check-in on arrival day.'}
          </p>
          <div className="mt-3">
            <Link
              href="/portal?edit=personalization"
              className="inline-flex rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
            >
              Edit preferences
            </Link>
          </div>
        </div>

        {/* Check-in info card */}
        <div className="flex items-center justify-between rounded-xl bg-info-soft p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info-soft">
              <CalendarDays className="h-5 w-5 text-info-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('checkIn.label')}</p>
              <p className="font-semibold text-foreground">{formattedDate}</p>
            </div>
          </div>
          {!isArrivalDay && daysUntil > 0 && (
            <div className="text-end">
              <p className="text-2xl font-bold text-info-foreground">{daysUntil}</p>
              <p className="text-sm text-muted-foreground">
                {daysUntil === 1 ? t('checkIn.dayLeft') : t('checkIn.daysLeft')}
              </p>
            </div>
          )}
          {isArrivalDay && (
            <div className="rounded-lg bg-success-soft px-3 py-2">
              <p className="font-semibold text-success-foreground">{t('checkIn.today')}</p>
            </div>
          )}
        </div>

        {/* Readiness score */}
        <ReadinessSignalCard
          score={score}
          completedCount={completedCount}
          totalCount={totalItems}
        />

        <UtilityActionStrip actions={utilityActions} />

        {recentlyCompletedItem && (
          <div className="flex animate-pulse items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success-foreground">
            <Sparkles className="h-4 w-4" />
            Nice progress: {getChecklistItemLabel(recentlyCompletedItem)} completed.
          </div>
        )}

        {/* Next action card */}
        <NextActionCard
          checklist={checklistProgress}
          onAction={handleItemClick}
          cashAmounts={cashAmounts}
          recentlyCompletedItem={recentlyCompletedItem}
        />

        {/* Checklist */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('checklist.title')}
          </h2>
          <div className="space-y-2">
            <ChecklistItem
              type="routePlanned"
              completed={checklistProgress.routePlanned}
              onClick={() => handleItemClick('routePlanned')}
            />
            <ChecklistItem
              type="etaConfirmed"
              completed={checklistProgress.etaConfirmed}
              description={
                preArrivalData.etaWindow
                  ? `${preArrivalData.etaWindow} - ${t(`checklist.etaMethod.${preArrivalData.etaMethod || 'other'}`)}`
                  : undefined
              }
              onClick={() => handleItemClick('etaConfirmed')}
            />
            <ChecklistItem
              type="cashPrepared"
              completed={checklistProgress.cashPrepared}
              description={t('checklist.cashPrepared.amount', {
                cityTax: cashAmounts.cityTax,
                deposit: cashAmounts.deposit,
              })}
              onClick={() => handleItemClick('cashPrepared')}
            />
            <ChecklistItem
              type="rulesReviewed"
              completed={checklistProgress.rulesReviewed}
              onClick={() => handleItemClick('rulesReviewed')}
            />
            <ChecklistItem
              type="locationSaved"
              completed={checklistProgress.locationSaved}
              onClick={() => handleItemClick('locationSaved')}
            />
          </div>
        </div>

        {/* Stay info */}
        <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">
              {nights} {nights === 1 ? t('stay.night') : t('stay.nights')}
            </p>
            <p className="text-sm text-muted-foreground">{t('stay.location')}</p>
          </div>
        </div>
      </div>
    );
  },
);

export default ReadinessDashboard;

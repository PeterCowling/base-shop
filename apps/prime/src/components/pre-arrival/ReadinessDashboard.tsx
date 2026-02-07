/**
 * ReadinessDashboard.tsx
 *
 * Main pre-arrival dashboard component shown to guests before check-in.
 * Displays readiness score, checklist progress, and next action card.
 */

import { CalendarDays, MapPin, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { FC, memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  computeReadinessScore,
  getChecklistItemLabel,
  getCompletedCount,
  getReadinessLevel,
  getTotalChecklistItems,
} from '../../lib/preArrival';
import type { ChecklistProgress, PreArrivalData } from '../../types/preArrival';
import type { GuestArrivalState } from '../../types/preArrival';
import ChecklistItem from './ChecklistItem';
import NextActionCard from './NextActionCard';
import ReadinessScore from './ReadinessScore';

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
function formatCheckInDate(dateStr: string, t: (key: string) => string): string {
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
    const level = useMemo(() => getReadinessLevel(score), [score]);
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

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            <Sparkles className="h-4 w-4" />
            {isArrivalDay
              ? t('header.arrivalDay')
              : t('header.preArrival')}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isArrivalDay
              ? t('header.welcomeArrivalDay', { name: firstName })
              : t('header.welcome', { name: firstName })}
          </h1>
          <p className="mt-1 text-gray-600">
            {isArrivalDay
              ? t('header.arrivalDaySubtitle')
              : t('header.subtitle')}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {isArrivalDay
              ? 'Final checks now mean faster reception handoff.'
              : 'Complete these steps now to speed up check-in on arrival day.'}
          </p>
          <div className="mt-3">
            <Link
              href="/portal?edit=personalization"
              className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit preferences
            </Link>
          </div>
        </div>

        {/* Check-in info card */}
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('checkIn.label')}</p>
              <p className="font-semibold text-gray-900">{formattedDate}</p>
            </div>
          </div>
          {!isArrivalDay && daysUntil > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{daysUntil}</p>
              <p className="text-sm text-gray-500">
                {daysUntil === 1 ? t('checkIn.dayLeft') : t('checkIn.daysLeft')}
              </p>
            </div>
          )}
          {isArrivalDay && (
            <div className="rounded-lg bg-green-100 px-3 py-2">
              <p className="font-semibold text-green-700">{t('checkIn.today')}</p>
            </div>
          )}
        </div>

        {/* Readiness score */}
        <div className="flex flex-col items-center rounded-xl bg-white p-6 shadow-sm">
          <ReadinessScore score={score} level={level} />
          <p className="mt-4 text-center text-sm text-gray-600">
            {completedCount} {t('readiness.of')} {totalItems} {t('readiness.itemsComplete')}
          </p>
          <div className="mt-4 w-full">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${score}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-slate-500">
              <span>Start</span>
              <span>Ready</span>
            </div>
          </div>
          {score >= 80 && (
            <p className="mt-3 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              You are ready for arrival
            </p>
          )}
        </div>

        {recentlyCompletedItem && (
          <div className="flex animate-pulse items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
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
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
          <MapPin className="h-5 w-5 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">
              {nights} {nights === 1 ? t('stay.night') : t('stay.nights')}
            </p>
            <p className="text-sm text-gray-500">{t('stay.location')}</p>
          </div>
        </div>
      </div>
    );
  },
);

export default ReadinessDashboard;
